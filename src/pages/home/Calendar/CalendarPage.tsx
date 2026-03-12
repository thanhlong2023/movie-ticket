import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CalendarPage.css";
import type { Movie, Showtime } from "../../../types";
import api from "../../../services/api";
import {
  getMoviesWithShowtimesOnDate,
  getShowtimesForMovieOnDate,
} from "../../../services/movieStatusService";

interface Theater {
  id: number;
  name: string;
  address: string;
  region?: string;
}

interface Screen {
  id: number;
  theaterId: number;
  name: string;
  type: string;
  capacity: number;
}

interface Region {
  id: number;
  name: string;
  slug: string;
}

function CalendarPage() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(0);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [moviesRes, showtimesRes, theatersRes, screensRes, regionsRes] =
        await Promise.all([
          api.get("/movies"),
          api.get("/showtimes"),
          api.get("/theaters"),
          api.get("/screens"),
          api.get("/regions"),
        ]);
      setMovies(moviesRes.data);
      setShowtimes(showtimesRes.data);
      setTheaters(theatersRes.data);
      setScreens(screensRes.data);
      setRegions(regionsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique dates from showtimes (active only)
  const dates = useMemo(() => {
    if (showtimes.length === 0) return [];

    const uniqueDates = new Set<string>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    showtimes.forEach((st) => {
      const stDate = new Date(st.startTime);
      // Compare dates only
      const compareDate = new Date(stDate);
      compareDate.setHours(0, 0, 0, 0);
      
      if (compareDate >= today) {
        uniqueDates.add(st.startTime.split("T")[0]);
      }
    });

    return Array.from(uniqueDates)
      .sort()
      .map((dateStr) => {
        const dateObj = new Date(dateStr);
        return {
          dateObj: dateObj,
          date: dateStr,
          dayOfWeek: dateObj.toLocaleDateString("vi-VN", {
            weekday: "short",
          }),
          dayNumber: dateObj.getDate().toString().padStart(2, "0"),
          month: (dateObj.getMonth() + 1).toString().padStart(2, "0"),
          year: dateObj.getFullYear(),
        };
      });
  }, [showtimes]);

  // Reset selected date if out of bounds
  useEffect(() => {
      /* If currently selected index is invalid (e.g. list shrank), reset to 0 */
      if (selectedDate >= dates.length && dates.length > 0) {
          setSelectedDate(0);
      }
  }, [dates, selectedDate]);

  // Lọc phim có suất chiếu trong ngày được chọn
  const moviesForSelectedDate = useMemo(() => {
    if (!dates[selectedDate]) return [];
    return getMoviesWithShowtimesOnDate(
      movies,
      dates[selectedDate].dateObj,
      showtimes
    );
  }, [movies, showtimes, selectedDate, dates]);

  // Format time from ISO string to HH:mm
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  // Open modal when clicking on movie
  const openBookingModal = (movie: Movie) => {
    setSelectedMovie(movie);
    setShowModal(true);
    setSelectedRegion("all");
  };

  // Group showtimes by theater and screen type
  const groupedShowtimes = useMemo(() => {
    // Get showtimes for selected movie on selected date
    if (!selectedMovie || !dates[selectedDate]) return [];
    const modalShowtimes = getShowtimesForMovieOnDate(
      selectedMovie.id,
      dates[selectedDate].dateObj,
      showtimes
    );
    const result: Record<
      number,
      { theater: Theater; byType: Record<string, Showtime[]> }
    > = {};

    modalShowtimes.forEach((st) => {
      const theater = theaters.find((t) => t.id === st.theaterId);
      const screen = screens.find((s) => s.id === st.screenId);

      if (!theater || !screen) return;

      // Filter by region
      if (selectedRegion !== "all" && theater.region !== selectedRegion) return;

      if (!result[theater.id]) {
        result[theater.id] = { theater, byType: {} };
      }

      const screenType = screen.type || "2D";
      if (!result[theater.id].byType[screenType]) {
        result[theater.id].byType[screenType] = [];
      }

      result[theater.id].byType[screenType].push(st);
    });

    return Object.values(result);
  }, [
    selectedMovie,
    selectedDate,
    showtimes,
    theaters,
    screens,
    selectedRegion,
    dates,
  ]);

  // Navigate to seat selection page
  const handleSelectShowtime = (showtime: Showtime) => {
    setShowModal(false);
    // Navigate to movie detail page with showtime info in query params
    const theater = theaters.find((t) => t.id === showtime.theaterId);
    const screen = screens.find((s) => s.id === showtime.screenId);

    const params = new URLSearchParams({
      showtimeId: String(showtime.id),
      theaterId: String(showtime.theaterId),
      theaterName: theater?.name || "",
      screenId: String(showtime.screenId),
      screenType: screen?.type || "2D",
      startTime: showtime.startTime,
      price: String(showtime.price),
      priceVip: String(showtime.priceVip || showtime.price + 20000),
      priceCouple: String(showtime.priceCouple || showtime.price * 2),
    });

    navigate(`/home/movie/${selectedMovie?.id}?${params.toString()}`);
  };

  // Get region name
  const getRegionName = (slug: string) => {
    const region = regions.find((r) => r.slug === slug);
    return region?.name || slug;
  };

  if (loading) return <div className="text-white p-4">Đang tải...</div>;

  return (
    <div className="calendar-page flex flex-column">
      <div className="calendar-title flex gap-2">
        <div className="title-dot"></div>
        <div>Phim đang chiếu</div>
      </div>

      <div className="flex flex-wrap calendar-title-button gap-3">
        {dates.map((date, index) => (
          <button
            key={date.date}
            className={selectedDate === index ? "btn-red-gradient" : ""}
            onClick={() => setSelectedDate(index)}
          >
            {date.dayNumber}-{date.month}-{date.year}
          </button>
        ))}
      </div>

      <div className="calendar-danger">
        <b>Lưu ý:</b> Khán giả dưới 13 tuổi chỉ chọn suất chiếu kết thúc trước
        22h và Khán giả dưới 16 tuổi chỉ chọn suất chiếu kết thúc trước 23h.
      </div>

      <div className="flex flex-wrap gap-4 align-items-start">
        {moviesForSelectedDate.length === 0 ? (
          <div className="text-secondary p-4">
            Không có phim nào chiếu trong ngày này.
          </div>
        ) : (
          moviesForSelectedDate.map((movie) => (
            <div
              key={movie.id}
              className="movie-card d-flex cursor-pointer"
              onClick={() => openBookingModal(movie)}
              style={{ cursor: "pointer" }}
            >
              <img src={movie.image} alt={movie.title} />
              <button className="div-2D">{movie.format || "2D"}</button>
              <div className="d-flex flex-column card-content">
                <div className="type-time flex disable justify-content-start gap-type-time">
                  <div>{movie.tag?.[0]}</div>
                  <div>{movie.duration} phút</div>
                </div>
                <div className="movie-name flex flex-column align-items-start gap-1">
                  <div className="fw-bold">
                    {movie.title.toUpperCase()}-{movie.age_limit}
                  </div>
                  <div>Xuất xứ: {movie.country}</div>
                  <div>
                    Khởi chiếu:{" "}
                    {new Date(movie.premiere).toLocaleDateString("vi-VN")}
                  </div>
                  <div className="text-danger small">
                    {movie.age_limit} -{" "}
                    {movie.age_limit === "T18"
                      ? "18+"
                      : movie.age_limit === "T16"
                      ? "16+"
                      : movie.age_limit === "T13"
                      ? "13+"
                      : "Mọi lứa tuổi"}
                  </div>
                </div>
                <div className="mt-2">
                  <button className="btn btn-danger btn-sm px-4">
                    <i className="bi bi-ticket-perforated me-2"></i>
                    Đặt vé
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Booking Modal */}
      {showModal && selectedMovie && (
        <div
          className="booking-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="booking-modal-header">
              <div className="d-flex align-items-center gap-3">
                <img
                  src={selectedMovie.image}
                  alt={selectedMovie.title}
                  className="booking-modal-poster"
                />
                <div>
                  <h4 className="mb-1 text-white fw-bold">
                    {selectedMovie.title}
                  </h4>
                  <div className="text-secondary small">
                    <span className="badge bg-danger me-2">
                      {selectedMovie.age_limit}
                    </span>
                    <span>{selectedMovie.duration} phút</span>
                    <span className="mx-2">•</span>
                    <span>{selectedMovie.format || "2D"}</span>
                  </div>
                  <div className="text-secondary small mt-1">
                    {dates[selectedDate]?.dayNumber}/
                    {dates[selectedDate]?.month}/{dates[selectedDate]?.year}
                  </div>
                </div>
              </div>
              <button
                className="btn-close btn-close-white"
                onClick={() => setShowModal(false)}
              ></button>
            </div>

            {/* Region Filter */}
            <div className="booking-modal-filter">
              <div className="d-flex flex-wrap gap-2">
                <button
                  className={`btn btn-sm ${
                    selectedRegion === "all"
                      ? "btn-danger"
                      : "btn-outline-secondary"
                  }`}
                  onClick={() => setSelectedRegion("all")}
                >
                  Tất cả
                </button>
                {regions.map((region) => (
                  <button
                    key={region.id}
                    className={`btn btn-sm ${
                      selectedRegion === region.slug
                        ? "btn-danger"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() => setSelectedRegion(region.slug)}
                  >
                    {region.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Theaters List */}
            <div className="booking-modal-content">
              {groupedShowtimes.length === 0 ? (
                <div className="text-center text-secondary py-5">
                  <i className="bi bi-calendar-x fs-1 mb-3 d-block"></i>
                  Không có suất chiếu trong khu vực này
                </div>
              ) : (
                groupedShowtimes.map(({ theater, byType }) => (
                  <div key={theater.id} className="theater-item">
                    <div className="theater-header">
                      <div className="theater-info">
                        <h6 className="mb-0 fw-bold text-white">
                          {theater.name}
                        </h6>
                        <small className="text-secondary">
                          {theater.address}
                        </small>
                      </div>
                      {theater.region && (
                        <span className="badge bg-secondary">
                          {getRegionName(theater.region)}
                        </span>
                      )}
                    </div>

                    {Object.entries(byType).map(
                      ([screenType, typeShowtimes]) => (
                        <div key={screenType} className="screen-type-section">
                          <div className="screen-type-label">
                            <span
                              className={`badge ${
                                screenType === "3D"
                                  ? "bg-primary"
                                  : screenType === "IMAX"
                                  ? "bg-warning text-dark"
                                  : screenType === "4DX"
                                  ? "bg-info"
                                  : "bg-success"
                              }`}
                            >
                              {screenType}
                            </span>
                            <span className="text-secondary ms-2 small">
                              Phụ đề Việt
                            </span>
                          </div>
                          <div className="showtime-buttons">
                            {typeShowtimes.map((st) => (
                              <button
                                key={st.id}
                                className="showtime-btn"
                                onClick={() => handleSelectShowtime(st)}
                              >
                                <span className="showtime-time">
                                  {formatTime(st.startTime)}
                                </span>
                                <span className="showtime-price">
                                  {formatPrice(st.price)}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarPage;
