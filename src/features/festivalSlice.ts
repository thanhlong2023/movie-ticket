import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { showNotification } from "./notificationSlice";
import { getFestivals, getFestivalById } from "../services/festivalService";
import api from "../services/api";
import type { FestivalType } from "../types/festival";

interface FestivalState {
  festivals: FestivalType[];
  festival: FestivalType | null;
  loading: boolean;
  error: string | null;
}

const initialState: FestivalState = {
  festivals: [],
  festival: null,
  loading: false,
  error: null,
};

export const fetchFestivals = createAsyncThunk(
  "festivals/fetchFestivals",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const data = await getFestivals();
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        dispatch(showNotification({ message: error.message, type: "danger" }));
        return rejectWithValue(error.message);
      }
      dispatch(
        showNotification({
          message: "An unknown error occurred",
          type: "danger",
        })
      );
      return rejectWithValue("An unknown error occurred");
    }
  }
);

export const fetchFestivalById = createAsyncThunk(
  "festivals/fetchFestivalById",
  async (id: number, { dispatch, rejectWithValue }) => {
    try {
      const data = await getFestivalById(id);
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        dispatch(showNotification({ message: error.message, type: "danger" }));
        return rejectWithValue(error.message);
      }
      dispatch(
        showNotification({
          message: "An unknown error occurred",
          type: "danger",
        })
      );
      return rejectWithValue("An unknown error occurred");
    }
  }
);

export const createFestival = createAsyncThunk(
  "festivals/createFestival",
  async (data: Partial<FestivalType>, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post("/festivals", data);
      dispatch(
        showNotification({
          message: "Thêm sự kiện thành công",
          type: "success",
        })
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const message =
        err.response?.data?.message || "Failed to create festival";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const updateFestival = createAsyncThunk(
  "festivals/updateFestival",
  async (
    data: { id: number; data: Partial<FestivalType> },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await api.patch(`/festivals/${data.id}`, data.data);
      dispatch(
        showNotification({
          message: "Cập nhật sự kiện thành công",
          type: "success",
        })
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const message =
        err.response?.data?.message || "Failed to update festival";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const deleteFestival = createAsyncThunk(
  "festivals/deleteFestival",
  async (id: number, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/festivals/${id}`);
      dispatch(
        showNotification({ message: "Xóa sự kiện thành công", type: "success" })
      );
      return id;
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const message =
        err.response?.data?.message || "Failed to delete festival";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

const festivalSlice = createSlice({
  name: "festivals",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFestivals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFestivals.fulfilled, (state, action) => {
        state.loading = false;
        state.festivals = action.payload;
      })
      .addCase(fetchFestivals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchFestivalById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFestivalById.fulfilled, (state, action) => {
        state.loading = false;
        state.festival = action.payload;
      })
      .addCase(fetchFestivalById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createFestival.fulfilled, (state, action) => {
        state.festivals.push(action.payload);
      })
      .addCase(updateFestival.fulfilled, (state, action) => {
        const index = state.festivals.findIndex(
          (f) => f.id === action.payload.id
        );
        if (index !== -1) {
          state.festivals[index] = action.payload;
        }
      })
      .addCase(deleteFestival.fulfilled, (state, action) => {
        state.festivals = state.festivals.filter(
          (f) => f.id !== action.payload
        );
      });
  },
});

export default festivalSlice.reducer;
