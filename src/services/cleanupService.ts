import api from "./api";
import type { Showtime } from "../types";

export const cleanupOldShowtimes = async () => {
  try {
    const response = await api.get("/showtimes");
    const showtimes = response.data;
    const now = new Date();
    // 1 day ago
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const oldShowtimes = showtimes.filter((st: Showtime) => {
      const endTime = new Date(st.endTime);
      return endTime < oneDayAgo;
    });

    if (oldShowtimes.length > 0) {
      console.log(`Found ${oldShowtimes.length} old showtimes. Deleting...`);
      // Delete sequentially to avoid overwhelming JSON server
      for (const st of oldShowtimes) {
        await api.delete(`/showtimes/${st.id}`);
      }
      console.log("Cleanup complete.");
    }
  } catch (error) {
    console.error("Error cleaning up showtimes:", error);
  }
};
