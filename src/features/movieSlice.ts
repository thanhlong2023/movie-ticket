import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { showNotification } from "./notificationSlice";
import { getMovies, getMovieById } from "../services/movieService";
import api from "../services/api";
import type { Movie } from "../types";

interface MovieState {
  movies: Movie[];
  movie: Movie | null;
  loading: boolean;
  error: string | null;
}

const initialState: MovieState = {
  movies: [],
  movie: null,
  loading: false,
  error: null,
};

export const fetchMovies = createAsyncThunk(
  "movies/fetchMovies",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const data = await getMovies();
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        dispatch(showNotification({ message: error.message, type: "danger" }));
        return rejectWithValue(error.message);
      }
      dispatch(showNotification({ message: "An unknown error occurred", type: "danger" }));
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const fetchMovieById = createAsyncThunk(
  "movies/fetchMovieById",
  async (id: number, { dispatch, rejectWithValue }) => {
    try {
      const data = await getMovieById(id);
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        dispatch(showNotification({ message: error.message, type: "danger" }));
        return rejectWithValue(error.message);
      }
      dispatch(showNotification({ message: "An unknown error occurred", type: "danger" }));
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const deleteMovie = createAsyncThunk(
  "movies/deleteMovie",
  async (id: number, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/movies/${id}`);
      dispatch(showNotification({ message: "Xóa phim thành công", type: "success" }));
      return id;
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const message = err.response?.data?.message || "Failed to delete movie";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const createMovie = createAsyncThunk(
  "movies/createMovie",
  async (data: Partial<Movie>, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post("/movies", data);
      dispatch(showNotification({ message: "Thêm phim thành công", type: "success" }));
      return response.data;
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const message = err.response?.data?.message || "Failed to create movie";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const updateMovie = createAsyncThunk(
  "movies/updateMovie",
  async (data: { id: number; data: Partial<Movie> }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.patch(`/movies/${data.id}`, data.data);
      dispatch(showNotification({ message: "Cập nhật phim thành công", type: "success" }));
      return response.data;
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const message = err.response?.data?.message || "Failed to update movie";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

const movieSlice = createSlice({
  name: "movies",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMovies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMovies.fulfilled, (state, action) => {
        state.loading = false;
        state.movies = action.payload;
      })
      .addCase(fetchMovies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMovieById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMovieById.fulfilled, (state, action) => {
        state.loading = false;
        state.movie = action.payload;
      })
      .addCase(fetchMovieById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteMovie.fulfilled, (state, action) => {
        state.movies = state.movies.filter((movie) => movie.id !== action.payload);
      });
  },
});

export default movieSlice.reducer;
