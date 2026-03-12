import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { showNotification } from "./notificationSlice";
import api from "../services/api";
import type { User } from "../types";
import type { ApiError } from "../types/error";

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.get("/users");
      // Normalize data if necessary, assuming response.data is User[]
      return response.data;
    } catch (error: unknown) {
      const err = error as ApiError;
      const message = err.response?.data?.message || "Failed to fetch users";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (id: number, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/users/${id}`);
      dispatch(
        showNotification({
          message: "Xóa người dùng thành công",
          type: "success",
        })
      );
      return id;
    } catch (error: unknown) {
      const err = error as ApiError;
      const message = err.response?.data?.message || "Failed to delete user";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

import { authService } from "../services/authService";
import { logout } from "./authSlice";

export const lockUser = createAsyncThunk(
  "users/lockUser",
  async (
    { id, status }: { id: number; status: boolean },
    { dispatch, rejectWithValue }
  ) => {
    try {
      await api.patch(`/users/${id}`, { status });

      // If we locked the currently logged-in user, force logout locally
      const current = authService.getCurrentUser();
      if (current && current.id === id && status === false) {
        dispatch(logout());
        dispatch(
          showNotification({
            message: "Tài khoản đã bị khoá và bạn đã bị đăng xuất.",
            type: "warning",
          })
        );
      } else {
        dispatch(
          showNotification({
            message: status ? "Mở khóa người dùng thành công" : "Khóa người dùng thành công",
            type: "success",
          })
        );
      }

      return { id, status };
    } catch (error: unknown) {
      const err = error as ApiError;
      const message = err.response?.data?.message || "Failed to update user status";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const updateUserRole = createAsyncThunk(
  "users/updateUserRole",
  async (
    { id, role }: { id: number; role: "admin" | "user" },
    { dispatch, rejectWithValue }
  ) => {
    try {
      await api.patch(`/users/${id}`, { role });
      dispatch(
        showNotification({
          message: "Cập nhật quyền người dùng thành công",
          type: "success",
        })
      );
      return { id, role };
    } catch (error: unknown) {
      const err = error as ApiError;
      const message =
        err.response?.data?.message || "Failed to update user role";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete User
      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<number>) => {
        state.users = state.users.filter((user) => user.id !== action.payload);
      })
      // Lock / Unlock User
      .addCase(
        lockUser.fulfilled,
        (state, action: PayloadAction<{ id: number; status: boolean }>) => {
          state.users = state.users.map((user) =>
            user.id === action.payload.id
              ? { ...user, status: action.payload.status }
              : user
          );
        }
      )
      // Update User Role
      .addCase(
        updateUserRole.fulfilled,
        (
          state,
          action: PayloadAction<{ id: number; role: "admin" | "user" }>
        ) => {
          state.users = state.users.map((user) =>
            user.id === action.payload.id
              ? { ...user, role: action.payload.role }
              : user
          );
        }
      );
  },
});

export default usersSlice.reducer;
