import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../services/api";
import { useAppDispatch } from "../../../hook/hook";
import { showNotification } from "../../../features/notificationSlice";
import "./PaymentPage.css";

/**
 * ============================================================
 * QUICK GUIDE — PAYMENT PAGE (CONTINUE HOLD + CREATE BOOKING)
 * ============================================================
 *
 * ✅ MỤC TIÊU
 * - Nhận bookingInfo từ MovieDetail (route state).
 * - Hiển thị thông tin vé + chọn phương thức thanh toán.
 * - Hiển thị countdown thời gian giữ ghế dựa trên expiresAt (server truth).
 * - Tạo booking trên server khi user bấm "Thanh toán".
 *
 * ✅ SOURCE OF TRUTH
 * - Seat-hold và `expiresAt` do server cấp (xem `server.cjs`).
 * - Client chỉ hiển thị countdown; server quyết định hold còn hạn hay không.
 *
 * ------------------------------------------------------------
 * 1) INPUT
 * ------------------------------------------------------------
 * - bookingInfo đến từ `location.state`.
 * - Nếu refresh trang (mất state) => code hiện tại điều hướng về "/".
 *
 * ------------------------------------------------------------
 * 2) COUNTDOWN
 * ------------------------------------------------------------
 * - Ưu tiên dùng `bookingInfo.expiresAt` được truyền từ MovieDetail.
 * - Nếu chưa có expiresAt, sẽ fetch seat-hold từ server để tiếp tục countdown:
 *     GET /seat-holds?showtimeId=...&userId=...
 * - Khi hết giờ:
 *   + notify warning
 *   + best-effort xoá hold
 *   + quay về returnUrl (trang chọn ghế) hoặc back
 *
 * ------------------------------------------------------------
 * 3) CREATE BOOKING
 * ------------------------------------------------------------
 * - POST /bookings: server sẽ validate hold còn hạn + seats khớp hold.seats.
 * ============================================================
 */

interface BookingInfo {
  id?: number;
  movieId: number;
  movieTitle: string;
  date: string;
  time: string;
  room: string;
  format: string;
  seats: string[];
  totalPrice: number;
  theater: string;
  showtimeId: number;
  userId?: number;
  expiresAt?: string;
}

