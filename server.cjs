/**
 * ============================================================
 * QUICK GUIDE — SEAT HOLD + BOOKING (JSON-SERVER DEMO)
 * ============================================================
 *
 * ✅ MỤC TIÊU
 * - Giữ ghế 10 phút trên server (expiresAt).
 * - Client chỉ hiển thị countdown, KHÔNG tự quyết ghế có hợp lệ hay không.
 * - Booking CHỈ hợp lệ nếu:
 *    (1) user còn hold hợp lệ (chưa expire)
 *    (2) seats khi booking KHỚP y hệt hold.seats
 *
 * ------------------------------------------------------------
 * 1) FLOW CHUẨN (CLIENT PHẢI GỌI ĐÚNG THỨ TỰ)
 * ------------------------------------------------------------
 *
 * (A) User chọn showtime -> START SESSION (seats = [])
 *  POST /api/seat-holds
 *  Body:
 *    { "showtimeId": 1, "userId": 10, "seats": [] }
 *
 *  Response 201:
 *    {
 *      "id": 5,
 *      "showtimeId": 1,
 *      "userId": 10,
 *      "seats": [],
 *      "expiresAt": "2026-01-01T04:12:34.000Z",
 *      "createdAt": "..."
 *    }
 *
 * (B) User chọn/bỏ ghế -> UPDATE SEATS (trong cùng session, KHÔNG gia hạn expiresAt)
 *  POST /api/seat-holds
 *  Body:
 *    { "showtimeId": 1, "userId": 10, "seats": ["A1","A2"] }
 *
 *  Response 200:
 *    { ...same session..., "seats":["A1","A2"], "expiresAt":"(giữ nguyên)" }
 *
 * (C) User thanh toán -> CREATE BOOKING (phải khớp hold.seats)
 *  POST /api/bookings
 *  Body tối thiểu:
 *    { "showtimeId": 1, "userId": 10, "seats": ["A1","A2"], ...otherFields }
 *
 *  Response 201:
 *    { ...payload..., "id": 123 }
 *
 *  Sau khi booking thành công, server tự xóa hold của user ở showtime đó.
 *
 * ------------------------------------------------------------
 * 2) ENDPOINTS
 * ------------------------------------------------------------
 *
 * [GET] /api/seat-holds
 *  - Dùng để render ghế bị chặn
 *  - Query:
 *     /api/seat-holds?showtimeId=1   (lấy hold active của showtime)
 *     /api/seat-holds?userId=10     (lấy hold active của user)
 *
 * [POST] /api/seat-holds
 *  - START hoặc UPDATE hold session
 *  - Body:
 *     { showtimeId, userId, seats: [] | ["A1","A2"] }
 *
 * [DELETE] /api/seat-holds?showtimeId=1&userId=10
 *  - Clear hold (khi user thoát màn, đổi showtime, hoặc reset)
 *
 * [POST] /api/bookings
 *  - Create booking (điều kiện: hold còn hạn + seats khớp hold.seats)
 *
 * ------------------------------------------------------------
 * 3) STATUS CODES & Ý NGHĨA
 * ------------------------------------------------------------
 *
 * 200 OK
 *  - Update hold seats thành công (đã có session)
 *
 * 201 Created
 *  - Start hold session thành công (seats phải là [])
 *  - Hoặc booking thành công
 *
 * 204 No Content
 *  - Delete hold thành công
 *
 * 400 Bad Request
 *  - Thiếu showtimeId / userId / seats sai kiểu
 *  - Booking thiếu seats hoặc seats rỗng
 *  - Showtime đã kết thúc
 *
 * 404 Not Found
 *  - Showtime không tồn tại
 *
 * 409 Conflict (các lỗi nghiệp vụ)
 *  - Ghế bị hold/booked bởi người khác:
 *      { message:"Seats already held or booked", conflicts:["A1"] }
 *  - Session chưa start hoặc đã hết hạn mà lại update seats:
 *      { action:"START_SESSION", message:"Seat hold expired or not started..." }
 *  - Booking không có hold hoặc hold hết hạn:
 *      { message:"Seat hold not found or expired" }
 *  - Booking seats không khớp hold.seats:
 *      { message:"Seat hold mismatch", expected:[...], received:[...] }
 *
 * ------------------------------------------------------------
 * 4) QUY TẮC QUAN TRỌNG (TEAM PHẢI TUÂN THỦ)
 * ------------------------------------------------------------
 *
 * - Đổi showtime: luôn START SESSION lại với seats=[]
 * - KHÔNG gia hạn expiresAt khi đổi ghế (đúng theo code hiện tại)
 * - Khi booking: seats gửi lên phải đúng như hold.seats server đang lưu
 *
 * ============================================================
 */

