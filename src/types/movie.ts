export interface Movie {
  id: number;
  title: string;
  video: string;
  country: string;
  duration: number;
  age_limit: string;
  image: string;
  tag: string[];
  format: string;
  author: string[];
  actor: string[];
  description: string;
  premiere: string;
  schedule: MovieSchedule[];
  status: "showing" | "upcoming" | "stopped";
  trailer?: string;
  trailerUrl?: string;
  backdrop?: string;
}

export interface MovieSchedule {
  date: string;
  sessions: Session[];
}

export interface Session {
  time: string;
  room: number;
  seatBooked: string[];
}
