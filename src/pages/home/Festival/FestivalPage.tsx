import { Link, useSearchParams } from "react-router-dom";
import "./Festival.css";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hook/hook";
import { fetchFestivals } from "../../../features/festivalSlice";

const ITEM_PER_PAGE = 10;

const FestivalPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageFromUrl = Number(searchParams.get("page")) || 1;

  const [currentPage, setCurrentPage] = useState(1);
  const dispatch = useAppDispatch();

  const { festivals, loading, error } = useAppSelector(
    (state) => state.festivals
  );

  useEffect(() => {
    dispatch(fetchFestivals());
  }, [dispatch]);

  useEffect(() => {
    setCurrentPage(pageFromUrl);
  }, [pageFromUrl]);

  const totalPage = Math.max(1, Math.ceil(festivals.length / ITEM_PER_PAGE));

  const startIndex = (currentPage - 1) * ITEM_PER_PAGE;
  const currentFestival = festivals.slice(
    startIndex,
    startIndex + ITEM_PER_PAGE
  );

  const handlePrev = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      setSearchParams({ page: String(newPage) });
    }
  };

  const handleNext = () => {
    if (currentPage < totalPage) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      setSearchParams({ page: String(newPage) });
    }
  };

  return (
    <div className="festival-main">
      <div className="festival-list-banner">
        <img src="/image-carousel/carousel7.jpg" alt="banner" />
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-center text-white mt-4">Đang tải dữ liệu...</p>
      )}

      {/* Error */}
      {error && <p className="text-center text-danger mt-4">{error}</p>}

      <div className="listContent">
        {currentFestival.map((item, index) => (
          <Link
            key={item.id}
            to={`/home/festival/${item.id}?page=${currentPage}`}
            className={`${
              (index + 1) % ITEM_PER_PAGE == 0 ||
              index + 1 == currentFestival.length
                ? "bodyConten_NoBorder"
                : "bodyConten"
            }`}
          >
            <h5 className="title1">{item.title}</h5>
            <div className="festival-row">
              <div className="avata">
                <img src={item.img?.[0] || "/assets/img/image.png"} alt="" />
              </div>
              <div className="festival-content">
                <div className="festival-header">
                  <h5 className="title2">{item.title}</h5>
                  <span className="date">
                    {item.time}{" "}
                    {new Date(item.date).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <p className="text-limit">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
        <div className="pagination flex justify-content-end gap-3 mt-3">
          <button onClick={handlePrev} disabled={currentPage === 1}>
            Quay lại
          </button>

          <button onClick={handleNext} disabled={currentPage === totalPage}>
            Tiếp theo
          </button>
        </div>
      </div>
    </div>
  );
};

export default FestivalPage;
