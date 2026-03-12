import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../hook/hook";
import { fetchNews } from "../../../features/newsSlice";
import PaginationControls from "../../../components/PaginationControls";
import "./NewsPage.css";

const PAGE_SIZE = 8;

const NewsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { news, loading, error } = useAppSelector((state) => state.news);
  const [searchParams, setSearchParams] = useSearchParams();

  const parsePageParam = (params: URLSearchParams) => {
    const pageParam = Number(params.get("page"));
    return Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  };

  const currentPage = parsePageParam(searchParams);

  useEffect(() => {
    dispatch(fetchNews());
  }, [dispatch]);

  // Sync logic removed as currentPage is now derived directly from URL

  useEffect(() => {
    // Only check bounds if we have data and we are not loading
    // This prevents premature redirection if data hasn't loaded yet
    if (!loading && news.length > 0) {
      const totalPages = Math.max(1, Math.ceil(news.length / PAGE_SIZE));
      if (currentPage > totalPages) {
        setSearchParams((prev) => {
          const params = new URLSearchParams(prev);
          params.set("page", String(totalPages));
          return params;
        });
      }
    }
  }, [news.length, currentPage, setSearchParams, loading]);

  const handlePageChange = (page: number) => {
    const nextPage = page < 1 ? 1 : page;
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", String(nextPage));
      return params;
    });
  };

  const paginatedNews = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return news.slice(start, start + PAGE_SIZE);
  }, [currentPage, news]);

  const getSnippet = (text: string) =>
    text.split("\n").filter(Boolean)[0]?.trim() ?? "";

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <main className="news-page">
      <div className="news-page-header">
        <div className="news-page-title">Tin tức</div>
        <p className="page-lead">
          Cập nhật hậu trường, cinetour, suất chiếu đặc biệt và toàn bộ những
          câu chuyện nóng hổi quanh màn bạc.
        </p>
      </div>

      <div className="news-grid">
        {paginatedNews.length === 0 ? (
          <div className="news-empty">Chưa có tin tức để hiển thị.</div>
        ) : (
          paginatedNews.map((item, index) => {
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
                to={`/home/news/${item.id}`}
                className="news-card"
              >
                <div className="news-card__image">
                  <img src={item.img[0]} alt={item.title} />
                  <span className="news-card__date">{formattedDate}</span>
                  <span className="news-card__eyebrow">
                    {index % 2 === 0 ? "Sự kiện rạp" : "Hậu trường phim"}
                  </span>
                </div>
                <div className="news-card__content">
                  <span className="news-card__date-inline">
                    {formattedDate}
                  </span>
                  <h3 className="news-title">{item.title}</h3>
                  <p className="news-snippet">{getSnippet(item.description)}</p>
                  <span className="news-cta">Đọc chi tiết</span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalItems={news.length}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
      />
    </main>
  );
};

export default NewsPage;
