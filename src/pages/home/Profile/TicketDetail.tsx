import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { showNotification } from "../../../features/notificationSlice";
import { useAppDispatch } from "../../../hook/hook";

import "./TicketDetail.css";
import type { Booking } from "../../../types";

interface TicketBookingDetail extends Booking {
  movieTitle?: string;
  format?: string;
}

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [booking, setBooking] = useState<TicketBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookingDetail = async (bookingId: string) => {
      try {
        setLoading(true);
        const res = await api.get(`/bookings/${bookingId}`);
        const data = res.data;

        // Fetch movie to get image
        if (data.movieId) {
          const movieRes = await api.get(`/movies/${data.movieId}`);
          data.movie = movieRes.data;
        }

        setBooking(data);
      } catch (error) {
        console.error("Error fetching ticket:", error);
        dispatch(
          showNotification({
            message: "Không tìm thấy thông tin vé",
            type: "danger",
          })
        );
        navigate("/home/my-tickets");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBookingDetail(id);
    }
  }, [id, dispatch, navigate]);

  if (loading) {
    return (
      <div className="container py-5 mt-5 text-center text-white">
        <div className="spinner-border text-danger" role="status"></div>
        <p className="mt-3">Đang tải...</p>
      </div>
    );
  }

  if (!booking) return null;

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

  // Generate a QR code string content (mock)
  const qrContent = `TICKET-${booking.id}-${booking.movieId}-${booking.date}`;

  return (
    <div className="container py-5 mt-5 ticket-detail">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-5">
          <div className="d-flex align-items-center mb-4">
            <button
              onClick={() => navigate("/home/my-tickets")}
              className="btn btn-link text-white text-decoration-none p-0 me-3"
            >
              <i className="bi bi-arrow-left fs-4"></i>
            </button>
            <h4 className="text-white fw-bold mb-0">Chi Tiết Vé</h4>
          </div>

          <div
            className="card border-0 rounded-4 overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #1a1a1a, #2a2a2a)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            {/* Ticket Header (Movie Image) */}
            <div className="position-relative">
              <img
                src={
                  booking.movie?.image || "https://via.placeholder.com/500x300"
                }
                alt="Movie"
                className="w-100 object-fit-cover"
                style={{ height: "200px", opacity: 0.8 }}
              />
              <div
                className="position-absolute bottom-0 start-0 w-100 p-3"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,1), transparent)",
                }}
              >
                <h4 className="text-white fw-bold mb-0 text-shadow">
                  {booking.movie?.title || booking.movieTitle || "Chi tiết vé"}
                </h4>
              </div>
            </div>

            <div className="card-body p-4 text-white">
              {/* QR Code Section */}
              <div
                className="text-center mb-4 bg-white p-3 rounded-3 mx-auto"
                style={{ maxWidth: "180px" }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrContent}`}
                  alt="QR Code"
                  className="img-fluid"
                />
                <small className="d-block text-dark mt-2 fw-bold letter-spacing-1">
                  {booking.id.toString().padStart(6, "0")}
                </small>
              </div>

              <div className="text-center mb-4 text-warning">
                <small>Đưa mã này cho nhân viên soát vé</small>
              </div>

              {/* Info Grid */}
              <div className="row g-3">
                <div className="col-6">
                  <small className="text-secondary d-block">Rạp</small>
                  <span className="fw-bold">{booking.theater}</span>
                </div>
                <div className="col-6">
                  <small className="text-secondary d-block">Phòng chiếu</small>
                  <span className="fw-bold fs-5">{booking.room}</span>
                </div>
                <div className="col-6">
                  <small className="text-secondary d-block">Ngày chiếu</small>
                  <span className="fw-bold text-info">
                    {formatDate(booking.date)}
                  </span>
                </div>
                <div className="col-6">
                  <small className="text-secondary d-block">Giờ chiếu</small>
                  <span className="fw-bold text-info fs-5">{booking.time}</span>
                </div>
                <div className="col-12 border-top border-secondary pt-3 mt-3">
                  <small className="text-secondary d-block">Ghế</small>
                  <span className="fw-bold fs-5 text-warning letter-spacing-1">
                    {booking.seats.join(", ")}
                  </span>
                </div>
                <div className="col-12">
                  <small className="text-secondary d-block">Định dạng</small>
                  <span>{booking.format}</span>
                </div>
              </div>

              {/* Footer / Price */}
              <div className="mt-4 pt-3 border-top border-secondary d-flex justify-content-between align-items-center">
                <span className="text-secondary">Tổng thanh toán</span>
                <span className="fs-4 fw-bold text-success">
                  {formatCurrency(booking.totalPrice)}
                </span>
              </div>
            </div>

            {/* Cutout Effect (Holes on sides) */}
            <div className="position-absolute bg-black rounded-circle booking-hole booking-hole--left"></div>
            <div className="position-absolute bg-black rounded-circle booking-hole booking-hole--right"></div>
            {/* Dashed Line */}
            <div
              className="position-absolute w-100 border-top border-secondary ticket-cut-line"
              style={{ zIndex: -1 }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
