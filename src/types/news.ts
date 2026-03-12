export interface NewsType {
  id: number;
  title: string;
  date: string;
  description: string;
  img: string[];
}

// Backward-compatible alias: some parts of the app import `News`.
export type News = NewsType;
