import { useEffect, useState } from "react";
import TitleCategory from "../../../components/TitleCategory";
import BoxMovie from "../../../components/BoxMovie";
import HomeCarousel from "../../../components/HomeCarousel";
import "./HomePage.css";
import api from "../../../services/api";
import type { Movie, Showtime, Promotion, NewsType } from "../../../types";
import {
  filterNowPlayingMovies,
  filterComingSoonMovies,
} from "../../../services/movieStatusService";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

function HomePage() {
  const [nowPlayingMovies, setNowPlayingMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [news, setNews] = useState<NewsType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch movies, showtimes, promotions, and news from the database
        const [moviesRes, showtimesRes, promotionsRes, newsRes] =
          await Promise.all([
            api.get("/movies"),
            api.get("/showtimes"),
            api.get("/promotions"),
            api.get("/news"),
          ]);

        const movies: Movie[] = moviesRes.data;
        const showtimes: Showtime[] = showtimesRes.data;

        // Automatically classify movies based on premiere date and showtimes
        const nowPlaying = filterNowPlayingMovies(movies, showtimes);
        const comingSoon = filterComingSoonMovies(movies, showtimes);

        setNowPlayingMovies(nowPlaying);
        setUpcomingMovies(comingSoon);
        setPromotions(promotionsRes.data);
        setNews(newsRes.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div
        className="home-page d-flex justify-content-center align-items-center"
        style={{ minHeight: "50vh" }}
      >
        <div className="text-white">Đang tải...</div>
      </div>
    );
  }

  return (
    <>
      <div className="home-page">
        <div className="movie d-flex flex-column">
          <div>
            <TitleCategory title={"Phim đang chiếu"} link={"/home/calendar"} />

            {/* Desktop View: Grid Layout */}
            <div className="list-movies desktop-only">
              {nowPlayingMovies.length === 0 ? (
                <div className="text-secondary p-4">
                  Hiện chưa có phim đang chiếu. Vui lòng thêm suất chiếu cho
                  phim.
                </div>
              ) : (
                nowPlayingMovies.map((movie) => (
                  <BoxMovie
                    key={movie.id}
                    id={movie.id}
                    path={`/home/movie/${movie.id}`}
                    image={movie.image}
                    category={movie.tag[0] || "Phim"}
                    date={movie.premiere}
                    title={movie.title}
                    age={movie.age_limit}
                  />
                ))
              )}
            </div>

            {/* Mobile/Tablet View: Coverflow Swiper */}
            <div className="d-lg-none swiper-container-custom now-playing-swiper">
              {nowPlayingMovies.length === 0 ? (
                <div className="text-secondary p-4">
                  Hiện chưa có phim đang chiếu.
                </div>
              ) : (
                <Swiper
                  effect="coverflow"
                  grabCursor
                  centeredSlides
                  slidesPerView="auto"
                  loop
                  speed={600}
                  coverflowEffect={{
                    rotate: 0,
                    stretch: -60,
                    depth: 300,
                    modifier: 1,
                    slideShadows: false,
                  }}
                  autoplay={{ delay: 3000, disableOnInteraction: false }}
                  modules={[EffectCoverflow, Autoplay]}
                  className="nowPlayingSwiper"
                  initialSlide={Math.floor(nowPlayingMovies.length / 2)}
                >
                  {nowPlayingMovies.map((movie) => (
                    <SwiperSlide key={movie.id} className="nowPlayingSlide">
                      <BoxMovie
                        id={movie.id}
                        path={`/home/movie/${movie.id}`}
                        image={movie.image}
                        category={movie.tag[0] || "Phim"}
                        date={movie.premiere}
                        title={movie.title}
                        age={movie.age_limit}
                        mode="compact"
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>
          </div>

          <div>
            <TitleCategory
              title={"Phim sắp chiếu"}
              link={"/home/calendar"}
              viewAll={false}
            />
            <div className="list-movies upcoming-list">
              {upcomingMovies.length === 0 ? (
                <div className="text-secondary p-4">
                  Hiện chưa có phim sắp chiếu.
                </div>
              ) : (
                upcomingMovies.map((movie) => (
                  <BoxMovie
                    key={movie.id}
                    id={movie.id}
                    path={`/home/movie/${movie.id}`}
                    image={movie.image}
                    category={movie.tag[0] || "Phim"}
                    date={movie.premiere}
                    title={movie.title}
                    age={movie.age_limit}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="discount d-flex flex-column">
          <div>
            <TitleCategory
              title={"Khuyến mãi"}
              link={"/home/promotions"}
              dot={false}
            />
            <HomeCarousel items={promotions} basePath="/home/promotions" />
          </div>

          <div>
            <TitleCategory title={"Sự kiện"} link={"/home/news"} dot={false} />
            <HomeCarousel items={news} basePath="/home/news" />
          </div>

          <div className="mt-3">
            <div className="d-flex flex-column gap-3">
              {promotions
                .slice()
                .sort(() => 0.5 - Math.random())
                .slice(0, 3)
                .map((promo) => (
                  <div key={promo.id}>
                    <a
                      href={`/home/promotions/${promo.id}`}
                      className="static-promo-link"
                    >
                      <div className="static-promo-img-container">
                        <img src={promo.img[0]} alt={promo.title} />
                      </div>
                    </a>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default HomePage;
