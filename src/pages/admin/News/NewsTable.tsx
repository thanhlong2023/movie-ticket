import type { NewsType } from "../../../types";
import NewsItem from "./NewsItem";

interface NewsTableProps {
  news: NewsType[];
  handleDelete: (id: number) => void;
}

function NewsTable({ news, handleDelete }: NewsTableProps) {
  return (
      <table className="table table-theater table-dark table-borderless align-middle mb-0">
          <thead>
              <tr className="text-uppercase">
                  <th>ID</th>
                  <th>Hình ảnh</th>
                  <th>Tiêu đề</th>
                  <th>Ngày đăng</th>
                  <th>Hành động</th>
              </tr>
          </thead>
          <tbody>
              {news.length === 0 ? (
                  <tr>
                      <td
                          colSpan={6}
                          className="text-center py-5 text-secondary"
                      >
                          Chưa có tin tức nào.
                      </td>
                  </tr>
              ) : (
                  news.map((item) => (
                      <NewsItem
                          key={item.id}
                          item={item}
                          handleDelete={handleDelete}
                      />
                  ))
              )}
          </tbody>
      </table>
  );
}

export default NewsTable;
