import React from "react";
import "./PaginationControls.css";

interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalItems,
  pageSize = 8,
  onPageChange,
  className,
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  const pages = (() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pageList: Array<number | string> = [1];

    if (currentPage <= 3) {
      pageList.push(2, 3, 4, "ellipsis-right", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pageList.push("ellipsis-left", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pageList.push(
        "ellipsis-left",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "ellipsis-right",
        totalPages
      );
    }

    return pageList;
  })();

  const handleChange = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (nextPage !== currentPage) {
      onPageChange(nextPage);
    }
  };

  return (
    <div className={`list-pagination ${className ?? ""}`.trim()}>
      <button
        className="list-pagination__btn"
        onClick={() => handleChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Trang trước
      </button>
      <div className="list-pagination__pages">
        {pages.map((page) =>
          typeof page === "number" ? (
            <button
              key={page}
              className={`list-pagination__page ${
                page === currentPage ? "is-active" : ""
              }`}
              onClick={() => handleChange(page)}
            >
              {page}
            </button>
          ) : (
            <span key={page} className="list-pagination__ellipsis">
              …
            </span>
          )
        )}
      </div>
      <button
        className="list-pagination__btn"
        onClick={() => handleChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Trang sau
      </button>
    </div>
  );
};

export default PaginationControls;
