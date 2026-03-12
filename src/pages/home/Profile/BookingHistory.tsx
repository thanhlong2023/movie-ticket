import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../services/api";

interface Booking {
  id: number;
  userId: number;
  movieId: number;
  showtimeId: number;
  date: string;
  time: string;
  seats: string[];
  totalPrice: number;
  theater: string;
  room: string;
  format: string;
  createdAt: string;
  movieTitle?: string;
  movie?: {
    id: number;
    title: string;
    image: string;
  };
}

const BookingHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookings(user.id);
    }
  }, [user]);

  const fetchBookings = async (userId: number) => {
    try {
      setLoading(true);
      // Fetch bookings for user
      const bookingsRes = await api.get(
        `/bookings?userId=${userId}&_sort=createdAt&_order=desc`
      );
      const bookingsData = bookingsRes.data;

      // Fetch movie details for each booking
      const enrichedBookings = await Promise.all(
        bookingsData.map(async (booking: Booking) => {
          try {
            const movieRes = await api.get(`/movies/${booking.movieId}`);
            return {
              ...booking,
              movie: movieRes.data,
            };
          } catch {
            return booking;
          }
        })
      );

      setBookings(enrichedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN") + "đ";
  };

  return (
    <div className="container py-5 mt-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="d-flex align-items-center mb-4">
            {/* <button
              onClick={() => navigate(-1)}
              className="btn btn-link text-white text-decoration-none p-0 me-3"
            >
              <i className="bi bi-arrow-left fs-4"></i>
            </button> */}
            <h2 className="text-white fw-bold mb-0">Lịch Sử Đặt Vé</h2>
          </div>

          {loading ? (
            <div className="text-center py-5 text-white">
              <div className="spinner-border text-danger" role="status"></div>
              <p className="mt-3">Đang tải...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-5">
              <i
                className="bi bi-ticket-perforated text-secondary"
                style={{ fontSize: "4rem" }}
              ></i>
              <h4 className="text-white mt-3">Bạn chưa có vé nào</h4>
              <p className="text-secondary">
                Hãy đặt vé ngay để trải nghiệm những bộ phim tuyệt vời!
              </p>
              <Link to="/" className="btn btn-danger px-4 py-2 mt-2">
                Đặt vé ngay
              </Link>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="card bg-dark text-white border-secondary overflow-hidden cursor-pointer booking-card"
                  onClick={() => navigate(`/home/my-tickets/${booking.id}`)}
                  style={{ cursor: "pointer", transition: "transform 0.2s" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "translateY(-3px)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  <div className="row g-0">
                    <div className="col-3 col-md-2 position-relative">
                      {booking.movie?.image ? (
                        <img
                          src={booking.movie.image}
                          className="img-fluid h-100 object-fit-cover w-100"
                          alt={booking.movie.title}
                          style={{ minHeight: "120px" }}
                        />
                      ) : (
                        <div className="h-100 d-flex align-items-center justify-content-center bg-secondary">
                          <i className="bi bi-film fs-1"></i>
                        </div>
                      )}
                    </div>
                    <div className="col-9 col-md-10">
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h5 className="card-title fw-bold text-danger mb-1">
                              {booking.movie?.title ||
                                booking.movieTitle ||
                                "Phim chưa có tên"}
                            </h5>
                            <p className="card-text small text-secondary mb-1">
                              <i className="bi bi-geo-alt me-1"></i>
                              {booking.theater} - {booking.room}
                            </p>
                            <p className="card-text mb-2">
                              <span className="badge bg-secondary me-2">
                                {booking.format}
                              </span>
                              <span className="small text-white">
                                {formatDate(booking.date)} - {booking.time}
                              </span>
                            </p>
                          </div>
                          <div className="text-end">
                            <h6 className="fw-bold text-warning mb-1">
                              {formatCurrency(booking.totalPrice)}
                            </h6>
                            <span className="badge bg-success small">
                              Đã thanh toán
                            </span>
                          </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-end mt-2">
                          <small className="text-secondary">
                            Ngày đặt:{" "}
                            {new Date(booking.createdAt).toLocaleDateString(
                              "vi-VN"
                            )}
                          </small>
                          <span className="text-danger small fw-bold">
                            Xem chi tiết <i className="bi bi-chevron-right"></i>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingHistory;
