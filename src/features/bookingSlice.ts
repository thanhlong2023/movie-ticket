import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { showNotification } from "./notificationSlice";
import api from "../services/api";
import type { Booking } from "../types/booking";
import type { ApiError } from "../types/error";

interface BookingState {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
}

const initialState: BookingState = {
  bookings: [],
  loading: false,
  error: null,
};

export const fetchBookings = createAsyncThunk(
  "bookings/fetchBookings",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.get("/bookings");
      return response.data;
    } catch (error: unknown) {
      const err = error as ApiError;
      const message = err.response?.data?.message || "Failed to fetch bookings";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const deleteBooking = createAsyncThunk(
  "bookings/deleteBooking",
  async (id: number, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/bookings/${id}`);
      dispatch(
        showNotification({ message: "Xóa đặt vé thành công", type: "success" })
      );
      return id;
    } catch (error: unknown) {
      const err = error as ApiError;
      const message = err.response?.data?.message || "Failed to delete booking";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

const bookingSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchBookings.fulfilled,
        (state, action: PayloadAction<Booking[]>) => {
          state.loading = false;
          state.bookings = action.payload;
        }
      )
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(
        deleteBooking.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.bookings = state.bookings.filter(
            (booking) => booking.id !== action.payload
          );
        }
      );
  },
});

export default bookingSlice.reducer;
