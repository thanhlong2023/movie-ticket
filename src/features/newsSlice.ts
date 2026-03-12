import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { showNotification } from "./notificationSlice";
import api from "../services/api";
import type { NewsType } from "../types";

interface NewsState {
  news: NewsType[];
  newsItem: NewsType | null;
  loading: boolean;
  error: string | null;
}

const initialState: NewsState = {
  news: [],
  newsItem: null,
  loading: false,
  error: null,
};

export const fetchNews = createAsyncThunk(
  "news/fetchNews",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.get("/news");
      return response.data;
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const message = err.response?.data?.message || "Failed to fetch news";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const fetchNewsById = createAsyncThunk(
  "news/fetchNewsById",
  async (id: number, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.get(`/news/${id}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const message = err.response?.data?.message || "Failed to fetch news details";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const deleteNews = createAsyncThunk(
  "news/deleteNews",
  async (id: number, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/news/${id}`);
      dispatch(showNotification({ message: "Xóa tin tức thành công", type: "success" }));
      return id;
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const message = err.response?.data?.message || "Failed to delete news";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const createNews = createAsyncThunk(
  "news/createNews",
  async (data: Partial<NewsType>, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post("/news", data);
      dispatch(showNotification({ message: "Thêm tin tức thành công", type: "success" }));
      return response.data;
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const message = err.response?.data?.message || "Failed to create news";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const updateNews = createAsyncThunk(
  "news/updateNews",
  async (data: { id: number; data: Partial<NewsType> }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.patch(`/news/${data.id}`, data.data);
      dispatch(showNotification({ message: "Cập nhật tin tức thành công", type: "success" }));
      return response.data;
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const message = err.response?.data?.message || "Failed to update news";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

const newsSlice = createSlice({
  name: "news",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNews.fulfilled, (state, action: PayloadAction<NewsType[]>) => {
        state.loading = false;
        state.news = action.payload;
      })
      .addCase(fetchNews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchNewsById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNewsById.fulfilled, (state, action: PayloadAction<NewsType>) => {
        state.loading = false;
        state.newsItem = action.payload;
      })
      .addCase(fetchNewsById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteNews.fulfilled, (state, action: PayloadAction<number>) => {
        state.news = state.news.filter((item) => item.id !== action.payload);
      });
  },
});

export default newsSlice.reducer;
