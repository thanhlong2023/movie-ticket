import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { showNotification } from "./notificationSlice";
import api from "../services/api";

import type { Screen, Seat, ApiError } from "../types";

interface ScreenState {
  screens: Screen[];
  loading: boolean;
  error: string | null;
}

const initialState: ScreenState = {
  screens: [],
  loading: false,
  error: null,
};

export const fetchScreens = createAsyncThunk(
  "screens/fetchScreens",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.get("/screens");
      return response.data;
    } catch (error: unknown) {
      const err = error as ApiError;
      const message = err.response?.data?.message || "Failed to fetch screens";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const createScreen = createAsyncThunk(
  "screens/createScreen",
  async (
    data: Partial<Screen> & { seats?: Seat[] },
    { dispatch, rejectWithValue }
  ) => {
    try {
      // 1. Separate screen data and seats
      const { seats, ...screenData } = data;

      // 2. Create the screen first
      const response = await api.post("/screens", screenData);
      const newScreen = response.data;

      // 3. If there are seats, create them linked to the new screen
      if (seats && seats.length > 0) {
        const seatPromises = seats.map((seat) =>
          api.post("/seats", { ...seat, screenId: newScreen.id })
        );
        await Promise.all(seatPromises);
      }

      dispatch(
        showNotification({
          message: "Thêm phòng chiếu thành công",
          type: "success",
        })
      );
      return newScreen;
    } catch (error: unknown) {
      const err = error as ApiError;
      const message = err.response?.data?.message || "Failed to create screen";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

export const updateScreen = createAsyncThunk(
  "screens/updateScreen",
  async (
    data: { id: number; data: Partial<Screen> & { seats?: Seat[] } },
    { dispatch, rejectWithValue }
  ) => {
    try {
      // 1. Separate screen data from seats
      const { seats: newSeats, ...screenData } = data.data;

      // 2. Update screen details
      const response = await api.patch(`/screens/${data.id}`, screenData);

      // 3. Handle Seat Synchronization if seats are provided
      if (newSeats) {
        // Fetch existing seats to calculate diff
        const existingSeatsRes = await api.get(`/seats?screenId=${data.id}`);
        const existingSeats = existingSeatsRes.data;

        const seatsToDelete = [];
        const seatsToUpdate = [];
        const seatsToCreate = [];

        // Set of IDs in the new payload (for quick lookup)
        const newSeatIds = new Set(
          newSeats.map((s) => s.id).filter((id) => id)
        );

        // Identify deletions: Exists in DB but not in Payload
        for (const existing of existingSeats) {
          if (!newSeatIds.has(existing.id)) {
            seatsToDelete.push(existing.id);
          }
        }

        // Identify Updates and Creates
        for (const seat of newSeats) {
          if (seat.id) {
            // Check if it really changed? For now, just update to be safe/simple
            seatsToUpdate.push(seat);
          } else {
            // No ID = New Seat
            seatsToCreate.push({ ...seat, screenId: data.id });
          }
        }

        // Execute Batch Operations
        const deletePromises = seatsToDelete.map((id) =>
          api.delete(`/seats/${id}`)
        );
        const createPromises = seatsToCreate.map((s) => api.post("/seats", s));
        const updatePromises = seatsToUpdate.map((s) =>
          api.patch(`/seats/${s.id}`, s)
        );

        await Promise.all([
          ...deletePromises,
          ...createPromises,
          ...updatePromises,
        ]);
      }

      dispatch(
        showNotification({
          message: "Cập nhật phòng chiếu thành công",
          type: "success",
        })
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const message = err.response?.data?.message || "Failed to update screen";
      dispatch(showNotification({ message, type: "danger" }));
      return rejectWithValue(message);
    }
  }
);

const screenSlice = createSlice({
  name: "screens",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchScreens.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchScreens.fulfilled,
        (state, action: PayloadAction<Screen[]>) => {
          state.loading = false;
          state.screens = action.payload;
        }
      )
      .addCase(fetchScreens.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default screenSlice.reducer;