//! ======================== IMPORT THƯ VIỆN ========================
// json-server: tạo server REST API từ db.json (dùng lowdb làm "DB" file JSON)
// json-server-auth: thêm auth (register/login), phân quyền theo rules
// path: join đường dẫn file an toàn cho Win/Mac/Linux
// fs: thao tác file hệ thống (trong file này CHƯA dùng, có thể bỏ nếu không cần)
const jsonServer = require("json-server");
const auth = require("json-server-auth");
const path = require("path");
const fs = require("fs");

//! ======================== KHỞI TẠO APP ========================
// server: app giống Express
// router: router CRUD tự động dựa trên db.json (GET/POST/PATCH/DELETE /collection)
// middlewares: logger + static + cors + no-cache
const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, "db.json"));
const middlewares = jsonServer.defaults();

// Bind router.db (lowdb instance) vào server để có thể truy cập DB ở custom route
// router.db là lowdb: cho phép get/set/find/write vào db.json
server.db = router.db;

// Bật default middlewares: log request, CORS, cache-control...
server.use(middlewares);

// Body parser: parse JSON body -> giúp dùng req.body trong POST/PATCH
server.use(jsonServer.bodyParser);

// ============================================================
// SEAT-HOLD (GIỮ GHẾ) RULES
// - Server là "nguồn sự thật" cho 10 phút giữ ghế.
// - Client chỉ hiển thị countdown dựa trên expiresAt, không được tự quyết.
// - Chọn showtime -> tạo hold session (có thể seats=[]).
// - Trong 10 phút user có thể chọn/bỏ chọn ghế.
// - Hết hạn -> hold tự purge và không cho booking.
// NOTE: json-server dùng lowdb (file JSON) -> purge chạy theo interval + mỗi request.
// ============================================================

// Thời lượng giữ ghế: 10 phút (ms)
const HOLD_DURATION_MS = 10 * 60 * 1000;

/**
 * purgeExpiredSeatHolds()
 * - Mục đích: dọn các hold hết hạn trong "seat_holds"
 * - Kỹ thuật:
 *   + router.db.get("seat_holds").value() -> lấy mảng seat_holds
 *   + filter giữ lại item có expiresAt và expiresAt > now
 *   + nếu khác length -> ghi lại DB bằng .set(...).write()
 * - Return: danh sách hold còn hiệu lực
 */
const purgeExpiredSeatHolds = () => {
  // Lấy danh sách hold từ lowdb. Nếu null/undefined -> fallback []
  const holds = router.db.get("seat_holds").value() || [];
  const now = Date.now();

  // Lọc ra hold còn hiệu lực
  const active = holds.filter((item) => {
    // Không có expiresAt -> xem như dữ liệu cũ/bẩn -> loại bỏ để tránh giữ vô hạn
    if (!item.expiresAt) return false;

    // Convert ISO string -> timestamp để so sánh với now
    return new Date(item.expiresAt).getTime() > now;
  });

  // Nếu có thay đổi (tức có hold bị xóa) -> ghi lại vào db.json
  if (active.length !== holds.length) {
    router.db.set("seat_holds", active).write();
  }

  return active;
};

/**
 * getEndedShowtimeIds()
 * - Mục đích: lấy danh sách showtime đã kết thúc (id)
 * - Kỹ thuật:
 *   + router.db.get("showtimes").value()
 *   + filter showtime có endTime/startTime <= now
 *   + map ra String(id) để so sánh đồng nhất
 */
const getEndedShowtimeIds = () => {
  const showtimes = router.db.get("showtimes").value() || [];
  const now = Date.now();

  return showtimes
    .filter((showtime) => {
      // Nếu không có endTime -> fallback startTime (tùy dữ liệu)
      const endTime = showtime.endTime || showtime.startTime;
      if (!endTime) return false;

      // Nếu endTime <= hiện tại => showtime đã kết thúc
      return new Date(endTime).getTime() <= now;
    })
    .map((showtime) => String(showtime.id));
};

