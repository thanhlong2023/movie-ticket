import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useConfirm } from "../../../hook/useConfirm";
import { useAppDispatch, useAppSelector } from "../../../hook/hook";
import { showNotification } from "../../../features/notificationSlice";
import { fetchMovies, deleteMovie } from "../../../features/movieSlice";
import PaginationControls from "../../../components/PaginationControls";

const MoviesAdmin = () => {
  const dispatch = useAppDispatch();
  const { movies, loading } = useAppSelector((state) => state.movies);
  const confirm = useConfirm();

  useEffect(() => {
    dispatch(fetchMovies());
  }, [dispatch]);

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: "Xóa phim",
      message: "Bạn có chắc chắn muốn xóa phim này?",
      confirmText: "Xóa",
      cancelText: "Hủy",
    });

    if (confirmed) {
      await dispatch(deleteMovie(id))
        .unwrap()
        .then(() => {
          dispatch(
            showNotification({
              message: "Xóa phim thành công!",
              type: "success",
            })
          );
        })
        .catch((error) => {
          console.error("Error deleting movie:", error);
          dispatch(
            showNotification({
              message: "Xóa phim thất bại",
              type: "danger",
            })
          );
        });
    }
  };

  // Pagination
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedMovies = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return movies.slice(start, start + PAGE_SIZE);
  }, [currentPage, movies]);

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-white fw-bold mb-0">Quản lý Phim</h2>
        <Link to="/admin/movies/new" className="btn btn-red-shadow px-4">
          <i className="bi bi-plus-lg me-2"></i>Thêm phim mới
        </Link>
      </div>

      <div className="data-table-container">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Hình ảnh</th>
                <th>Tên phim</th>
                <th>Thời lượng</th>
                <th>Khởi chiếu</th>
                <th>Độ tuổi</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMovies.map((movie) => (
                <tr key={movie.id}>
                  <td>{movie.id}</td>
                  <td>
                    <img
                      src={movie.image}
                      alt={movie.title}
                      style={{
                        width: "40px",
                        height: "60px",
                        objectFit: "cover",
                        borderRadius: "4px",
                      }}
                    />
                  </td>
                  <td style={{ fontWeight: 500 }}>{movie.title}</td>
                  <td>{movie.duration} phút</td>
                  <td>
                    {new Date(movie.premiere).toLocaleDateString("vi-VN")}
                  </td>
                  <td>
                    <span className="badge badge-warning">
                      {movie.age_limit}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/admin/movies/${movie.id}/edit`}
                      className="btn btn-outline-info btn-sm me-2"
                      title="Sửa"
                    >
                      <i className="bi bi-pencil"></i>
                    </Link>
                    <button
                      onClick={() => handleDelete(movie.id)}
                      className="btn btn-outline-danger btn-sm"
                      title="Xóa"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {movies.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-secondary">
                    <i className="bi bi-film me-2"></i>
                    Chưa có dữ liệu phim
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          currentPage={currentPage}
          totalItems={movies.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default MoviesAdmin;
