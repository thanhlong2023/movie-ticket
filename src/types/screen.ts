import type { Seat } from "./seat";

export interface Screen {
  id: number;
  name: string;
  theaterId: number;
  type: string; // "2D", "3D", "IMAX", etc.
  capacity: number;
  seats: Seat[];
  rows?: number;
  cols?: number;
}
