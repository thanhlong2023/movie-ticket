import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { showNotification } from "./notificationSlice";
import api from "../services/api";
import type { Showtime } from "../types";

interface ShowtimeState {
  showtimes: Showtime[];
  loading: boolean;
  error: string | null;
}

const initialState: ShowtimeState = {
  showtimes: [],
  loading: false,
  error: null,
};

export const fetchShowtimes = createAsyncThunk(
  "showtimes/fetchShowtimes",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.get("/showtimes");
      return response.data;
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const message = err.response?.data?.message || "Failed to fetch showtimes";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const deleteShowtime = createAsyncThunk(
  "showtimes/deleteShowtime",
  async (id: number, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/showtimes/${id}`);
      dispatch(showNotification({ message: "Xóa lịch chiếu thành công", type: "success" }));
      return id;
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const message = err.response?.data?.message || "Failed to delete showtime";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const createShowtime = createAsyncThunk(
  "showtimes/createShowtime",
  async (data: Partial<Showtime>, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post("/showtimes", data);
      dispatch(showNotification({ message: "Thêm lịch chiếu thành công", type: "success" }));
      return response.data;
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const message = err.response?.data?.message || "Failed to create showtime";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const updateShowtime = createAsyncThunk(
  "showtimes/updateShowtime",
  async (data: { id: number; data: Partial<Showtime> }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.patch(`/showtimes/${data.id}`, data.data);
      dispatch(showNotification({ message: "Cập nhật lịch chiếu thành công", type: "success" }));
      return response.data;
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const message = err.response?.data?.message || "Failed to update showtime";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

const showtimeSlice = createSlice({
  name: "showtimes",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchShowtimes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShowtimes.fulfilled, (state, action: PayloadAction<Showtime[]>) => {
        state.loading = false;
        state.showtimes = action.payload;
      })
      .addCase(fetchShowtimes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteShowtime.fulfilled, (state, action) => {
        state.showtimes = state.showtimes.filter((showtime) => showtime.id !== action.payload);
      });
  },
});

export default showtimeSlice.reducer