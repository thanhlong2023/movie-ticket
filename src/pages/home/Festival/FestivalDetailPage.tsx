import { useParams, Link, useSearchParams } from "react-router-dom";
import "./Festival.css";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../hook/hook";
import { fetchFestivalById } from "../../../features/festivalSlice";
import ReactMarkdown from "react-markdown";

const FestivalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const page = searchParams.get("page") || "1";

  const dispatch = useAppDispatch();

  const { festival, loading } = useAppSelector((state) => state.festivals);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    dispatch(fetchFestivalById(Number(id)));
  }, [id, dispatch]);

  if (loading) return <p>Loading...</p>;

  if (!festival) {
    return (
      <div className="festival-detail">
        <div className="festival-detail-content">
          <h1 className="festival-detail-title">
            Không tìm thấy liên hoan phim
          </h1>
          <Link
            to="/festival"
            className="btn-red-gradient"
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              display: "inline-block",
              marginTop: "20px",
            }}
          >
            Quay lại
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="festival-detail">
      {/* Content */}
      <div className="festival-detail-content">
        <h1 className="festival-detail-title">{festival.title}</h1>

        <div className="festival-detail-description">
          <ReactMarkdown>{festival.description}</ReactMarkdown>
        </div>

        {/* Schedule Section */}
        {festival.img && festival.img.length > 0 && (
          <div className="festival-schedule">
            {festival.img.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Schedule ${index + 1}`}
                className="festival-schedule-banner"
              />
            ))}
          </div>
        )}

        {/* Back button */}
        <div style={{ marginTop: "40px" }}>
          <Link
            to={`/home/festival?page=${page}`}
            style={{
              color: "#60A5FA",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ← Quay lại danh sách
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FestivalDetailPage;
