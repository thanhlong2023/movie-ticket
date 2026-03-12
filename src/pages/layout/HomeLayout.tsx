import HomeHeader from "./HomeHeader";
import HomeFooter from "./HomeFooter";
import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { clearAllNotifications } from "../../features/notificationSlice";
import { useAppDispatch } from "../../hook/hook";
import "./layout.css";
// import CarouselWelcome from "../../components/CarouselWelcome";
import BackdropCarousel from "../../components/BackdropCarousel";
import type { CarouselItem } from "../../components/BackdropCarousel";
import LoginModal from "../auth/LoginModal";
import RegisterModal from "../auth/RegisterModal";
import CinemaChat from "../../components/CinemaChat";
import api from "../../services/api";
import type { Movie, Showtime, Promotion, NewsType } from "../../types";
import { filterNowPlayingMovies } from "../../services/movieStatusService";

function HomeLayout() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  /* const [movies, setMovies] = useState<Movie[]>([]); */
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);

  useEffect(() => {
    dispatch(clearAllNotifications());
  }, [dispatch, location.pathname]);

  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loginRedirectTo, setLoginRedirectTo] = useState<string | null>("/");

  useEffect(() => {
    const handleOpenLogin = (event: Event) => {
      const customEvent = event as CustomEvent<{ redirectTo?: string | null }>;
      const redirectTo = customEvent.detail?.redirectTo;
      setLoginRedirectTo(redirectTo === undefined ? "/" : redirectTo);
      setShowLogin(true);
      setShowRegister(false);
    };

    window.addEventListener("auth:open-login", handleOpenLogin);
    return () => window.removeEventListener("auth:open-login", handleOpenLogin);
  }, []);

  // Fetch data for BackdropCarousel
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesRes, showtimesRes, promotionsRes, newsRes] = await Promise.all([
          api.get("/movies"),
          api.get("/showtimes"),
          api.get("/promotions"),
          api.get("/news")
        ]);

        const allMovies: Movie[] = moviesRes.data;
        const showtimes: Showtime[] = showtimesRes.data;
        const promotions: Promotion[] = promotionsRes.data;
        const news: NewsType[] = newsRes.data;

        // 1. Get 5 Now Playing Movies
        const nowPlaying = filterNowPlayingMovies(allMovies, showtimes).slice(0, 5);
        const movieItems: CarouselItem[] = nowPlaying.map(movie => ({
            id: `movie-${movie.id}`,
            image: movie.backdrop || movie.image,
            link: `/home/movie/${movie.id}`,
            title: movie.title
        }));

        // 2. Get 5 Mixed Events/Promotions
        const mixedEvents: CarouselItem[] = [];
        const maxEvents = 5;
        let pIndex = 0;
        let nIndex = 0;

        while (mixedEvents.length < maxEvents && (pIndex < promotions.length || nIndex < news.length)) {
            if (pIndex < promotions.length) {
                const p = promotions[pIndex++];
                mixedEvents.push({
                    id: `promo-${p.id}`,
                    image: p.img && p.img.length > 0 ? p.img[0] : "", // Use first image
                    link: `/home/promotions/${p.id}`,
                    title: p.title
                });
            }
            if (mixedEvents.length >= maxEvents) break;
            
            if (nIndex < news.length) {
                const n = news[nIndex++];
                mixedEvents.push({
                    id: `news-${n.id}`,
                    image: n.img && n.img.length > 0 ? n.img[0] : "", // Use first image
                    link: `/home/news/${n.id}`,
                    title: n.title
                });
            }
        }

        setCarouselItems([...movieItems, ...mixedEvents]);

      } catch (error) {
        console.error("Failed to fetch carousel data:", error);
      }
    };
    
    if (location.pathname === "/home") {
        fetchData();
    }
  }, [location.pathname]);

  const handleLoginClick = () => {
    setLoginRedirectTo("/");
    setShowLogin(true);
    setShowRegister(false);
  };

  const handleRegisterClick = () => {
    setShowRegister(true);
    setShowLogin(false);
  };

  const handleSwitchToRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  const handleCloseModals = () => {
    setShowLogin(false);
    setShowRegister(false);
    setLoginRedirectTo("/");
  };

  useEffect(() => {
    const handler = () => {
      // gọi đúng hàm bạn đang dùng để mở login modal
      handleLoginClick();
    };

    window.addEventListener("open-login-modal", handler);
    return () => window.removeEventListener("open-login-modal", handler);
  }, []);

  // Scroll detection for sticky header
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
       setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className="home-body">
        <HomeHeader
          onLoginClick={handleLoginClick}
          onRegisterClick={handleRegisterClick}
          isScrolled={isScrolled}
        />
        {location.pathname === "/home" && (
          <BackdropCarousel items={carouselItems} />
        )}
        <div
          className={`${
            location.pathname.includes("/movie/") ||
            location.pathname === "/home/festival"
              ? "mt-0 w-100"
              : "home-container flex align-items-start"
          }`}
        >
          <Outlet />
        </div>
        <HomeFooter />

        {showLogin && (
          <LoginModal
            onClose={handleCloseModals}
            onSwitchToRegister={handleSwitchToRegister}
            redirectTo={loginRedirectTo}
          />
        )}

        {showRegister && (
          <RegisterModal
            onClose={handleCloseModals}
            onSwitchToLogin={handleSwitchToLogin}
          />
        )}
      </div>
      <CinemaChat />
    </>
  );
}

export default HomeLayout;
