import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../hook/hook";
import { fetchNewsById } from "../../../features/newsSlice";
import "./NewsDetailPage.css";

const NewsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { newsItem, loading, error } = useAppSelector((state) => state.news);

  useEffect(() => {
    if (id) {
      dispatch(fetchNewsById(Number(id)));
    }
  }, [dispatch, id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!newsItem) {
    return (
      <div
        className="news-detail-page"
        style={{ textAlign: "center"}}
      >
        <h2>Không tìm thấy tin tức</h2>
        <Link
          to="/home/news"
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
        <h2>{newsItem.title}</h2>
        <p
          className="p-color"
          style={{ marginBottom: "8px", fontSize: "13px" }}
        >
          {new Date(newsItem.date).toLocaleDateString("vi-VN")}
        </p>

        <div className="news-detail-img">
          {newsItem.img.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`${newsItem.title} - ${index + 1}`}
            />
          ))}
        </div>

        <div className="detail-list">
          {newsItem.description.split("\n").map((paragraph, index) => (
            <p key={index} className="p-color">
              {paragraph}
            </p>
          ))}
        </div>

        <Link
          to="/home/news"
          style={{
            color: "#60A5FA",
            marginTop: "40px",
            display: "inline-block",
          }}
        >
          Quay lại tin tức
        </Link>
    </div>
  );
};

export default NewsDetailPage;
