import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../../../services/api";
import { useAppDispatch } from "../../../hook/hook";
import { createMovie, updateMovie } from "../../../features/movieSlice";
import { showNotification } from "../../../features/notificationSlice";
import {
  searchMovies,
  getMovieDetails,
  getNowPlayingMovies,
  getFullImageUrl,
} from "../../../services/tmdbService";
import type {
  TMDBMovieSummary,
  TMDBMovieCrew,
  TMDBMovieCast,
  TMDBGenre,
  TMDBMovieVideo,
} from "../../../types";

interface MovieFormData {
  title: string;
  description: string;
  premiere: string;
  duration: number;
  country: string;
  age_limit?: string;
  format?: string;
  image?: string;
  video?: string;
  tag?: string;
  author?: string;
  actor?: string;
  status: "showing" | "upcoming" | "stopped";
}

const MovieForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isEditMode = !!id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm<MovieFormData>();
  const [loading, setLoading] = useState(false);

  // TMDB State
  const [tmdbQuery, setTmdbQuery] = useState("");
  const [tmdbResults, setTmdbResults] = useState<TMDBMovieSummary[]>([]);
  const [khamPhaMovies, setKhamPhaMovies] = useState<TMDBMovieSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Debounce ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const imageUrl = watch("image");

  const COUNTRIES = [
    "Việt Nam",
    "Mỹ",
    "Hàn Quốc",
    "Nhật Bản",
    "Trung Quốc",
    "Thái Lan",
    "Anh",
    "Pháp",
    "Ấn Độ",
    "Khác",
  ];

  const fetchMovie = useCallback(async () => {
    try {
      const response = await api.get(`/movies/${id}`);
      const movie = response.data;

      // Set specific fields instead of using Object.keys
      setValue("title", movie.title);
      setValue("description", movie.description);
      setValue("premiere", movie.premiere);
      setValue("duration", movie.duration);
      setValue("country", movie.country);
      setValue("age_limit", movie.age_limit);
      setValue("format", movie.format);
      setValue("image", movie.image);
      setValue("video", movie.video);
      setValue("status", movie.status);

      if (Array.isArray(movie.tag)) setValue("tag", movie.tag.join(", "));
      if (Array.isArray(movie.author))
        setValue("author", movie.author.join(", "));
      if (Array.isArray(movie.actor)) setValue("actor", movie.actor.join(", "));
    } catch (error) {
      console.error("Error fetching movie:", error);
    }
  }, [id, setValue]);

  useEffect(() => {
    if (isEditMode) {
      fetchMovie();
    } else {
      // Set default status to "upcoming" for new movies
      setValue("status", "upcoming");
    }
  }, [isEditMode, fetchMovie, setValue]);

  // Debounced search effect
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If query is empty, clear results
    if (!tmdbQuery.trim()) {
      setTmdbResults([]);
      setShowResults(false);
      return;
    }

    // Set new debounce timer (500ms delay)
    debounceTimerRef.current = setTimeout(() => {
      handleTmdbSearch(tmdbQuery);
    }, 500);

    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [tmdbQuery]);

  const handleTmdbSearch = async (query: string) => {
    if (!query.trim()) return;
    setSearching(true);
    setShowResults(true);
    try {
      const results = await searchMovies(query);
      setTmdbResults(results);
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const handleOpenModal = async () => {
    setShowModal(true);
    try {
      // Fetch now playing movies
      const data = await getNowPlayingMovies();
      // Prioritize VN if implicit but API handles region.
      // We can sort if needed, but for now just show them.
      setKhamPhaMovies(data.results || []);
    } catch (error) {
      console.error(error);
      dispatch(
        showNotification({ message: "Lỗi tải danh sách phim", type: "danger" })
      );
    }
  };

  const selectTmdbMovie = async (tmdbId: number) => {
    setSearching(true);
    setShowModal(false); // Close modal if open
    try {
      const details = await getMovieDetails(tmdbId);
      if (details) {
        setValue("title", details.title);
        setValue("description", details.overview);
        setValue("premiere", details.release_date);
        setValue("duration", details.runtime || 120);
        setValue("country", details.production_countries?.[0]?.name || "");
        if (details.poster_path)
          setValue("image", getFullImageUrl(details.poster_path));
        const genres = details.genres?.map((g: TMDBGenre) => g.name).join(", ");
        setValue("tag", genres);
        const director = details.credits?.crew?.find(
          (c: TMDBMovieCrew) => c.job === "Director"
        )?.name;
        if (director) setValue("author", director);
        const cast = details.credits?.cast
          ?.slice(0, 5)
          .map((c: TMDBMovieCast) => c.name)
          .join(", ");
        if (cast) setValue("actor", cast);
        const trailer = details.videos?.results?.find(
          (v: TMDBMovieVideo) => v.type === "Trailer" && v.site === "YouTube"
        );
        if (trailer)
          setValue("video", `https://www.youtube.com/embed/${trailer.key}`);

        // Set default status to upcoming for new movies from TMDB
        setValue("status", "upcoming");
        setTmdbResults([]);
        setShowResults(false);
        // Clear errors if any
        clearErrors();
      }
    } catch (error) {
      console.error(error);
      dispatch(
        showNotification({ message: "Lỗi lấy dữ liệu từ TMDB", type: "danger" })
      );
    } finally {
      setSearching(false);
    }
  };

  const onSubmit = async (data: MovieFormData) => {
    setLoading(true);
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.id;

    if (!userId) {
      dispatch(
        showNotification({
          message: "Phiên đăng nhập không hợp lệ",
          type: "danger",
        })
      );
      return;
    }

    try {
      const processedData = {
        ...data,
        userId: Number(userId), // Bind creator
        tag: data.tag
          ? data.tag.split(",").map((item: string) => item.trim())
          : [],
        author: data.author
          ? data.author.split(",").map((item: string) => item.trim())
          : [],
        actor: data.actor
          ? data.actor.split(",").map((item: string) => item.trim())
          : [],
        duration: Number(data.duration),
        schedule: isEditMode ? undefined : [],
      };

      if (isEditMode) {
        await dispatch(
          updateMovie({ id: Number(id), data: processedData })
        ).unwrap();
      } else {
        await dispatch(createMovie(processedData)).unwrap();
      }
      navigate("/admin/movies");
    } catch (error: unknown) {
      console.error("Error saving movie:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="text-white fw-bold mb-1">
            {isEditMode ? "Chỉnh sửa phim" : "Thêm phim mới"}
          </h2>
          <p className="text-secondary m-0">Quản lý thông tin chi tiết phim</p>
        </div>
        <button
          onClick={() => navigate("/admin/movies")}
          className="btn btn-outline-secondary px-4"
        >
          <i className="bi bi-x-lg me-2"></i>Đóng
        </button>
      </div>

      <div className="row g-5">
        {/* LEFT COLUMN */}
        <div className="col-lg-4 col-xl-3">
          {/* SEARCH */}
          {!isEditMode && (
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label text-warning mb-0">
                  <i className="bi bi-magic me-2"></i>Auto-fill (TMDB)
                </label>
                <button
                  className="btn btn-sm btn-outline-warning"
                  type="button"
                  onClick={handleOpenModal}
                >
                  <i className="bi bi-grid-fill me-1"></i>Duyệt phim
                </button>
              </div>

              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nhập tên phim..."
                  value={tmdbQuery}
                  onChange={(e) => setTmdbQuery(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleTmdbSearch(tmdbQuery)
                  }
                />
                <button
                  className="btn btn-red-shadow"
                  onClick={() => handleTmdbSearch(tmdbQuery)}
                  disabled={searching}
                >
                  {searching ? "..." : <i className="bi bi-search"></i>}
                </button>
              </div>

              {showResults && tmdbResults.length > 0 && (
                <div
                  className="mt-2 bg-dark rounded border border-secondary overflow-hidden custom-scrollbar"
                  style={{ maxHeight: "300px", overflowY: "auto" }}
                >
                  {tmdbResults.map((movie) => (
                    <div
                      key={movie.id}
                      className="p-2 border-bottom border-secondary d-flex gap-3 cursor-pointer hover-bg-light"
                      style={{ cursor: "pointer" }}
                      onClick={() => selectTmdbMovie(movie.id)}
                    >
                      {movie.poster_path && (
                        <img
                          src={getFullImageUrl(movie.poster_path)}
                          className="rounded"
                          width="40"
                          height="60"
                          alt=""
                        />
                      )}
                      <div>
                        <div className="fw-bold text-white small">
                          {movie.title}
                        </div>
                        <small className="text-secondary">
                          {movie.release_date?.substring(0, 4)}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PREVIEW */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Poster</h5>
            </div>
            <div className="card-body p-3">
              <div className="poster-preview-container">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Poster"
                    className="poster-preview-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/300x450?text=Invalid+Image";
                    }}
                  />
                ) : (
                  <div className="text-center text-secondary">
                    <i className="bi bi-image" style={{ fontSize: "3rem" }}></i>
                    <p className="mt-2">Preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-lg-8 col-xl-9">
          <div className="card">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit(onSubmit)}>
                <h5 className="mb-4 text-white p-2 border-start border-4 border-danger ps-3 bg-opacity-10 bg-white rounded-end">
                  Thông tin cơ bản
                </h5>

                <div className="row g-4 mb-5">
                  <div className="col-12">
                    <label className="form-label">
                      Tên phim <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.title ? "is-invalid" : ""
                      }`}
                      {...register("title", {
                        required: "Tên phim là bắt buộc",
                        validate: async (value) => {
                          try {
                            const response = await fetch(
                              "http://localhost:3001/movies"
                            );
                            const allMovies = await response.json();
                            const isDuplicate = allMovies.some(
                              (m: { id: number; title: string }) =>
                                m.title.toLowerCase() === value.toLowerCase() &&
                                (!isEditMode || m.id !== Number(id))
                            );
                            return isDuplicate ? "Tên phim đã tồn tại" : true;
                          } catch (error) {
                            console.error("Error checking title:", error);
                            return "Lỗi kiểm tra tên phim";
                          }
                        },
                      })}
                    />
                    {errors.title && (
                      <div className="invalid-feedback">
                        {errors.title.message as string}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Tên gốc / English Title
                    </label>
                    <input
                      className="form-control"
                      placeholder="Tên tiếng Anh (nếu có)..."
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">
                      Thời lượng (phút) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      {...register("duration", {
                        required: "Thời lượng là bắt buộc",
                        min: {
                          value: 60,
                          message: "Thời lượng phải ít nhất 60 phút",
                        },
                      })}
                      className={`form-control text-center font-monospace ${
                        errors.duration ? "is-invalid" : ""
                      }`}
                    />
                    {errors.duration && (
                      <div className="invalid-feedback">
                        {errors.duration.message as string}
                      </div>
                    )}
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">
                      Quốc gia <span className="text-danger">*</span>
                    </label>
                    <select
                      {...register("country", {
                        required: "Vui lòng chọn quốc gia",
                      })}
                      className={`form-select ${
                        errors.country ? "is-invalid" : ""
                      }`}
                    >
                      <option value="">-- Chọn --</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.country && (
                      <div className="invalid-feedback">
                        {errors.country.message as string}
                      </div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      Phân loại <span className="text-danger">*</span>
                    </label>
                    <select
                      {...register("age_limit", { required: true })}
                      className="form-select"
                    >
                      <option value="P">P - Mọi lứa tuổi</option>
                      <option value="T13">T13 - 13 tuổi trở lên</option>
                      <option value="T16">T16 - 16 tuổi trở lên</option>
                      <option value="T18">T18 - 18 tuổi trở lên</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      Ngày khởi chiếu <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      {...register("premiere", {
                        required: "Ngày khởi chiếu là bắt buộc",
                      })}
                      className={`form-control ${
                        errors.premiere ? "is-invalid" : ""
                      }`}
                    />
                    {errors.premiere && (
                      <div className="invalid-feedback">
                        {errors.premiere.message as string}
                      </div>
                    )}
                  </div>
                </div>

                <h5 className="mb-4 text-white p-2 border-start border-4 border-danger ps-3 bg-opacity-10 bg-white rounded-end">
                  Chi tiết & Media
                </h5>

                <div className="row g-4">
                  <div className="col-12">
                    <label className="form-label">
                      Poster URL <span className="text-danger">*</span>
                    </label>
                    <input
                      {...register("image", {
                        required: "Poster URL là bắt buộc",
                        pattern: {
                          value: /^https?:\/\/.+/,
                          message: "URL không hợp lệ (phải bắt đầu bằng http)",
                        },
                      })}
                      className={`form-control font-monospace text-secondary ${
                        errors.image ? "is-invalid" : ""
                      }`}
                      placeholder="https://..."
                    />
                    {errors.image && (
                      <div className="invalid-feedback">
                        {errors.image.message as string}
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label">
                      Trailer Video (YouTube Embed){" "}
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      {...register("video", {
                        required: "Trailer URL là bắt buộc",
                        pattern: {
                          value: /^https?:\/\/.+/,
                          message: "URL không hợp lệ",
                        },
                      })}
                      className={`form-control font-monospace text-secondary ${
                        errors.video ? "is-invalid" : ""
                      }`}
                      placeholder="https://www.youtube.com/embed/..."
                    />
                    {errors.video && (
                      <div className="invalid-feedback">
                        {errors.video.message as string}
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label">
                      Thể loại <span className="text-danger">*</span>
                    </label>
                    <input
                      {...register("tag", {
                        required: "Thể loại là bắt buộc",
                      })}
                      className={`form-control ${
                        errors.tag ? "is-invalid" : ""
                      }`}
                      placeholder="Hành động, Phiêu lưu..."
                    />
                    {errors.tag && (
                      <div className="invalid-feedback">
                        {errors.tag.message as string}
                      </div>
                    )}
                    <div className="form-text text-secondary opacity-50">
                      Phân cách bằng dấu phẩy
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Đạo diễn <span className="text-danger">*</span>
                    </label>
                    <input
                      {...register("author", {
                        required: "Tên đạo diễn là bắt buộc",
                      })}
                      className={`form-control ${
                        errors.author ? "is-invalid" : ""
                      }`}
                    />
                    {errors.author && (
                      <div className="invalid-feedback">
                        {errors.author.message as string}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Diễn viên chính <span className="text-danger">*</span>
                    </label>
                    <input
                      {...register("actor", {
                        required: "Tên diễn viên là bắt buộc",
                      })}
                      className={`form-control ${
                        errors.actor ? "is-invalid" : ""
                      }`}
                    />
                    {errors.actor && (
                      <div className="invalid-feedback">
                        {errors.actor.message as string}
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label">
                      Mô tả nội dung <span className="text-danger">*</span>
                    </label>
                    <textarea
                      {...register("description", {
                        required: "Mô tả nội dung là bắt buộc",
                      })}
                      className={`form-control ${
                        errors.description ? "is-invalid" : ""
                      }`}
                      rows={6}
                      placeholder="Tóm tắt nội dung phim..."
                    ></textarea>
                    {errors.description && (
                      <div className="invalid-feedback">
                        {errors.description.message as string}
                      </div>
                    )}
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-3 mt-5 border-top border-secondary pt-4">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/movies")}
                    className="btn btn-outline-secondary px-5 py-2"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-red-shadow px-5 py-2 fw-bold"
                    disabled={loading}
                  >
                    {loading
                      ? "Đang lưu..."
                      : isEditMode
                      ? "Cập Nhật Phim"
                      : "Tạo Phim Mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL BROWSE MOVIES */}
      {showModal && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          >
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
              <div className="modal-content bg-dark border border-secondary shadow-lg">
                <div className="modal-header border-secondary">
                  <h5 className="modal-title text-white">
                    <i className="bi bi-film me-2 text-warning"></i>
                    Phim Đang/Sắp Chiếu (TMDB)
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <div className="modal-body p-4 custom-scrollbar">
                  <div className="row row-cols-2 row-cols-md-4 row-cols-lg-5 g-4">
                    {khamPhaMovies.map((movie) => (
                      <div key={movie.id} className="col">
                        <div
                          className="card h-100 bg-black border-secondary hover-scale cursor-pointer"
                          onClick={() => selectTmdbMovie(movie.id)}
                          style={{ transition: "transform 0.2s" }}
                        >
                          <img
                            src={getFullImageUrl(movie.poster_path)}
                            className="card-img-top"
                            alt={movie.title}
                            style={{
                              aspectRatio: "2/3",
                              objectFit: "cover",
                            }}
                          />
                          <div className="card-body p-2">
                            <h6 className="card-title text-white text-truncate mb-1">
                              {movie.title}
                            </h6>
                            <small className="text-secondary d-flex justify-content-between">
                              <span>{movie.release_date?.substring(0, 4)}</span>
                              <span>
                                <i className="bi bi-star-fill text-warning me-1"></i>
                                {movie.vote_average?.toFixed(1)}
                              </span>
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {khamPhaMovies.length === 0 && (
                    <div className="text-center py-5">
                      <div className="spinner-border text-danger" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MovieForm;