/**
 * purgeExpiredShowtimeData()
 * - Mục đích: dọn dữ liệu liên quan showtime đã kết thúc:
 *   + bookings thuộc showtime đã ended
 *   + seat_holds thuộc showtime đã ended
 * - Kỹ thuật:
 *   + dùng Set để check endedIds nhanh O(1)
 *   + filter bỏ những record có showtimeId nằm trong endedIds
 *   + nếu có thay đổi -> .set(...).write()
 */
const purgeExpiredShowtimeData = () => {
  const endedIds = new Set(getEndedShowtimeIds());
  if (endedIds.size === 0) return;

  // Dọn bookings
  const bookings = router.db.get("bookings").value() || [];
  const nextBookings = bookings.filter(
    (booking) => !endedIds.has(String(booking.showtimeId))
  );
  if (nextBookings.length !== bookings.length) {
    router.db.set("bookings", nextBookings).write();
  }

  // Dọn seat_holds
  const holds = router.db.get("seat_holds").value() || [];
  const nextHolds = holds.filter(
    (item) => !endedIds.has(String(item.showtimeId))
  );
  if (nextHolds.length !== holds.length) {
    router.db.set("seat_holds", nextHolds).write();
  }
};

// Tính expiresAt cho 1 phiên giữ ghế: now + 10 phút, xuất ISO string
// dùng khi tạo hold mới
const getHoldExpiry = () =>
  new Date(Date.now() + HOLD_DURATION_MS).toISOString();

/**
 * getNextId(items)
 * - Mục đích: sinh id tăng dần cho record mới
 * - Kỹ thuật: reduce lấy max id dạng number rồi +1
 */
const getNextId = (items) =>
  items.reduce((max, item) => {
    if (typeof item.id === "number" && item.id > max) return item.id;
    return max;
  }, 0) + 1;

/**
 * getBookedSeatsByShowtime(showtimeId)
 * - Mục đích: lấy tập ghế đã được booking của 1 showtime
 * - Kỹ thuật:
 *   + filter bookings theo showtimeId
 *   + flatMap tất cả seats thành 1 mảng
 *   + return Set để check nhanh seat đã booked hay chưa
 */
const getBookedSeatsByShowtime = (showtimeId) => {
  const bookings = router.db.get("bookings").value() || [];
  return new Set(
    bookings
      .filter((booking) => String(booking.showtimeId) === String(showtimeId))
      .flatMap((booking) => booking.seats || [])
  );
};

/**
 * getHeldSeatsByShowtime(showtimeId, excludeUserId)
 * - Mục đích: lấy danh sách ghế đang bị giữ (hold) ở 1 showtime
 * - excludeUserId: loại ghế hold của user hiện tại (để user update seat của mình không bị conflict)
 * - Kỹ thuật:
 *   + purgeExpiredSeatHolds() trước để đảm bảo chỉ dùng hold còn hạn
 *   + filter showtimeId, filter excludeUserId, flatMap seats
 */
const getHeldSeatsByShowtime = (showtimeId, excludeUserId) => {
  const holds = purgeExpiredSeatHolds();
  return holds
    .filter((hold) => String(hold.showtimeId) === String(showtimeId))
    .filter((hold) =>
      excludeUserId ? String(hold.userId) !== String(excludeUserId) : true
    )
    .flatMap((hold) => hold.seats || []);
};

//! ======================== REWRITE ROUTE /api/* ========================
// Mọi request /api/xxx sẽ được rewrite thành /xxx
// Ví dụ: /api/movies -> /movies, giúp FE luôn gọi /api/... cho đẹp
server.use(
  jsonServer.rewriter({
    "/api/*": "/$1",
  })
);

//! ======================== CUSTOM ROUTE: CHECK USERNAME ========================
// GET /check-username?userName=abc
// Public: dùng cho màn register check trùng userName
server.get("/check-username", (req, res) => {
  const { userName } = req.query;

  // Lấy users từ lowdb
  const users = router.db.get("users").value();

  // some() -> true nếu có userName trùng
  const exists = users && users.some((u) => u.userName === userName);

  return res.json({ exists });
});

