import { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../hook/hook";
import { fetchBookings } from "../../../features/bookingSlice";
import { fetchUsers } from "../../../features/usersSlice";
import { fetchMovies } from "../../../features/movieSlice";
import PaginationControls from "../../../components/PaginationControls";
import type { Booking } from "../../../types/booking";

const BookingsAdmin = () => {
  const dispatch = useAppDispatch();
  const { bookings, loading: bLoading } = useAppSelector(
    (state) => state.bookings
  );
  const { users, loading: uLoading } = useAppSelector((state) => state.users);
  const { movies, loading: mLoading } = useAppSelector((state) => state.movies);

  const loading = bLoading || uLoading || mLoading;

  useEffect(() => {
    dispatch(fetchBookings());
    dispatch(fetchUsers());
    dispatch(fetchMovies());
  }, [dispatch]);

  // Enrich bookings with user and movie details
  const enrichedBookings = useMemo(() => {
    if (!bookings.length) return [];

    return bookings
      .map((b) => {
        // Casting b to Booking if state doesn't have it typed yet, or relying on inferred type
        const booking = b as Booking;
        const user = users.find((u) => u.id == booking.userId);
        const movie = movies.find((m) => m.id == booking.movieId);

        return {
          ...booking,
          user,
          movie,
          theaterName: booking.theater,
          roomName: booking.room,
          status: booking.status || "completed",
          totalSeat: booking.seats ? booking.seats.length : 0,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [bookings, users, movies]);

  // Search & filter
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredBookings = useMemo(() => {
    return enrichedBookings.filter((item) => {
      // Admin view: only show successful bookings
      if (item.status !== "completed") return false;

      if (dateFrom) {
        const itemDate = item.date ? new Date(item.date) : null;
        if (!itemDate || itemDate < new Date(dateFrom)) return false;
      }

      if (dateTo) {
        const itemDate = item.date ? new Date(item.date) : null;
        if (!itemDate) return false;
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        if (itemDate > endDate) return false;
      }

      if (!normalizedSearch) return true;

      const haystack = [
        String(item.id),
        item.user?.name,
        item.user?.email,
        item.user?.phone,
        item.movie?.title,
        item.theaterName || item.theater,
        item.roomName || item.room,
        item.seats?.join(", "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [enrichedBookings, normalizedSearch, dateFrom, dateTo]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Keep currentPage in a valid range when filters/data change
  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredBookings.length / itemsPerPage)
    );
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, filteredBookings.length, itemsPerPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = filteredBookings.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-white fw-bold mb-1">Quản lý Đặt vé</h2>
          <p className="text-secondary m-0">
            Theo dõi lịch sử đặt vé của khách hàng
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="p-3 border-bottom border-dark-subtle">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-4">
                <label className="form-label" htmlFor="admin-bookings-search">
                  Tìm kiếm
                </label>
                <input
                  id="admin-bookings-search"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setCurrentPage(1);
                  }}
                  type="text"
                  className="form-control"
                  placeholder="Tên phim, khách hàng, ghế, email..."
                />
              </div>
              <div className="col-12 col-md-3">
                <label
                  className="form-label"
                  htmlFor="admin-bookings-date-from"
                >
                  Từ ngày
                </label>
                <input
                  id="admin-bookings-date-from"
                  value={dateFrom}
                  onChange={(event) => {
                    setDateFrom(event.target.value);
                    setCurrentPage(1);
                  }}
                  type="date"
                  className="form-control"
                />
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label" htmlFor="admin-bookings-date-to">
                  Đến ngày
                </label>
                <input
                  id="admin-bookings-date-to"
                  value={dateTo}
                  onChange={(event) => {
                    setDateTo(event.target.value);
                    setCurrentPage(1);
                  }}
                  type="date"
                  className="form-control"
                />
              </div>
              <div className="col-12 col-md-2 d-grid">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setSearchTerm("");
                    setDateFrom("");
                    setDateTo("");
                    setCurrentPage(1);
                  }}
                >
                  Đặt lại
                </button>
              </div>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table admin-table mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Khách hàng</th>
                  <th>Phim / Rạp</th>
                  <th>Suất chiếu</th>
                  <th>Ghế / Giá</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-white">
                      Đang tải...
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-secondary">
                      Không tìm thấy đặt vé phù hợp.
                    </td>
                  </tr>
                ) : (
                  currentBookings.map((item: Booking) => (
                    <tr key={item.id}>
                      <td className="text-secondary">#{item.id}</td>
                      <td>
                        <div className="fw-bold text-white">
                          {item.user?.name || "Khách vãng lai"}
                        </div>
                        <div className="text-secondary small">
                          {item.user?.email}
                        </div>
                        <div className="text-secondary small">
                          {item.user?.phone}
                        </div>
                      </td>
                      <td>
                        <div className="fw-bold text-white">
                          {item.movie?.title || "Phim không xác định"}
                        </div>
                        <div className="text-secondary small">
                          {item.theaterName || item.theater} -{" "}
                          {item.roomName || item.room}
                        </div>
                      </td>
                      <td>
                        <div className="text-white">
                          {item.date
                            ? new Date(item.date).toLocaleDateString("vi-VN")
                            : "N/A"}
                        </div>
                        <div className="text-warning small fst-italic">
                          {item.time || ""}
                        </div>
                      </td>
                      <td>
                        <div className="text-white">
                          {item.seats?.join(", ")} ({item.totalSeat} ghế)
                        </div>
                        <div className="fw-bold text-success">
                          {item.totalPrice?.toLocaleString("vi-VN")} đ
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-success">Thành công</span>
                      </td>
                      <td>
                        <button
                          className="btn btn-outline-info btn-sm"
                          onClick={() => setSelectedBooking(item)}
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredBookings.length > 0 && (
            <div className="p-3">
              <PaginationControls
                currentPage={currentPage}
                totalItems={filteredBookings.length}
                pageSize={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {selectedBooking && (
        <div
          className="admin-modal-overlay"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="admin-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <div className="admin-modal-title">
                  Chi tiết đặt vé #{selectedBooking.id}
                </div>
                <div className="text-secondary small">
                  {selectedBooking.createdAt
                    ? new Date(selectedBooking.createdAt).toLocaleString(
                        "vi-VN"
                      )
                    : "N/A"}
                </div>
              </div>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setSelectedBooking(null)}
              >
                Đóng
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div className="text-secondary small mb-1">Khách hàng</div>
                  <div className="text-white fw-bold">
                    {selectedBooking.user?.name || "Khách vãng lai"}
                  </div>
                  <div className="text-secondary small">
                    {selectedBooking.user?.email}
                  </div>
                  <div className="text-secondary small">
                    {selectedBooking.user?.phone}
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="text-secondary small mb-1">Phim</div>
                  <div className="text-white fw-bold">
                    {selectedBooking.movie?.title || "Phim không xác định"}
                  </div>
                  <div className="text-secondary small">
                    {selectedBooking.theaterName || selectedBooking.theater} -{" "}
                    {selectedBooking.roomName || selectedBooking.room}
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="text-secondary small mb-1">Suất chiếu</div>
                  <div className="text-white">
                    {selectedBooking.date
                      ? new Date(selectedBooking.date).toLocaleDateString(
                          "vi-VN"
                        )
                      : "N/A"}{" "}
                    {selectedBooking.time || ""}
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="text-secondary small mb-1">Trạng thái</div>
                  <div className="text-white small">Thành công</div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="text-secondary small mb-1">Ghế</div>
                  <div className="text-white">
                    {selectedBooking.seats?.join(", ") || "---"} (
                    {selectedBooking.totalSeat || 0})
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="text-secondary small mb-1">Tổng tiền</div>
                  <div className="text-success fw-bold">
                    {selectedBooking.totalPrice?.toLocaleString("vi-VN")} đ
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsAdmin;
