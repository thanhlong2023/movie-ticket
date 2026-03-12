import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { showNotification } from "./notificationSlice";
import { authService } from "../services/authService";
import type { User, LoginData, RegisterData } from "../types";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: authService.getCurrentUser(),
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginData, { dispatch, rejectWithValue }) => {
    try {
      const { user } = await authService.login(credentials);
      dispatch(
        showNotification({
          message: "Đăng nhập thành công",
          type: "success",
        })
      );
      return user;
    } catch (error: unknown) {
      if (error instanceof Error) {
        dispatch(
          showNotification({
            message: error.message,
            type: "danger",
          })
        );
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

export const register = createAsyncThunk(
  "auth/register",
  async (data: RegisterData, { dispatch, rejectWithValue }) => {
    try {
      const { user } = await authService.register(data);
      dispatch(
        showNotification({
          message: "Đăng ký thành công",
          type: "success",
        })
      );
      return user;
    } catch (error: unknown) {
      if (error instanceof Error) {
        dispatch(
          showNotification({
            message: error.message,
            type: "danger",
          })
        );
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

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      authService.logout();
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