//! ======================== CUSTOM ROUTES ========================

// Custom route for checking email availability (Public)
server.get("/check-email", (req, res) => {
  const { email } = req.query;
  const users = router.db.get("users").value() || [];
  const exists = users.some((u) => u.email === email);
  res.json({ exists });
});

// Ensure new registrations have unique email and set default status = true
server.post("/register", (req, res, next) => {
  const { email } = req.body || {};
  const users = router.db.get("users").value() || [];

  if (email && users.some((u) => u.email === email)) {
    return res
      .status(400)
      .json({ message: "Email đã tồn tại. Vui lòng sử dụng email khác." });
  }

  req.body.status = true;
  next();
});

// ======================== DASHBOARD USERS COUNT ========================
// GET /users-count
// Public: chỉ trả { count } để thống kê dashboard

server.get("/users-count", (req, res) => {
  const users = router.db.get("users").value();
  return res.json({ count: users ? users.length : 0 });
});

//! ======================== GET /seat-holds ========================
// Trả về danh sách hold còn hiệu lực (để client render ghế bị chặn)
// Có thể filter theo showtimeId hoặc userId
server.get("/seat-holds", (req, res) => {
  // Dọn dữ liệu showtime cũ trước
  purgeExpiredShowtimeData();

  // Dọn hold hết hạn và lấy list active
  const active = purgeExpiredSeatHolds();

  // Query params: ?showtimeId=...&userId=...
  const { showtimeId, userId } = req.query;

  const filtered = active.filter((item) => {
    if (showtimeId && String(item.showtimeId) !== String(showtimeId)) {
      return false;
    }
    if (userId && String(item.userId) !== String(userId)) {
      return false;
    }
    return true;
  });

  return res.json(filtered);
});

//! ======================== POST /seat-holds ========================
// Tạo/cập nhật phiên giữ ghế cho 1 user + showtime.
// - seats có thể là [] để "start session" ngay khi user chọn showtime.
// - QUAN TRỌNG: expiresAt KHÔNG tự gia hạn khi user đổi ghế.
// OPTION A: Mỗi user chỉ có 1 hold session active tại 1 thời điểm.
server.post("/seat-holds", (req, res) => {
  const payload = req.body || {};
  const { showtimeId, seats, userId } = payload;

  // Validate input
  if (!showtimeId || !Array.isArray(seats) || !userId) {
    return res
      .status(400)
      .json({ message: "Missing showtimeId, seats, or userId" });
  }

  // Dọn rác showtime/bookings/holds cũ
  purgeExpiredShowtimeData();

  // Kiểm tra showtime tồn tại
  const showtime = router.db
    .get("showtimes")
    .find({ id: Number(showtimeId) }) // lowdb find theo object
    .value();

  if (!showtime) {
    return res.status(404).json({ message: "Showtime not found" });
  }

  // Không cho giữ ghế nếu showtime đã kết thúc
  const endTime = showtime.endTime || showtime.startTime;
  if (endTime && new Date(endTime).getTime() <= Date.now()) {
    return res.status(400).json({ message: "Showtime already ended" });
  }

  // Check conflict ghế:
  // - bookedSeats: ghế đã booking
  // - heldSeats: ghế bị user khác giữ (excludeUserId = userId hiện tại)
  const bookedSeats = getBookedSeatsByShowtime(showtimeId);
  const heldSeats = new Set(getHeldSeatsByShowtime(showtimeId, userId));
  const conflicts = [];

  for (const code of seats) {
    if (bookedSeats.has(code) || heldSeats.has(code)) {
      conflicts.push(code);
    }
  }

  // Có conflict -> trả 409
  if (conflicts.length > 0) {
    return res
      .status(409)
      .json({ message: "Seats already held or booked", conflicts });
  }

  // Lấy danh sách hold active (đã purge)
  const holds = purgeExpiredSeatHolds();

  // Tìm hold session hiện có của user+showtime
  const existing = holds.find(
    (item) =>
      String(item.userId) === String(userId) &&
      String(item.showtimeId) === String(showtimeId)
  );

  // CASE 1: chưa có hold active cho showtime này
  // Rule: phải start session bằng seats=[]
  // Nếu seats != [] mà chưa có session => coi như hết hạn/chưa start -> bắt start lại
  if (!existing) {
    if (seats.length > 0) {
      return res.status(409).json({
        message:
          "Seat hold expired or not started. Please restart seat selection.",
        action: "START_SESSION",
      });
    }

    // OPTION A:
    // Start session showtime mới -> xóa mọi hold khác của user
    const holdsWithoutUser = holds.filter(
      (item) => String(item.userId) !== String(userId)
    );

    // Tạo hold mới
    const nextHold = {
      id: getNextId(holdsWithoutUser), // id tự tăng
      showtimeId,
      seats: [], // start session rỗng
      userId,
      expiresAt: getHoldExpiry(), // now + 10 phút
      createdAt: new Date().toISOString(),
    };

    // Ghi DB (set toàn bộ mảng mới)
    router.db.set("seat_holds", [...holdsWithoutUser, nextHold]).write();

    return res.status(201).json(nextHold);
  }

  // CASE 2: đã có hold active -> update seats trong cùng session
  // LƯU Ý: không gia hạn expiresAt
  const nextHold = {
    ...existing,
    seats,
    expiresAt: existing.expiresAt,
    updatedAt: new Date().toISOString(),
  };

  // Defensive:
  // Nếu dữ liệu cũ bị lỗi (1 user nhiều hold), chỉ giữ hold đúng showtime hiện tại
  const nextHolds = holds
    .filter(
      (item) =>
        String(item.userId) !== String(userId) ||
        String(item.showtimeId) === String(showtimeId)
    )
    .map((item) => (item.id === existing.id ? nextHold : item));

  router.db.set("seat_holds", nextHolds).write();

  return res.status(200).json(nextHold);
});

