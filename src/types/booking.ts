import type { User } from "./user";
import type { Movie } from "./movie";

export interface BookingInfo {
  movieId: number;
  movieTitle: string;
  date: string;
  time: string;
  room: number;
  seats: string[];
  totalPrice: number;
}

export interface Booking {
  id: number;
  userId: number;
  showtimeId: number;
  movieId?: number;
  seats: string[];
  date: string;
  time: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  theater?: string;
  room?: string;
  // Enriched fields (populated when joined with other entities)
  user?: User;
  movie?: Movie;
  theaterName?: string;
  roomName?: string;
  totalSeat?: number;
  showtime?: {
    movieId: number;
    screenId?: number;
    startTime?: string;
  };
}
