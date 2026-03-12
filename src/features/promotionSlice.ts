import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { showNotification } from "./notificationSlice";
import api from "../services/api";
import type { Promotion } from "../types";

interface PromotionState {
  promotions: Promotion[];
  promotion: Promotion | null;
  loading: boolean;
  error: string | null;
}

const initialState: PromotionState = {
  promotions: [],
  promotion: null,
  loading: false,
  error: null,
};

export const fetchPromotions = createAsyncThunk(
  "promotions/fetchPromotions",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.get("/promotions");
      return response.data;
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const message = err.response?.data?.message || "Failed to fetch promotions";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const fetchPromotionById = createAsyncThunk(
  "promotions/fetchPromotionById",
  async (id: number, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.get(`/promotions/${id}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const message = err.response?.data?.message || "Failed to fetch promotion details";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const deletePromotion = createAsyncThunk(
  "promotions/deletePromotion",
  async (id: number, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/promotions/${id}`);
      dispatch(showNotification({ message: "Xóa khuyến mãi thành công", type: "success" }));
      return id;
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const message = err.response?.data?.message || "Failed to delete promotion";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const createPromotion = createAsyncThunk(
  "promotions/createPromotion",
  async (data: Partial<Promotion>, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post("/promotions", data);
      dispatch(showNotification({ message: "Thêm khuyến mãi thành công", type: "success" }));
      return response.data;
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const message = err.response?.data?.message || "Failed to create promotion";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const updatePromotion = createAsyncThunk(
  "promotions/updatePromotion",
  async (data: { id: number; data: Partial<Promotion> }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.patch(`/promotions/${data.id}`, data.data);
      dispatch(showNotification({ message: "Cập nhật khuyến mãi thành công", type: "success" }));
      return response.data;
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const message = err.response?.data?.message || "Failed to update promotion";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

const promotionSlice = createSlice({
  name: "promotions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPromotions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPromotions.fulfilled, (state, action: PayloadAction<Promotion[]>) => {
        state.loading = false;
        state.promotions = action.payload;
      })
      .addCase(fetchPromotions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPromotionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPromotionById.fulfilled, (state, action: PayloadAction<Promotion>) => {
        state.loading = false;
        state.promotion = action.payload;
      })
      .addCase(fetchPromotionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deletePromotion.fulfilled, (state, action: PayloadAction<number>) => {
        state.promotions = state.promotions.filter((item) => item.id !== action.payload);
      });
  },
});

export default promotionSlice.reducer;
