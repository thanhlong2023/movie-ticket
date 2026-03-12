import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../hook/hook";
import { fetchPromotionById } from "../../../features/promotionSlice";
import "../NewsPage/NewsDetailPage.css";

const PromotionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { promotion, loading, error } = useAppSelector(
    (state) => state.promotions
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchPromotionById(Number(id)));
    }
  }, [dispatch, id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!promotion) {
    return (
      <div
        className="news-detail-page"
        style={{ textAlign: "center", paddingTop: "150px" }}
      >
        <h2>Không tìm thấy khuyến mãi</h2>
        <Link
          to="/home/promotions"
          className="btn btn-red-gradient mt-3"
          style={{ padding: "12px 24px", borderRadius: "8px" }}
        >
          Quay lại
        </Link>
      </div>
    );
  }

  return (
    <div className="news-detail-page">
      <div className="news-detail">
        <h2>{promotion.title}</h2>
        <p
          className="p-color"
          style={{ marginBottom: "8px", fontSize: "13px" }}
        >
          {new Date(promotion.date).toLocaleDateString("vi-VN")}
        </p>

        <div className="news-detail-img">
          {promotion.img.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`${promotion.title} - ${index + 1}`}
            />
          ))}
        </div>

        <div className="detail-list">
          {promotion.description.split("\n").map((paragraph, index) => (
            <p key={index} className="p-color">
              {paragraph}
            </p>
          ))}
        </div>

        <Link
          to="/home/promotions"
          style={{
            color: "#60A5FA",
            marginTop: "40px",
            display: "inline-block",
          }}
        >
          Quay lại khuyến mãi
        </Link>
      </div>
    </div>
  );
};

export default PromotionDetailPage;
