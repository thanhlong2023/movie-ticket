import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  useParams,
  useSearchParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import api from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { showNotification } from "../../../features/notificationSlice";
import { useAppDispatch } from "../../../hook/hook";
import styles from "./MovieDetail.module.css";
import type { Booking, Movie, Showtime } from "../../../types";

/**
 * ============================================================
 * QUICK GUIDE — MOVIE DETAIL (SHOWTIME + SEAT HOLD + BOOKING)
 * ============================================================
 *
 * ✅ MỤC TIÊU UI/UX Ở TRANG NÀY
 * - Hiển thị thông tin phim + trailer.
 * - Cho phép chọn: Rạp -> Ngày -> Suất chiếu -> Ghế.
 * - Tính tổng tiền theo loại ghế.
 * - Điều hướng qua trang thanh toán và mang theo bookingInfo.
 *
 * ✅ NGUỒN DỮ LIỆU & “SOURCE OF TRUTH”
 * - Movie + showtimes: lấy từ API.
 * - Thông tin showtime đang chọn: lưu trong URL query params
 *   (để refresh/share link vẫn giữ được state chọn suất).
 * - Trạng thái “giữ ghế 10 phút” (seat-hold): server là nguồn sự thật
 *   thông qua `expiresAt` (xem logic ở `server.cjs`).
 *
 * ------------------------------------------------------------
 * 1) FLOW GIỮ GHẾ (MATCH VỚI server.cjs)
 * ------------------------------------------------------------
 * (A) User chọn suất chiếu => START SESSION
 *     POST /seat-holds { showtimeId, userId, seats: [] }
 *     -> server trả expiresAt (10 phút).
 *
 * (B) User chọn/bỏ ghế => UPDATE SEATS (không gia hạn expiresAt)
 *     POST /seat-holds { showtimeId, userId, seats: ["A1", ...] }
 *
 * (C) User bấm "Thanh toán" => điều hướng sang PaymentPage
 *     PaymentPage sẽ dùng expiresAt để tiếp tục countdown.
 *
 * (D) Nếu hết hạn => clear selection + xoá hold trên server.
 *
 * ------------------------------------------------------------
 * 2) TẠI SAO DÙNG URL QUERY PARAMS CHO SHOWTIME?
 * ------------------------------------------------------------
 * - Cho phép refresh mà không mất suất chiếu đang chọn.
 * - Cho phép chia sẻ link suất chiếu.
 * - Giữ showtimeId/startTime/giá/phòng/rạp... đồng nhất cho Payment.
 *
 * ------------------------------------------------------------
 * 3) NHỮNG ĐIỂM CẦN CẨN THẬN
 * ------------------------------------------------------------
 * - Khi đổi rạp hoặc đổi suất chiếu: cần reset ghế + (nếu có) xoá hold cũ.
 * - Khi rời trang mà chưa vào Payment: cần xoá hold để giải phóng ghế.
 *   => dùng `navigatingToPaymentRef` để tránh xoá hold khi user đi Payment.
 * ============================================================
 */

interface Screen {
  id: number;
  theaterId: number;
  name: string;
  type: string;
  capacity: number;
  rows: number;
  cols: number;
}

interface Seat {
  id: number;
  screenId: number;
  row: string;
  col: number;
  code: string;
  type: "standard" | "vip" | "couple";
  status: "active" | "hidden" | "maintenance";
}

interface SeatHold {
  id: number;
  showtimeId: number;
  seats: string[];
  userId: number;
  expiresAt?: string;
}

type TheaterLite = {
  id: number;
  name: string;
};

type ShowtimeExpanded = Showtime & {
  screen?: { id: number; type?: string; name?: string };
  theater?: TheaterLite;
};