const PaymentPage: React.FC = () => {
  //! ======================== ROUTER/CONTEXT/REDUX ========================
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  // Initialize state directly from location.state to avoid synchronous setState in effects
  const [bookingInfo] = useState<BookingInfo | null>(() => {
    return (location.state as BookingInfo | null) || null;
  });

  //! ======================== UI STATE ========================
  const [paymentMethod, setPaymentMethod] = useState("");
  const [fee] = useState(0);

  //! ======================== HOLD COUNTDOWN STATE ========================
  const [expiresAt, setExpiresAt] = useState<string | null>(() => {
    const stateBooking = location.state as BookingInfo | null;
    return stateBooking?.expiresAt || null;
  });
  const [timeLeftMs, setTimeLeftMs] = useState(0);

  // returnUrl: dùng để quay lại đúng trang chọn ghế/showtime
  const returnUrl = searchParams.get("returnUrl");

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

  const clearHold = useCallback(async () => {
    // Xoá seat-hold hiện tại để reset timer và giải phóng ghế.
    // Best-effort: nếu hold đã bị xoá (do booking thành công / hết hạn) thì ignore.
    if (!user || !bookingInfo?.showtimeId) return;
    try {
      await api.delete(
        `/seat-holds?showtimeId=${bookingInfo.showtimeId}&userId=${user.id}`
      );
    } catch {
      // ignore cleanup errors
    }
  }, [bookingInfo, user]);

  useEffect(() => {
    // Validation and navigation checks (no state updates)
    if (!bookingInfo) {
      navigate("/");
      return;
    }
    if (user && bookingInfo.userId && bookingInfo.userId !== user.id) {
      navigate("/");
      return;
    }
  }, [bookingInfo, navigate, user]);

  useEffect(() => {
    //! ======================== CLEANUP HOLD ON UNMOUNT ========================
    // Requirement: rời PaymentPage sang trang khác thì mặc định xoá hold
    // để không giữ timer cũ khi quay lại MovieDetail.
    return () => {
      clearHold();
    };
  }, [clearHold]);

  useEffect(() => {
    //! ======================== FALLBACK: FETCH expiresAt FROM SERVER ========================
    // Nếu PaymentPage chưa có expiresAt (state không có hoặc chưa set),
    // fetch seat-hold hiện tại để tiếp tục countdown.
    if (expiresAt) return;
    if (!bookingInfo?.showtimeId || !user) return;

    let isActive = true;
    (async () => {
      try {
        const res = await api.get(
          `/seat-holds?showtimeId=${bookingInfo.showtimeId}&userId=${user.id}`
        );
        if (!isActive) return;
        const holds = Array.isArray(res.data) ? res.data : [];
        const myHold = holds[0];
        if (myHold?.expiresAt) setExpiresAt(myHold.expiresAt);
        else setTimeLeftMs(0);
      } catch {
        if (isActive) setTimeLeftMs(0);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [bookingInfo?.showtimeId, expiresAt, user]);

  useEffect(() => {
    //! ======================== COUNTDOWN TIMER ========================
    // Countdown theo expiresAt (server truth).
    // Hết giờ:
    // - notify
    // - best-effort xoá hold
    // - quay về returnUrl (MovieDetail) hoặc back
    if (!expiresAt) return;

    const expiryTime = new Date(expiresAt).getTime();
    const tick = () => {
      const diff = Math.max(0, expiryTime - Date.now());
      setTimeLeftMs(diff);
      if (diff === 0) {
        dispatch(
          showNotification({
            message: "Hết thời gian giữ ghế. Vui lòng chọn lại ghế.",
            type: "warning",
          })
        );
        if (bookingInfo?.showtimeId && user) {
          api
            .delete(
              `/seat-holds?showtimeId=${bookingInfo.showtimeId}&userId=${user.id}`
            )
            .catch(() => {});
        }
        if (returnUrl) navigate(returnUrl, { replace: true });
        else navigate(-1);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [bookingInfo?.showtimeId, dispatch, expiresAt, navigate, returnUrl, user]);

  const handlePayment = async () => {
    //! ======================== CLICK "THANH TOÁN" ========================
    // Guard rails:
    // - Hết thời gian giữ ghế => quay lại chọn ghế
    // - Chưa chọn payment method => warn
    // - Chưa login => warn + điều hướng login
    // Sau đó:
    // - POST /bookings (server validate seat-hold)
    if (expiresAt && timeLeftMs <= 0) {
      dispatch(
        showNotification({
          message: "Hết thời gian giữ ghế. Vui lòng quay lại chọn ghế.",
          type: "warning",
        })
      );
      if (returnUrl) navigate(returnUrl);
      else navigate(-1);
      return;
    }

    if (!paymentMethod) {
      dispatch(
        showNotification({
          message: "Vui lòng chọn phương thức thanh toán",
          type: "warning",
        })
      );
      return;
    }

    if (!user) {
      dispatch(
        showNotification({
          message: "Vui lòng đăng nhập để thanh toán",
          type: "warning",
        })
      );
      navigate("/login"); // Or handle login modal
      return;
    }

    try {
      if (!bookingInfo) return;

      // Payload booking (demo). Server sẽ enforce: hold còn hạn + seats khớp hold.seats.
      const bookingData = {
        movieId: bookingInfo.movieId,
        showtimeId: bookingInfo.showtimeId, // Ensure this exists in bookingInfo in MovieDetail
        date: bookingInfo.date,
        time: bookingInfo.time, // This might need to be ISO if you want, but string is fine for now
        seats: bookingInfo.seats,
        totalPrice: bookingInfo.totalPrice,
        theater: bookingInfo.theater,
        room: bookingInfo.room,
        format: bookingInfo.format,
        userId: user.id,
        createdAt: new Date().toISOString(),
        paymentStatus: "PENDING",
        bookingStatus: "PENDING",
      };

      let bookingRes;
      if (bookingInfo.showtimeId) {
        bookingRes = await api.post("/bookings", {
          ...bookingData,
          showtimeId: Number(bookingInfo.showtimeId),
        });
      } else {
        // Fallback if no showtimeId (should not happen with new logic)
        bookingRes = await api.post("/bookings", bookingData);
      }

      // Simulate payment delay (demo)
      setTimeout(() => {
        const bookingId = bookingRes?.data?.id;
        if (bookingId) {
          api
            .patch(`/bookings/${bookingId}`, {
              paymentStatus: "COMPLETED",
              bookingStatus: "COMPLETED",
            })
            .catch(() => {});
        }
        navigate("/home/payment-success");
      }, 500);
    } catch (error) {
      console.error("Payment failed", error);
      if (
        (error as { response?: { status?: number } })?.response?.status === 409
      ) {
        dispatch(
          showNotification({
            message: "Ghế đã được giữ hoặc đã đặt. Vui lòng chọn ghế khác.",
            type: "warning",
          })
        );
        if (returnUrl) navigate(returnUrl);
        else navigate(-1);
        return;
      }
      dispatch(
        showNotification({
          message: "Thanh toán thất bại. Vui lòng thử lại.",
          type: "danger",
        })
      );
    }
  };

  const handleCancelPayment = async () => {
    // Hủy thanh toán: xoá hold để không giữ thời gian cũ, rồi quay về trang chủ.
    await clearHold();
    navigate("/home");
  };

  if (!bookingInfo) {
    return null;
  }

  const totalWithFee = bookingInfo.totalPrice + fee;

  return (
    <div className="payment-page">
      <div className="payment-main d-flex flex-column flex-lg-row">
        <div className="flex-grow-1">
          {/* Movie Info */}
          <div className="info rounded rounded-4 my-4 p-4 info-movie">
            <p className="title">Thông tin phim</p>
            <p className="mb-2">Phim</p>
            <p className="fw-bold">{bookingInfo.movieTitle}</p>

            <div className="row">
              <div className="col-7">
                <p className="mb-2">Ngày giờ chiếu</p>
                <p className="fw-bold mb-0">
                  {new Date(bookingInfo.date).toLocaleDateString("vi-VN")} -{" "}
                  {bookingInfo.time}
                </p>
              </div>
              <div className="col-5">
                <p className="mb-2">Ghế</p>
                <p className="fw-bold mb-0">{bookingInfo.seats.join(", ")}</p>
              </div>
            </div>

            <div className="row">
              <div className="col-7">
                <p className="mb-2">Định dạng</p>
                <p className="fw-bold mb-0">{bookingInfo.format}</p>
              </div>
              <div className="col-5">
                <p className="mb-2">Phòng chiếu</p>
                <p className="fw-bold mb-0">Phòng {bookingInfo.room}</p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="info rounded rounded-4 p-4 m-0 info-movie">
            <p className="mb-4 title">Thông tin thanh toán</p>
            <div className="border-rounded">
              <table className="table table-dark table-transparent mb-0">
                <thead>
                  <tr>
                    <th className="fw-bold p-left-24">Danh mục</th>
                    <th className="fw-bold">Số lượng</th>
                    <th className="fw-bold text-end p-right-24">Tổng tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-left-24">Vé xem phim</td>
                    <td>{bookingInfo.seats.length}</td>
                    <td className="text-end p-right-24">
                      {bookingInfo.totalPrice.toLocaleString("vi-VN")}đ
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="info rounded rounded-4 p-4 info-method-payment">
          <p className="mb-4 fw-bold title">Phương thức thanh toán</p>

          <div
            className={`border-red p-2 py-3 ${
              paymentMethod === "vietqr" ? "selected" : ""
            }`}
            onClick={() => setPaymentMethod("vietqr")}
          >
            <div className="d-flex align-items-center ms-3">
              <input
                type="radio"
                value="vietqr"
                name="payment"
                className="form-check-input"
                checked={paymentMethod === "vietqr"}
                onChange={() => setPaymentMethod("vietqr")}
              />
              <div className="d-flex align-items-center ms-2">
                <img
                  src="https://chieuphimquocgia.com.vn/_next/image?url=%2Fimages%2Fvietqr.png&w=128&q=75"
                  style={{ height: "25px" }}
                  className="me-2"
                  alt="VietQR"
                />
                <span
                  className="fw-semi-bold text-light"
                  style={{ marginTop: "7px" }}
                >
                  VietQR
                </span>
              </div>
            </div>
          </div>

          <div
            className={`border-red p-2 py-3 my-3 ${
              paymentMethod === "vnpay" ? "selected" : ""
            }`}
            onClick={() => setPaymentMethod("vnpay")}
          >
            <div className="d-flex align-items-center ms-3">
              <input
                type="radio"
                value="vnpay"
                name="payment"
                className="form-check-input"
                checked={paymentMethod === "vnpay"}
                onChange={() => setPaymentMethod("vnpay")}
              />
              <div className="d-flex align-items-center ms-2">
                <img
                  src="https://chieuphimquocgia.com.vn/images/vnpay.svg"
                  style={{ height: "25px" }}
                  className="me-2"
                  alt="VNPAY"
                />
                <span
                  className="fw-semi-bold text-light"
                  style={{ marginTop: "7px" }}
                >
                  VNPAY
                </span>
              </div>
            </div>
          </div>

          <div
            className={`border-red p-2 py-3 ${
              paymentMethod === "viettelmoney" ? "selected" : ""
            }`}
            onClick={() => setPaymentMethod("viettelmoney")}
          >
            <div className="d-flex align-items-center ms-3">
              <input
                type="radio"
                value="viettelmoney"
                name="payment"
                className="form-check-input"
                checked={paymentMethod === "viettelmoney"}
                onChange={() => setPaymentMethod("viettelmoney")}
              />
              <div className="d-flex align-items-center ms-2">
                <img
                  src="https://chieuphimquocgia.com.vn/_next/image?url=%2Fimages%2Fviettel1.png&w=128&q=75"
                  style={{ height: "25px" }}
                  className="me-2"
                  alt="Viettel Money"
                />
                <span
                  className="fw-semi-bold text-light"
                  style={{ marginTop: "7px" }}
                >
                  Viettel Money
                </span>
              </div>
            </div>
          </div>

          <h5 className="mt-4 mb-2 title">Chi Phí</h5>
          <div className="d-flex justify-content-between">
            <p className="m-0">Thanh toán</p>
            <p className="fw-bold m-0">
              {bookingInfo.totalPrice.toLocaleString("vi-VN")}đ
            </p>
          </div>
          <div className="d-flex justify-content-between">
            <p className="m-0">Phí</p>
            <p className="fw-bold m-0">{fee.toLocaleString("vi-VN")}đ</p>
          </div>
          <div className="d-flex justify-content-between">
            <p className="m-0">Tổng cộng</p>
            <p className="fw-bold m-0">
              {totalWithFee.toLocaleString("vi-VN")}đ
            </p>
          </div>

          {expiresAt && (
            <div className="text-center text-warning mt-3">
              Thời gian giữ ghế còn lại:{" "}
              <strong>{formatHoldTime(timeLeftMs)}</strong>
            </div>
          )}

          <button
            className="btn btn-red-gradient p-2 text-white rounded rounded-5 w-100 my-3"
            onClick={handlePayment}
          >
            Thanh toán
          </button>
          <button
            className="btn btn-transparent p-2 text-white rounded rounded-5 w-100 mb-3"
            onClick={handleCancelPayment}
          >
            Hủy thanh toán
          </button>
          <button
            className="btn btn-transparent p-2 text-white rounded rounded-5 w-100 mb-3"
            onClick={() => {
              // Rời PaymentPage => xoá hold để reset timer.
              clearHold().finally(() => {
                if (returnUrl) navigate(returnUrl);
                else navigate(-1);
              });
            }}
          >
            Quay lại
          </button>

          <p className="text-orange text-center note">
            <b>Lưu ý:</b> Không mua vé cho trẻ em dưới 13 tuổi đối với các suất
            chiếu phim kết thúc sau 22h00 và không mua vé cho trẻ em dưới 16
            tuổi đối với các suất chiếu phim kết thúc sau 23h00.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