//! ======================== DELETE /seat-holds (theo query) ========================
// Ví dụ:
// - DELETE /seat-holds?userId=1  -> xóa mọi hold của userId=1
// - DELETE /seat-holds?showtimeId=5&userId=1 -> xóa hold của userId=1 ở showtime 5
server.delete("/seat-holds", (req, res) => {
  const { showtimeId, userId } = req.query;

  const holds = router.db.get("seat_holds").value() || [];

  // Filter: giữ lại những item KHÔNG match điều kiện xóa
  const nextHolds = holds.filter((item) => {
    // Nếu có showtimeId mà item khác showtimeId -> giữ
    if (showtimeId && String(item.showtimeId) !== String(showtimeId)) {
      return true;
    }
    // Nếu có userId mà item khác userId -> giữ
    if (userId && String(item.userId) !== String(userId)) {
      return true;
    }
    // Còn lại: match điều kiện xóa -> loại
    return false;
  });

  router.db.set("seat_holds", nextHolds).write();
  return res.status(204).end();
});

//! ======================== DELETE /seat-holds/:id ========================
// Xóa hold theo id cụ thể
server.delete("/seat-holds/:id", (req, res) => {
  const holds = router.db.get("seat_holds").value() || [];
  const nextHolds = holds.filter(
    (item) => String(item.id) !== String(req.params.id)
  );
  router.db.set("seat_holds", nextHolds).write();
  return res.status(204).end();
});

