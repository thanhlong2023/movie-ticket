import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { showNotification } from "./notificationSlice";
import type { TheaterType, RegionType, TheaterInput } from "../types/theater";
import type { ApiError } from "../types/error";
import api from "../services/api";

interface TheatersState {
  theaters: TheaterType[];
  regions: RegionType[];
  loading: boolean;
  error: string | null;
}

const initialState: TheatersState = {
  theaters: [],
  regions: [],
  loading: false,
  error: null,
};

export const fetchTheaters = createAsyncThunk(
  "theaters/fetchAll",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.get<TheaterType[]>("/theaters");
      return res.data;
    } catch (error: unknown) {
      const err = error as ApiError;
      const message = err.response?.data?.message || "Failed to fetch theaters";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const fetchRegions = createAsyncThunk(
  "theaters/fetchRegions",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.get<RegionType[]>("/regions");
      return res.data;
    } catch (error: unknown) {
      const err = error as ApiError;
      const message = err.response?.data?.message || "Failed to fetch regions";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const createTheater = createAsyncThunk(
  "theaters/create",
  async (data: TheaterInput, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post<TheaterType>("/theaters", data);
      dispatch(
        showNotification({ message: "Thêm rạp thành công", type: "success" })
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as ApiError;
      const message = err.response?.data?.message || "Failed to create theater";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const updateTheater = createAsyncThunk(
  "theaters/update",
  async (data: TheaterType, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.put<TheaterType>(`/theaters/${data.id}`, data);
      dispatch(
        showNotification({
          message: "Cập nhật rạp thành công",
          type: "success",
        })
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as ApiError;
      const message = err.response?.data?.message || "Failed to update theater";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const deleteTheater = createAsyncThunk(
  "theaters/delete",
  async (data: TheaterType, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/theaters/${data.id}`);
      dispatch(
        showNotification({ message: "Xóa rạp thành công", type: "success" })
      );
      return data;
    } catch (error: unknown) {
      const err = error as ApiError;
      const message = err.response?.data?.message || "Failed to delete theater";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

const theatersSlice = createSlice({
  name: "theaters",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Theaters
      .addCase(fetchTheaters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchTheaters.fulfilled,
        (state, action: PayloadAction<TheaterType[]>) => {
          state.loading = false;
          state.theaters = action.payload;
        }
      )
      .addCase(fetchTheaters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Regions
      .addCase(
        fetchRegions.fulfilled,
        (state, action: PayloadAction<RegionType[]>) => {
          state.regions = action.payload;
        }
      )
      // Create
      .addCase(
        createTheater.fulfilled,
        (state, action: PayloadAction<TheaterType>) => {
          state.loading = false;
          state.theaters.push(action.payload);
        }
      )
      // Update
      .addCase(
        updateTheater.fulfilled,
        (state, action: PayloadAction<TheaterType>) => {
          state.loading = false;
          state.theaters = state.theaters.map((c) =>
            c.id === action.payload.id ? action.payload : c
          );
        }
      )
      // Delete
      .addCase(
        deleteTheater.fulfilled,
        (state, action: PayloadAction<TheaterType>) => {
          state.loading = false;
          state.theaters = state.theaters.filter(
            (s) => s.id !== action.payload.id
          );
        }
      );
  },
});

export const theatersReducer = theatersSlice.reducer;
