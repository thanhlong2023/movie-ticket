// src/services/tmdbService.ts
import axiosTMDB from "../lib/axiosTMDB";
import type {
  TMDBMovieDetailsResponse,
  TMDBMovieSummary,
  TMDBPaginatedResponse,
} from "../types";

export const getNowPlayingMovies = async (
  page = 1
): Promise<TMDBPaginatedResponse<TMDBMovieSummary>> => {
  const response = await axiosTMDB.get<TMDBPaginatedResponse<TMDBMovieSummary>>(
    "/movie/now_playing",
    {
      params: { page, language: "vi-VN" },
    }
  );
  return response.data;
};

export const getUpcomingMovies = async (
  page = 1
): Promise<TMDBPaginatedResponse<TMDBMovieSummary>> => {
  const response = await axiosTMDB.get<TMDBPaginatedResponse<TMDBMovieSummary>>(
    "/movie/upcoming",
    {
      params: { page, language: "vi-VN", region: "VN" },
    }
  );
  return response.data;
};

export const searchMovies = async (
  query: string,
  page = 1
): Promise<TMDBMovieSummary[]> => {
  const response = await axiosTMDB.get<TMDBPaginatedResponse<TMDBMovieSummary>>(
    "/search/movie",
    {
      params: { query, page, language: "vi-VN" },
    }
  );
  return response.data.results;
};

export const getMovieDetails = async (
  id: number
): Promise<TMDBMovieDetailsResponse> => {
  const response = await axiosTMDB.get<TMDBMovieDetailsResponse>(
    `/movie/${id}`,
    {
      params: {
        language: "vi-VN",
        append_to_response: "credits,videos",
      },
    }
  );
  return response.data;
};

export const getFullImageUrl = (path: string | null | undefined): string => {
  return path
    ? `https://image.tmdb.org/t/p/original${path}`
    : "https://via.placeholder.com/500x750?text=No+Image";
};

// Backwards compatibility if needed, or just remove if we update all consumers.
// I will update consumers, so no default export needed for the object.
