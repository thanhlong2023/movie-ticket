import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen";
import HomePage from "../pages/home/HomePage/HomePage";
import MovieDetail from "../pages/home/MovieDetail/MovieDetail";
import CalendarPage from "../pages/home/Calendar/CalendarPage";
import NewsPage from "../pages/home/NewsPage/NewsPage";
import PaymentPage from "../pages/home/PaymentPage/PaymentPage";
import PaymentSuccessPage from "../pages/home/PaymentPage/PaymentSuccessPage";
import NewsDetailPage from "../pages/home/NewsPage/NewsDetailPage";
import PromotionsPage from "../pages/home/Promotions/PromotionsPage";
import FestivalPage from "../pages/home/Festival/FestivalPage";
import FestivalDetailPage from "../pages/home/Festival/FestivalDetailPage";
import PromotionDetailPage from "../pages/home/Promotions/PromotionDetailPage";
import TicketPricePage from "../pages/home/TicketPrice/TicketPricePage";
import ProtectedRoute from "./ProtectedRoute";
import Dashboard from "../pages/admin/Dashboard/Dashboard";
import MoviesAdmin from "../pages/admin/Movies/MoviesAdmin";
import MovieForm from "../pages/admin/Movies/MovieForm";
import ShowTimesAdmin from "../pages/admin/ShowTimes/ShowTimesAdmin";
import ShowtimeForm from "../pages/admin/ShowTimes/ShowTimeForm";
import BookingsAdmin from "../pages/admin/Bookings/BookingsAdmin";
import NewsAdmin from "../pages/admin/News/NewsAdmin";
import NewsForm from "../pages/admin/News/NewsForm";
import PromotionsForm from "../pages/admin/Promotions/PromotionsForm";
import UsersAdmin from "../pages/admin/Users/UsersAdmin";
import { TheatersAdmin } from "../pages/admin/Theaters/TheatersAdmin";
import AdminLayout from "../pages/admin/layout/AdminLayout";
import TheaterForm from "../pages/admin/Theaters/TheaterForm";
import { ScreensAdmin } from "../pages/admin/Theaters/Screens/ScreensAdmin";
import { ScreenForm } from "../pages/admin/Theaters/Screens/ScreenForm";
import BookingHistory from "../pages/home/Profile/BookingHistory";
import TicketDetail from "../pages/home/Profile/TicketDetail";
import FestivalAdmin from "../pages/admin/Festival/FestivalAdmin";
import FestivalForm from "../pages/admin/Festival/FestivalForm";
import PromotionsAdmin from "../pages/admin/Promotions/PromotionsAdmin";

const PageNotFound = lazy(() => import("../pages/notfound/PageNotFound"));
const HomeLayout = lazy(() => import("../pages/layout/HomeLayout"));
const ProfilePage = lazy(() => import("../pages/home/Profile/ProfilePage"));

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/home" replace /> },
  {
    path: "/home",
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <HomeLayout />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "movie/:id",
        element: <MovieDetail />,
      },
      {
        path: "calendar",
        element: <CalendarPage />,
      },
      {
        path: "news",
        element: <NewsPage />,
      },
      {
        path: "news/:id",
        element: <NewsDetailPage />,
      },
      {
        path: "payment",
        element: <PaymentPage />,
      },
      {
        path: "payment-success",
        element: <PaymentSuccessPage />,
      },
      {
        path: "promotions",
        element: <PromotionsPage />,
      },
      {
        path: "promotions/:id",
        element: <PromotionDetailPage />,
      },
      {
        path: "festival",
        element: <FestivalPage />,
      },
      {
        path: "festival/:id",
        element: <FestivalDetailPage />,
      },
      {
        path: "ticket-price",
        element: <TicketPricePage />,
      },
      {
        path: "my-tickets",
        element: <BookingHistory />,
      },
      {
        path: "profile",
        element: <ProfilePage />,
      },
      {
        path: "my-tickets/:id",
        element: <TicketDetail />,
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute requireAdmin={true}>
        <Suspense fallback={<LoadingScreen />}>
          <AdminLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "movies",
        element: <MoviesAdmin />,
      },
      {
        path: "movies/new",
        element: <MovieForm />,
      },
      {
        path: "movies/:id/edit",
        element: <MovieForm />,
      },
      {
        path: "show-times",
        element: <ShowTimesAdmin />,
      },
      {
        path: "show-times/new",
        element: <ShowtimeForm />,
      },
      {
        path: "show-times/:id/edit",
        element: <ShowtimeForm />,
      },
      {
        path: "bookings",
        element: <BookingsAdmin />,
      },
      {
        path: "news",
        element: <NewsAdmin />,
      },
      {
        path: "news/new",
        element: <NewsForm />,
      },
      {
        path: "news/:id/edit",
        element: <NewsForm />,
      },
      {
        path: "promotions",
        element: <PromotionsAdmin />,
      },
      {
        path: "promotions/new",
        element: <PromotionsForm />,
      },
      {
        path: "promotions/:id/edit",
        element: <PromotionsForm />,
      },
      {
        path: "festival",
        element: <FestivalAdmin />,
      },
      {
        path: "festival/new",
        element: <FestivalForm />,
      },
      {
        path: "festival/:id/edit",
        element: <FestivalForm />,
      },
      {
        path: "users",
        element: <UsersAdmin />,
      },
      {
        path: "theaters",
        element: <TheatersAdmin />,
      },
      {
        path: "theaters/new",
        element: <TheaterForm />,
      },
      {
        path: "theaters/:id/edit",
        element: <TheaterForm />,
      },
      {
        path: "theaters/:theaterId/screens",
        element: <ScreensAdmin />,
      },
      {
        path: "theaters/:theaterId/screens/new",
        element: <ScreenForm />,
      },
      {
        path: "theaters/:theaterId/screens/:screenId/edit",
        element: <ScreenForm />,
      },
    ],
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <PageNotFound />
      </Suspense>
    ),
  },
]);