const MovieDetail: React.FC = () => {
  //! ======================== HOOKS/ROUTING/CONTEXT ========================
  // dispatch: dùng cho Notification (Redux)
  // useParams: lấy movie id từ URL (/home/movie/:id)
  // useSearchParams: lưu showtime selection vào query string
  // useNavigate/useLocation: điều hướng và build returnUrl cho PaymentPage
  // useAuth: lấy user hiện tại (để bắt login trước khi chọn ghế/thanh toán)
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); // Auth context
  const userId = user?.id;

  //! ======================== "NAVIGATING" FLAG ========================
  // Dùng ref để tránh re-render khi set.
  // Mục đích: phân biệt user rời trang bình thường (phải xoá hold)
  //           với user bấm "Thanh toán" (không xoá hold, vì PaymentPage cần nó).
  const navigatingToPaymentRef = useRef(false);

  //! ======================== MOVIE UI STATE ========================
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  //! ======================== BOOKING FLOW STATE ========================
  // selectedTheaterId: chọn rạp (UI tabs). Không bắt buộc lưu vào URL.
  const [selectedTheaterId, setSelectedTheaterId] = useState<number | null>(
    null
  );

  //! ======================== SHOWTIME STATE (FROM URL) ========================
  // Dùng query params làm “single source” cho suất chiếu đang chọn.
  // Lưu ý: giá/format/theaterName/screenId... được bơm vào URL khi click timeslot.
  const showtimeId = searchParams.get("showtimeId");
  const startTime = searchParams.get("startTime") || "";
  const price = Number(searchParams.get("price")) || 50000;
  const priceVip = Number(searchParams.get("priceVip")) || 70000;
  const priceCouple = Number(searchParams.get("priceCouple")) || 120000;
  const screenId = searchParams.get("screenId");
  const screenType = searchParams.get("screenType") || "2D";
  const theaterName = searchParams.get("theaterName") || "";

  //! ======================== SEAT SELECTION STATE ========================
  // screen + seats: load theo screenId
  // selectedSeats: danh sách seat codes user chọn
  // totalPrice: tổng tiền tính theo loại ghế
  const [screen, setScreen] = useState<Screen | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showtimes, setShowtimes] = useState<ShowtimeExpanded[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");

  //! ======================== SERVER DATA: BOOKED + HOLDS + COUNTDOWN ========================
  // bookedSeats: ghế đã booking (không thể chọn)
  // seatHolds: ghế đang bị user khác giữ (không thể chọn)
  // holdExpiresAt: nguồn sự thật countdown (server cấp)
  // holdTimeLeft: UI countdown hiển thị (ms)
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [seatHolds, setSeatHolds] = useState<SeatHold[]>([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [holdTimeLeft, setHoldTimeLeft] = useState(0);

  useEffect(() => {
    //! ======================== FETCH MOVIE + SHOWTIMES ========================
    // Load song song (Promise.all) để tối ưu thời gian.
    // showtimes dùng _expand để lấy thêm screen/theater (json-server).
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [movieRes, showtimesRes] = await Promise.all([
          api.get(`/movies/${id}`),
          api.get(`/showtimes?movieId=${id}&_expand=screen&_expand=theater`),
        ]);
        setMovie(movieRes.data);
        const loadedShowtimes: ShowtimeExpanded[] = Array.isArray(
          showtimesRes.data
        )
          ? showtimesRes.data
          : [];
        setShowtimes(loadedShowtimes);

        if (loadedShowtimes.length > 0) {
          // Nếu chưa chọn ngày, default ngày đầu tiên của data.
          const firstDate = loadedShowtimes[0].startTime.split("T")[0];
          setSelectedDate((prev) => prev || firstDate);
        }
      } catch (error) {
        console.error("Failed to fetch movie details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    //! ======================== FETCH SCREEN + SEATS (BY screenId) ========================
    // Khi chọn 1 suất chiếu -> URL có screenId -> load screen + sơ đồ ghế.
    // Dùng cờ isActive để tránh setState sau khi component unmount.
    if (!screenId) {
      setScreen(null);
      setSeats([]);
      return;
    }
    let isActive = true;
    (async () => {
      try {
        const [screenRes, seatsRes] = await Promise.all([
          api.get(`/screens/${screenId}`),
          api.get(`/seats?screenId=${screenId}`),
        ]);
        if (!isActive) return;
        setScreen(screenRes.data);
        setSeats(seatsRes.data);
      } catch {
        if (!isActive) return;
        setScreen(null);
        setSeats([]);
      }
    })();
    return () => {
      isActive = false;
    };
  }, [screenId]);

  useEffect(() => {
    //! ======================== SYNC THEATER/DATE FROM showtimeId ========================
    // Khi URL đã có showtimeId (ví dụ: refresh trang),
    // ta map ngược lại để highlight đúng rạp/ngày.
    if (!showtimeId) return;
    const activeShowtime = showtimes.find(
      (s) => String(s.id) === String(showtimeId)
    );
    if (!activeShowtime) return;
    setSelectedTheaterId(activeShowtime.theaterId);
    setSelectedDate(activeShowtime.startTime.split("T")[0]);
  }, [showtimeId, showtimes]);

  useEffect(() => {
    //! ======================== FETCH BOOKED SEATS (BY showtimeId) ========================
    // Ghế đã booking sẽ bị block, không cho chọn.
    const fetchBookings = async () => {
      if (!showtimeId) {
        setBookedSeats([]);
        return;
      }
      try {
        const res = await api.get(`/bookings?showtimeId=${showtimeId}`);
        const occupied = (res.data as Booking[]).flatMap(
          (booking) => booking.seats
        );
        setBookedSeats(occupied);
      } catch {
        setBookedSeats([]);
      }
    };
    fetchBookings();
  }, [showtimeId]);

  useEffect(() => {
    //! ======================== FETCH/POLL SEAT HOLDS (BY showtimeId) ========================
    // Lấy danh sách hold active để:
    // - block ghế user khác đang giữ
    // - lấy expiresAt của chính mình (nếu đã có session)
    // Poll 30s để UI cập nhật theo thời gian thực tương đối.
    let isActive = true;
    const fetchSeatHolds = async () => {
      if (!showtimeId) {
        if (isActive) {
          setSeatHolds([]);
          setHoldExpiresAt(null);
        }
        return;
      }
      try {
        const res = await api.get(`/seat-holds?showtimeId=${showtimeId}`);
        if (!isActive) return;
        const holds = Array.isArray(res.data) ? res.data : [];
        setSeatHolds(holds);
        if (userId != null) {
          const myHold = holds.find(
            (hold: SeatHold) => String(hold.userId) === String(userId)
          );
          if (myHold?.expiresAt) {
            setHoldExpiresAt(myHold.expiresAt);
          }
        }
      } catch {
        if (isActive) setSeatHolds([]);
      }
    };

    fetchSeatHolds();
    const interval = setInterval(fetchSeatHolds, 30000);
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [showtimeId, userId]);

  const formatHoldTime = (ms: number) => {
    // UI helper: đổi ms -> mm:ss
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  const formatTime = (isoString: string) => {
    // UI helper: hiển thị giờ (HH:mm) theo locale vi-VN
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    //! ======================== START HOLD SESSION (WHEN showtime SELECTED) ========================
    // Khi URL có showtimeId => coi như user đã chọn suất chiếu.
    // Theo rule server: phải start session bằng seats=[] để server cấp expiresAt.
    // NOTE: server có thể trả 409 nếu user gọi update seats khi chưa start.
    if (userId == null || !showtimeId) {
      setHoldExpiresAt(null);
      setHoldTimeLeft(0);
      return;
    }
    let isActive = true;
    (async () => {
      try {
        const res = await api.post("/seat-holds", {
          showtimeId: Number(showtimeId),
          seats: [],
          userId,
        });
        if (!isActive) return;
        if (res.data?.expiresAt) setHoldExpiresAt(res.data.expiresAt);
      } catch {
        // ignore start-session errors (e.g., showtime ended)
      }
    })();
    return () => {
      isActive = false;
    };
  }, [showtimeId, userId]);

  useEffect(() => {
    //! ======================== CLEANUP HOLD ON UNMOUNT ========================
    // Nếu user rời trang (back/đổi route/close tab) mà CHƯA bấm "Thanh toán",
    // xoá hold để:
    // - giải phóng ghế cho người khác
    // - reset timer
    // Nếu đang đi Payment: KHÔNG xoá hold (PaymentPage vẫn cần session này).
    return () => {
      if (userId == null || !showtimeId) return;
      if (navigatingToPaymentRef.current) return;
      api
        .delete(`/seat-holds?showtimeId=${showtimeId}&userId=${userId}`)
        .catch(() => {});
    };
  }, [showtimeId, userId]);

  const seatGrid = useMemo(() => {
    // seatGrid: alias để dễ đọc trong JSX
    return seats;
  }, [seats]);

  const uniqueTheaters = useMemo(() => {
    // Lấy danh sách rạp duy nhất từ showtimes (để render tab rạp)
    const theatersMap = new Map<number, TheaterLite>();
    showtimes.forEach((st) => {
      if (st.theater) {
        theatersMap.set(st.theaterId, st.theater);
      }
    });
    return Array.from(theatersMap.values());
  }, [showtimes]);

  const uniqueDates = useMemo(() => {
    // Lấy danh sách ngày (YYYY-MM-DD) còn suất chiếu trong tương lai.
    // Nếu đã chọn rạp -> chỉ tính các ngày của rạp đó.
    const now = new Date();
    const futureShowtimes = showtimes.filter(
      (st) => new Date(st.startTime) > now
    );
    const relevantShowtimes = selectedTheaterId
      ? futureShowtimes.filter((st) => st.theaterId === selectedTheaterId)
      : futureShowtimes;

    const dates = [
      ...new Set(relevantShowtimes.map((st) => st.startTime.split("T")[0])),
    ];
    return dates.sort();
  }, [showtimes, selectedTheaterId]);

  const filteredShowtimes = useMemo(() => {
    // Lọc suất chiếu theo: rạp đang chọn + ngày đang chọn + chưa qua giờ.
    if (!selectedTheaterId) return [];
    const now = new Date();
    return showtimes.filter((st) => {
      const showtimeDate = st.startTime.split("T")[0];
      const showtimeStart = new Date(st.startTime);
      return (
        st.theaterId === selectedTheaterId &&
        showtimeDate === selectedDate &&
        showtimeStart > now
      );
    });
  }, [showtimes, selectedDate, selectedTheaterId]);

  const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const getRowLabel = (rowIndex: number) =>
    rowIndex < rowLabels.length ? rowLabels[rowIndex] : `R${rowIndex + 1}`;
  const seatMap = useMemo(() => {
    // Map (row-col) -> Seat để render theo grid rows/cols nhanh O(1)
    const map = new Map<string, Seat>();
    seatGrid.forEach((seat) => {
      map.set(`${seat.row}-${seat.col}`, seat);
    });
    return map;
  }, [seatGrid]);

  const groupedSeats = useMemo(() => {
    // Fallback render: nếu screen.rows/cols không có,
    // group theo seat.row để render theo dữ liệu seatGrid.
    return seatGrid.reduce((acc, seat) => {
      if (!acc[seat.row]) acc[seat.row] = [];
      acc[seat.row].push(seat);
      acc[seat.row].sort((a, b) => a.col - b.col);
      return acc;
    }, {} as Record<string, Seat[]>);
  }, [seatGrid]);

  const sortedRows = useMemo(() => {
    return Object.keys(groupedSeats).sort();
  }, [groupedSeats]);

  const getSeatPrice = useCallback(
    (seat: Seat): number => {
      // Giá tuỳ loại ghế.
      if (seat.type === "vip") return priceVip;
      if (seat.type === "couple") return priceCouple;
      return price;
    },
    [price, priceCouple, priceVip]
  );

  useEffect(() => {
    //! ======================== CALC TOTAL PRICE ========================
    // Re-calc mỗi khi selectedSeats thay đổi.
    const total = selectedSeats.reduce((acc, code) => {
      const seat = seatGrid.find((item) => item.code === code);
      if (!seat) return acc;
      return acc + getSeatPrice(seat);
    }, 0);
    setTotalPrice(total);
  }, [selectedSeats, seatGrid, getSeatPrice]);

  const blockedSeats = useMemo(() => {
    // Ghế bị block = ghế đã booking + ghế đang bị người khác hold.
    // (exclude ghế hold của chính mình để user có thể update seats)
    const heldByOthers = seatHolds
      .filter((hold) => String(hold.userId) !== String(userId))
      .flatMap((hold) => hold.seats || []);
    return new Set([...bookedSeats, ...heldByOthers]);
  }, [bookedSeats, seatHolds, userId]);

  useEffect(() => {
    //! ======================== UPDATE HOLD WHEN SEAT CHANGES ========================
    // Khi user chọn/bỏ ghế -> gửi lên server để giữ ghế.
    // Debounce nhẹ để tránh spam request khi click liên tục.
    // Lưu ý theo server.cjs: update KHÔNG gia hạn expiresAt.
    if (userId == null || !showtimeId) return;
    let isActive = true;
    const debounceMs = 400;
    const timer = setTimeout(async () => {
      if (!isActive) return;
      try {
        const res = await api.post("/seat-holds", {
          showtimeId: Number(showtimeId),
          seats: selectedSeats,
          userId,
        });
        if (!isActive) return;
        if (res.data?.expiresAt) {
          setHoldExpiresAt(res.data.expiresAt);
        }
        // Refresh seat-holds để UI block seat realtime hơn.
        const holdsRes = await api.get(`/seat-holds?showtimeId=${showtimeId}`);
        if (isActive) setSeatHolds(holdsRes.data || []);
      } catch {
        // ignore hold update errors
      }
    }, debounceMs);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [selectedSeats, showtimeId, userId]);

  const openLoginModal = () => {
    // App dùng custom event để mở LoginModal từ bất kỳ trang nào.
    window.dispatchEvent(
      new CustomEvent("auth:open-login", { detail: { redirectTo: null } })
    );
  };

  const handleHoldExpiry = useCallback(async () => {
    // Khi hết hạn giữ ghế: reset local state + xoá hold trên server.
    setSelectedSeats([]);
    setTotalPrice(0);
    setHoldExpiresAt(null);
    setHoldTimeLeft(0);
    if (userId == null || !showtimeId) return;
    try {
      await api.delete(`/seat-holds?showtimeId=${showtimeId}&userId=${userId}`);
    } catch {
      // ignore cleanup errors
    }
  }, [showtimeId, userId]);

  useEffect(() => {
    //! ======================== COUNTDOWN TIMER (CLIENT DISPLAY ONLY) ========================
    // Client chỉ hiển thị countdown dựa trên expiresAt do server cấp.
    // Khi diff về 0 => gọi handleHoldExpiry() để reset.
    if (!showtimeId || userId == null) return;
    if (!holdExpiresAt) return;

    const expiryTime = new Date(holdExpiresAt).getTime();
    const interval = setInterval(() => {
      const diff = Math.max(0, expiryTime - Date.now());
      setHoldTimeLeft(diff);
      if (diff === 0) {
        clearInterval(interval);
        handleHoldExpiry();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showtimeId, userId, holdExpiresAt, handleHoldExpiry]);

  const toggleSeat = (seat: Seat) => {
    // Click seat:
    // - Nếu chưa login => mở login modal.
    // - Nếu seat bị block hoặc không active => ignore.
    // - Ngược lại: toggle trong selectedSeats.
    if (!user) {
      openLoginModal();
      return;
    }
    if (blockedSeats.has(seat.code) || seat.status !== "active") return;

    setSelectedSeats((prev) => {
      const newSelection = prev.includes(seat.code)
        ? prev.filter((s) => s !== seat.code)
        : [...prev, seat.code];
      return newSelection;
    });
  };

  const handlePayment = async () => {
    // Bấm "Thanh toán":
    // - Chặn nếu chưa login
    // - Chặn nếu chưa chọn ghế
    // - Build bookingInfo gửi sang PaymentPage qua route state
    // - Set navigatingToPaymentRef để cleanup effect không xoá hold
    if (!user) {
      openLoginModal();
      return;
    }
    if (selectedSeats.length === 0) {
      dispatch(
        showNotification({
          message: "Vui lòng chọn ít nhất 1 ghế",
          type: "warning",
        })
      );
      return;
    }
    const bookingInfo = {
      movieId: movie?.id,
      movieTitle: movie?.title,
      poster: movie?.image,
      date: startTime.split("T")[0],
      time: formatTime(startTime),
      room: screen?.name || "PhA?ng chi???u s??` 2",
      format: screenType,
      theater: theaterName,
      seats: selectedSeats,
      totalPrice,
      showtimeId: Number(showtimeId),
      userId: user.id,
      // Nguồn sự thật: expiresAt do server cấp. PaymentPage sẽ dùng để tiếp tục countdown.
      expiresAt: holdExpiresAt || undefined,
    };
    const returnUrl = `${location.pathname}${location.search}`;
    navigatingToPaymentRef.current = true;
    navigate(`/home/payment?returnUrl=${encodeURIComponent(returnUrl)}`, {
      state: bookingInfo,
    });
  };

  const getYoutubeId = (url: string | undefined) => {
    // Tách youtubeId từ nhiều dạng URL khác nhau để embed.
    if (!url) return null;
    // Handle standard watch URL
    let match = url.match(/[?&]v=([^&]+)/);
    if (match) return match[1];

    // Handle embed URL
    match = url.match(/embed\/([^?]+)/);
    if (match) return match[1];

    // Handle short URL (youtu.be)
    match = url.match(/youtu\.be\/([^?]+)/);
    if (match) return match[1];

    return null;
  };

  const trailerSource = movie
    ? movie.trailer || movie.trailerUrl || movie.video
    : "";
  const youtubeId = getYoutubeId(trailerSource);

  if (loading)
    return <div className="text-center text-white py-5">Đang tải...</div>;
  if (!movie)
    return (
      <div className="text-center text-white py-5">Không tìm thấy phim</div>
    );

  // Handle showtime selection
  const handleTimeslotClick = (showtime: ShowtimeExpanded) => {
    //! ======================== SELECT SHOWTIME (WRITE URL PARAMS) ========================
    // Đổi suất chiếu:
    // - Xoá hold cũ (nếu có) để không carry-over ghế/timer giữa các showtime.
    // - Ghi lại URL params để refresh/share vẫn giữ selection.
    // - Reset local seat selection.
    if (user && showtimeId) {
      api
        .delete(`/seat-holds?showtimeId=${showtimeId}&userId=${user.id}`)
        .catch(() => {});
    }

    const params = new URLSearchParams({
      showtimeId: String(showtime.id),
      theaterId: String(showtime.theaterId),
      theaterName: showtime.theater?.name || theaterName,
      screenId: String(showtime.screenId),
      screenType: showtime.screen?.type || screenType,
      startTime: showtime.startTime,
      price: String(showtime.price),
      priceVip: String(showtime.priceVip),
      priceCouple: String(showtime.priceCouple),
    });
    navigate(`/home/movie/${id}?${params.toString()}`);
    // Clear selected seats when changing showtime
    setSelectedSeats([]);
    setTotalPrice(0);
    setHoldExpiresAt(null);
    setHoldTimeLeft(0);
  };

  const currentSlot = formatTime(startTime) || "";

  return (
    <main className={styles["movie-detail-page"]}>
      {/* --- Movie Info Header --- */}
      <div className={styles["movie-banner-section"]}>
        <img
          className={styles["movie-banner-bg"]}
          src={movie.image}
          alt=""
          aria-hidden="true"
        />
        <div className={styles["movie-banner-overlay"]} />
        <div className={styles["movie-banner-inner"]}>
          <div className="container">
            <div className={styles["movie-banner-content"]}>
              <div className={styles["movie-poster"]}>
                <img src={movie.image} alt={movie.title} />
              </div>
              <div className={styles["movie-info"]}>
                <h1 className={styles["movie-title-main"]}>
                  {movie.title.toUpperCase()}
                  <span className={styles["rating-badge"]}>
                    {movie.age_limit || "T13"}
                  </span>
                  <span className={styles["format-badge"]}>{screenType}</span>
                </h1>
                <div className={styles["movie-meta-info"]}>
                  <p>
                    {movie.tag?.join(", ")} - {movie.country || "Hàn Quốc"} -{" "}
                    {movie.duration} phút
                  </p>
                  <p>
                    <strong>Đạo diễn:</strong> {movie.author?.join(", ")}
                  </p>
                  <p>
                    <strong>Diễn viên:</strong> {movie.actor?.join(", ")}
                  </p>
                  <p>
                    <strong>Khởi chiếu:</strong>{" "}
                    {new Date(movie.premiere).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div className={styles["movie-description-text"]}>
                  {movie.description}
                </div>
                <div className={styles["warning-text-red"]}>
                  Kiểm duyệt: {movie.age_limit} - PHIM ĐƯỢC PHỔ BIẾN ĐẾN NGƯỜI
                  XEM TỪ ĐỦ {movie.age_limit === "T18" ? "18" : "13"} TUỔI TRỞ
                  LÊN ({movie.age_limit}+)
                </div>
                <div className={styles["action-btns"]}>
                  <button
                    className={styles["btn-link-detail"]}
                    onClick={() => setShowInfo(true)}
                  >
                    Chi tiết nội dung
                  </button>
                  <button
                    className={styles["btn-trailer-outline"]}
                    onClick={() => setShowTrailer(true)}
                  >
                    Xem trailer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Booking Section --- */}
      {/* Chỉ hiển thị booking nếu phim đang chiếu */}
      {movie.status === "upcoming" ? (
        <div className="container py-5 text-center">
          <h3 className="text-white">Phim sắp khởi chiếu</h3>
          <p className={styles["text-secondary"]}>
            Thông tin đặt vé sẽ được cập nhật sớm nhất. Vui lòng quay lại sau.
          </p>
        </div>
      ) : (
        <div className={styles["booking-wrapper"]}>
          <div className="container">
            {/* Theater Selector Tabs */}
            <div className="d-flex gap-3 mb-4 pb-2 justify-content-center flex-wrap flex-lg-nowrap overflow-visible overflow-lg-auto">
              {uniqueTheaters.length > 0 ? (
                uniqueTheaters.map((theater: TheaterLite) => (
                  <button
                    key={theater.id}
                    className={`btn ${
                      selectedTheaterId === theater.id
                        ? "btn-danger"
                        : "btn-outline-secondary"
                    } ${styles["nowrap"]}`}
                    onClick={() => {
                      // Đổi rạp sẽ reset showtime -> xoá hold cũ nếu có.
                      if (user && showtimeId) {
                        api
                          .delete(
                            `/seat-holds?showtimeId=${showtimeId}&userId=${user.id}`
                          )
                          .catch(() => {});
                      }
                      setSelectedTheaterId(theater.id);
                      // Reset other selections
                      setSearchParams({});
                      setSelectedSeats([]);
                      setTotalPrice(0);
                    }}
                  >
                    {theater.name}
                  </button>
                ))
              ) : (
                <div className={styles["text-secondary"]}>
                  Đang cập nhật lịch chiếu...
                </div>
              )}
            </div>

            {/* Date Selector - Only if Theater Selected */}
            {selectedTheaterId ? (
              <>
                <div className={styles["date-selector-tabs"]}>
                  {uniqueDates.map((date, idx) => {
                    const d = new Date(date);
                    const isActive = date === selectedDate;
                    return (
                      <div
                        key={idx}
                        className={`${styles["date-tab"]} ${
                          isActive ? styles["active"] : ""
                        }`}
                        onClick={() => setSelectedDate(date)}
                      >
                        <span className={styles["month"]}>
                          Th. {d.getMonth() + 1}
                        </span>
                        <span className={styles["day"]}>{d.getDate()}</span>
                        <span className={styles["weekday"]}>
                          {d.toLocaleDateString("vi-VN", { weekday: "long" })}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className={styles["booking-content-box"]}>
                  <div className={styles["booking-warning"]}>
                    Lưu ý: Khán giả dưới 13 tuổi chỉ chọn suất chiếu kết thúc
                    trước 22h và khán giả dưới 16 tuổi chỉ chọn suất chiếu kết
                    thúc trước 23h.
                  </div>

                  {/* Time Slots */}
                  <div className={styles["time-slots-grid"]}>
                    {filteredShowtimes.length > 0 ? (
                      filteredShowtimes.map((showtime) => (
                        <button
                          key={showtime.id}
                          className={`${styles["time-btn"]} ${
                            String(showtime.id) === String(showtimeId)
                              ? styles["active"]
                              : ""
                          }`}
                          onClick={() => handleTimeslotClick(showtime)}
                        >
                          {formatTime(showtime.startTime)}
                        </button>
                      ))
                    ) : (
                      <div className={styles["text-secondary"]}>
                        Không có suất chiếu
                      </div>
                    )}
                  </div>

                  {/* Seat Selection - Only if Showtime Selected */}
                  {showtimeId && (
                    <>
                      {/* Showtime Info Line */}
                      <div className={styles["showtime-info-line"]}>
                        <div className={styles["left-info"]}>
                          Giờ chiếu: <strong>{currentSlot}</strong>
                        </div>
                        {holdTimeLeft > 0 && (
                          <div
                            className={`${styles["right-info"]} ${styles["text-warning"]}`}
                          >
                            <span className={styles["mobile-tablet"]}>
                              Thời gian chọn ghế:
                            </span>{" "}
                            <strong>{formatHoldTime(holdTimeLeft)}</strong>
                          </div>
                        )}
                      </div>

                      {/* Screen Visual */}
                      <div className={styles["screen-area"]}>
                        <div className={styles["screen-visual"]}>
                          <img src="/assets/img/screen.png" alt="screen" />
                        </div>
                        <div className={styles["screen-name"]}>
                          Phòng chiếu số{" "}
                          {screen?.name?.replace(/\D/g, "") || "2"}
                        </div>
                      </div>

                      {/* Seat Map */}
                      {seatGrid.length === 0 ? (
                        <div
                          className={`${styles["text-secondary"]} ${styles["text-center"]} ${styles["py-4"]}`}
                        >
                          Chua co so do ghe cho phong nay.
                        </div>
                      ) : (
                        <div className={styles["seat-map-container"]}>
                          <div className={styles["seat-grid"]}>
                            {screen?.rows && screen?.cols
                              ? Array.from(
                                  { length: screen.rows },
                                  (_, rowIndex) => {
                                    const rowLabel = getRowLabel(rowIndex);
                                    return (
                                      <div
                                        key={rowLabel}
                                        className={styles["seat-row"]}
                                      >
                                        <div className={styles["row-seats"]}>
                                          {Array.from(
                                            { length: screen.cols },
                                            (_, colIndex) => {
                                              const col = colIndex + 1;
                                              const seat = seatMap.get(
                                                `${rowLabel}-${col}`
                                              );
                                              if (!seat) {
                                                return (
                                                  <div
                                                    key={`${rowLabel}-${col}`}
                                                    className={`${styles["seat-wrapper"]} ${styles["seat-placeholder"]}`}
                                                  />
                                                );
                                              }

                                              const isBooked = blockedSeats.has(
                                                seat.code
                                              );
                                              const isSelected =
                                                selectedSeats.includes(
                                                  seat.code
                                                );
                                              const isMaintenance =
                                                seat.status === "maintenance";
                                              const isHidden =
                                                seat.status === "hidden";

                                              if (isHidden) {
                                                return (
                                                  <div
                                                    key={seat.code}
                                                    className={`${styles["seat-wrapper"]} ${styles["seat-placeholder"]}`}
                                                  />
                                                );
                                              }

                                              let seatClass =
                                                styles["seat-item"];

                                              if (isBooked)
                                                seatClass += ` ${styles["booked"]}`;
                                              else if (isSelected)
                                                seatClass += ` ${styles["selected"]}`;
                                              else if (isMaintenance)
                                                seatClass += ` ${styles["maintenance"]}`;
                                              else
                                                seatClass += ` ${
                                                  styles[seat.type]
                                                }`;

                                              return (
                                                <div
                                                  key={seat.code}
                                                  className={
                                                    styles["seat-wrapper"]
                                                  }
                                                >
                                                  <div
                                                    className={seatClass}
                                                    onClick={() =>
                                                      toggleSeat(seat)
                                                    }
                                                  >
                                                    {!isBooked &&
                                                      !isMaintenance &&
                                                      seat.code}
                                                  </div>
                                                </div>
                                              );
                                            }
                                          )}
                                        </div>
                                      </div>
                                    );
                                  }
                                )
                              : sortedRows.map((rowLabel) => (
                                  <div
                                    key={rowLabel}
                                    className={styles["seat-row"]}
                                  >
                                    <div className={styles["row-seats"]}>
                                      {groupedSeats[rowLabel].map((seat) => {
                                        const isBooked = blockedSeats.has(
                                          seat.code
                                        );
                                        const isSelected =
                                          selectedSeats.includes(seat.code);
                                        const isMaintenance =
                                          seat.status === "maintenance";
                                        const isHidden =
                                          seat.status === "hidden";

                                        if (isHidden) {
                                          return (
                                            <div
                                              key={seat.code}
                                              className={`${styles["seat-wrapper"]} ${styles["seat-placeholder"]}`}
                                            />
                                          );
                                        }

                                        let seatClass = styles["seat-item"];

                                        if (isBooked)
                                          seatClass += ` ${styles["booked"]}`;
                                        else if (isSelected)
                                          seatClass += ` ${styles["selected"]}`;
                                        else if (isMaintenance)
                                          seatClass += ` ${styles["maintenance"]}`;
                                        else
                                          seatClass += ` ${styles[seat.type]}`;

                                        return (
                                          <div
                                            key={seat.code}
                                            className={styles["seat-wrapper"]}
                                          >
                                            <div
                                              className={seatClass}
                                              onClick={() => toggleSeat(seat)}
                                            >
                                              {!isBooked &&
                                                !isMaintenance &&
                                                seat.code}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                          </div>
                        </div>
                      )}

                      {/* Legend */}
                      <div className={styles["seat-legend"]}>
                        <div className={styles["legend-item"]}>
                          <span
                            className={`${styles["box"]} ${styles["booked"]}`}
                          >
                            <i className="bi bi-x"></i>
                          </span>{" "}
                          Đã đặt
                        </div>
                        <div className={styles["legend-item"]}>
                          <span
                            className={`${styles["box"]} ${styles["selected"]}`}
                          ></span>{" "}
                          Ghế bạn chọn
                        </div>
                        <div className={styles["legend-item"]}>
                          <span
                            className={`${styles["box"]} ${styles["standard"]}`}
                          ></span>{" "}
                          Ghế thường
                        </div>
                        <div className={styles["legend-item"]}>
                          <span
                            className={`${styles["box"]} ${styles["vip"]}`}
                          ></span>{" "}
                          Ghế VIP
                        </div>
                        <div className={styles["legend-item"]}>
                          <span
                            className={`${styles["box"]} ${styles["couple"]}`}
                          ></span>{" "}
                          Ghế đôi
                        </div>
                      </div>

                      {/* Footer Summary */}
                      <div className={styles["booking-footer"]}>
                        <div className={styles["footer-info"]}>
                          <div className={styles["selected-seats-text"]}>
                            Ghế đã chọn: <span>{selectedSeats.join(", ")}</span>
                          </div>
                          <div className={styles["total-price-text"]}>
                            Tổng tiền:{" "}
                            <span>{totalPrice.toLocaleString()}đ</span>
                          </div>
                        </div>
                        <div className={styles["footer-actions"]}>
                          <button
                            className={styles["btn-back"]}
                            onClick={() => navigate(-1)}
                          >
                            Quay lại
                          </button>
                          <button
                            className={styles["btn-payment"]}
                            onClick={handlePayment}
                          >
                            Thanh toán
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center text-white py-5">
                <h5>Vui lòng chọn rạp để xem lịch chiếu</h5>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showInfo && (
        <div
          className={styles["modal-overlay"]}
          onClick={() => setShowInfo(false)}
        >
          <div
            className={styles["modal-box"]}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{movie.title}</h3>
            <p>{movie.description}</p>
            <button
              className={styles["btn-close-modal"]}
              onClick={() => setShowInfo(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
      {showTrailer && youtubeId && (
        <div
          className={styles["modal-overlay"]}
          onClick={() => setShowTrailer(false)}
        >
          <div
            className={styles["modal-trailer"]}
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
              title="Trailer"
              frameBorder="0"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </main>
  );
};

export default MovieDetail;