//! ======================== POST /bookings ========================
// Tạo booking.
// REQUIRE:
// 1) user phải có hold hợp lệ (chưa hết hạn) cho showtime đó
// 2) seats request phải KHỚP y hệt hold.seats (chống lách)
server.post("/bookings", (req, res) => {
  const payload = req.body || {};
  const { showtimeId, seats, userId } = payload;

  // Validate: booking phải có ghế (seats.length > 0)
  if (!showtimeId || !Array.isArray(seats) || seats.length === 0 || !userId) {
    return res
      .status(400)
      .json({ message: "Missing showtimeId, seats, or userId" });
  }

  // Dọn showtime/bookings/holds cũ
  purgeExpiredShowtimeData();

  // Check showtime tồn tại
  const showtime = router.db
    .get("showtimes")
    .find({ id: Number(showtimeId) })
    .value();

  if (!showtime) {
    return res.status(404).json({ message: "Showtime not found" });
  }

  // Không cho booking nếu showtime đã kết thúc
  const endTime = showtime.endTime || showtime.startTime;
  if (endTime && new Date(endTime).getTime() <= Date.now()) {
    return res.status(400).json({ message: "Showtime already ended" });
  }

  // Check conflict:
  // - bookedSeats: ghế đã booking
  // - heldSeats: ghế user khác đang giữ (exclude userId hiện tại)
  const bookings = router.db.get("bookings").value() || [];
  const bookedSeats = getBookedSeatsByShowtime(showtimeId);
  const heldSeats = new Set(getHeldSeatsByShowtime(showtimeId, userId));

  const conflicts = [];
  for (const code of seats) {
    if (bookedSeats.has(code) || heldSeats.has(code)) {
      conflicts.push(code);
    }
  }

  if (conflicts.length > 0) {
    return res.status(409).json({ message: "Seats already booked", conflicts });
  }

  // Enforce: booking chỉ hợp lệ nếu còn hold và seats khớp hold
  const activeHolds = purgeExpiredSeatHolds();
  const myHold = activeHolds.find(
    (h) =>
      String(h.showtimeId) === String(showtimeId) &&
      String(h.userId) === String(userId)
  );

  // holdSeats: ghế server đang giữ cho user
  const holdSeats = Array.isArray(myHold?.seats) ? myHold.seats : [];

  // requestedSeats: ghế user gửi lên khi booking
  const requestedSeats = seats;

  // Check "khớp": cùng số lượng + mọi ghế request nằm trong holdSeats
  const sameSeatCount = holdSeats.length === requestedSeats.length;
  const sameSeatSet =
    sameSeatCount && requestedSeats.every((code) => holdSeats.includes(code));

  if (!myHold || !myHold.expiresAt) {
    return res.status(409).json({ message: "Seat hold not found or expired" });
  }

  if (!sameSeatSet) {
    return res.status(409).json({
      message: "Seat hold mismatch",
      expected: holdSeats,
      received: requestedSeats,
    });
  }

  // Tạo booking mới với id tự tăng
  const nextBooking = {
    ...payload,
    id: getNextId(bookings),
  };

  // Ghi booking vào DB
  const nextBookings = [...bookings, nextBooking];
  router.db.set("bookings", nextBookings).write();

  // Sau khi booking thành công: xóa hold của user ở showtime đó
  if (userId) {
    const holds = router.db.get("seat_holds").value() || [];
    const nextHolds = holds.filter(
      (item) =>
        String(item.showtimeId) !== String(showtimeId) ||
        String(item.userId) !== String(userId)
    );
    router.db.set("seat_holds", nextHolds).write();
  }

  return res.status(201).json(nextBooking);
});

//! ======================== AUTH RULES ========================
// rewriter: quy định quyền truy cập theo resource
// 6 = read/write, 4 = read only, 0 = no access
// 3 chữ số: owner / logged-in / guest
const rules = auth.rewriter({
  users: 660, // owner rw, logged-in rw, guest none
  movies: 664, // guest read, logged-in rw
  news: 664,
  promotions: 664,
  categories: 664,
  settings: 664,
  theaters: 664,
  screens: 664,
  seats: 664,
  showtimes: 664,
  regions: 664,
  bookings: 664,
  seat_holds: 664,
  festivals: 664,
});

// Apply rules trước, rồi apply auth middleware
server.use(rules);
server.use(auth);

// Mount router cuối cùng: để CRUD mặc định của json-server chạy
server.use(router);

//! ======================== START SERVER ========================
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  // Dọn rác ngay khi server start
  purgeExpiredShowtimeData();
  purgeExpiredSeatHolds();

  // Dọn định kỳ mỗi 60s
  setInterval(purgeExpiredShowtimeData, 60 * 1000);
  setInterval(purgeExpiredSeatHolds, 60 * 1000);

  // Log endpoints
  console.log(`🚀 JSON Server is running on http://localhost:${PORT}`);
  console.log(`📊 Database: db.json`);
  console.log(`🔐 Auth endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/register`);
  console.log(`   POST http://localhost:${PORT}/api/login`);
  console.log(`📝 API endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/movies`);
  console.log(`   GET  http://localhost:${PORT}/api/news`);
  console.log(`   GET  http://localhost:${PORT}/api/promotions`);
});
