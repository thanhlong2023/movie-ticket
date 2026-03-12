export interface Showtime {
  id: number;
  movieId: number;
  screenId: number;
  theaterId: number;
  startTime: string;
  endTime: string;
  price: number;
  priceVip?: number;
  priceCouple?: number;
  userId?: number;
}
