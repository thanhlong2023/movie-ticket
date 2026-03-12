import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo } from "react";
import "../NewsPage/NewsPage.css";
import { useAppDispatch, useAppSelector } from "../../../hook/hook";
import { fetchPromotions } from "../../../features/promotionSlice";
import PaginationControls from "../../../components/PaginationControls";

const PAGE_SIZE = 8;

const PromotionsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { promotions, loading, error } = useAppSelector(
    (state) => state.promotions
  );
  const [searchParams, setSearchParams] = useSearchParams();

  const parsePageParam = (params: URLSearchParams) => {
    const pageParam = Number(params.get("page"));
    return Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  };

  const currentPage = parsePageParam(searchParams);

  useEffect(() => {
    dispatch(fetchPromotions());
  }, [dispatch]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(promotions.length / PAGE_SIZE));
    if (currentPage > totalPages) {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set("page", String(totalPages));
        return params;
      });
    }
  }, [promotions.length, currentPage, setSearchParams]);

  const handlePageChange = (page: number) => {
    const nextPage = page < 1 ? 1 : page;
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", String(nextPage));
      return params;
    });
  };

  const paginatedPromotions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return promotions.slice(start, start + PAGE_SIZE);
  }, [currentPage, promotions]);

  const getSnippet = (text: string) =>
    text.split("\n").filter(Boolean)[0]?.trim() ?? "";

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <main className="news-page promotions-page">
      <div className="news-page-header">
        <div className="news-page-title">Khuyến mãi</div>
        <p className="page-lead">
          Combo bắp nước giá tốt, ưu đãi vé theo khung giờ vàng và quà tặng
          phiên bản giới hạn dành cho hội mê phim.
        </p>
      </div>

      <div className="news-grid">
        {paginatedPromotions.length === 0 ? (
          <div className="news-empty">Chưa có khuyến mãi để hiển thị.</div>
        ) : (
          paginatedPromotions.map((item, index) => {
            const formattedDate = new Date(item.date).toLocaleDateString(
              "vi-VN",
              {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }
            );

            return (
              <Link
                key={item.id}
                to={`/home/promotions/${item.id}`}
                className="news-card"
              >
                <div className="news-card__image">
                  <img src={item.img[0]} alt={item.title} />
                  <span className="news-card__date">{formattedDate}</span>
                  <span className="news-card__eyebrow is-promo">
                    {index % 2 === 0 ? "Ưu đãi hot" : "Deal giới hạn"}
                  </span>
                </div>
                <div className="news-card__content">
                  <span className="news-card__date-inline">
                    {formattedDate}
                  </span>
                  <h3 className="news-title">{item.title}</h3>
                  <p className="news-snippet">{getSnippet(item.description)}</p>
                  <span className="news-cta">Xem chi tiết</span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalItems={promotions.length}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
      />
    </main>
  );
};

export default PromotionsPage;
