import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/authSlice";
import movieReducer from "../features/movieSlice";
import newsReducer from "../features/newsSlice";
import promotionReducer from "../features/promotionSlice";
import festivalReducer from "../features/festivalSlice";
import { notificationReducer } from "../features/notificationSlice"; // Import notification slice
import { theatersReducer } from "../features/theatersSlice";
import usersReducer from "../features/usersSlice";
import bookingReducer from "../features/bookingSlice";
import showtimeReducer from "../features/showtimeSlice";
import screenReducer from "../features/screenSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    movies: movieReducer,
    news: newsReducer,
    promotions: promotionReducer,
    festivals: festivalReducer,
    notifications: notificationReducer, // Add notification reducer
    theaters: theatersReducer,
    users: usersReducer,
    bookings: bookingReducer,
    showtimes: showtimeReducer,
    screens: screenReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
