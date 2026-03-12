import axios from "axios";
import type { Movie } from "../types/movie";

// Using direct URL for now, could be moved to env or centralized config
const API_URL = "http://localhost:3001";

export const getMovies = async (): Promise<Movie[]> => {
  const response = await axios.get<Movie[]>(`${API_URL}/movies`);
  return response.data;
};

export const getMovieById = async (id: number): Promise<Movie> => {
  const response = await axios.get<Movie>(`${API_URL}/movies/${id}`);
  return response.data;
};
