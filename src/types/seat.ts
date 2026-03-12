export type SeatType = "standard" | "vip" | "couple";
export type SeatStatus = "active" | "maintenance" | "hidden" | "booked";

export interface Seat {
  id?: number;
  screenId: number;
  row: string;
  col: number; // Index in row
  code: string; // e.g. A1, A2
  type: SeatType;
  status: SeatStatus;
  priceModifier?: number;
  price?: number; // Optional for booking context
  number?: number; // legacy support if needed
}
