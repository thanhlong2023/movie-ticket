import { Link } from "react-router-dom";
import "./PaymentPage.css";

const PaymentSuccessPage: React.FC = () => {
  return (
    <main className="payment-success-page">
      <div className="success-container">
        {/* Star Success Icon */}
        <div className="success-icon-wrapper">
          <img
            src="/assets/star-success.png"
            alt="Success"
            className="success-star-img"
          />
        </div>

        {/* Success Message */}
        <h1 className="success-title">Đặt vé thành công!</h1>

        <p className="success-message">
          Cảm ơn bạn đã đặt vé tại Trung tâm Chiếu phim Quốc gia.
          <br />
          Vui lòng kiểm tra email để nhận thông tin vé.
        </p>

        {/* Back to Home Button */}
        <Link to="/home" className="btn-success-home">
          Quay về trang chủ
        </Link>
      </div>
    </main>
  );
};

export default PaymentSuccessPage;
