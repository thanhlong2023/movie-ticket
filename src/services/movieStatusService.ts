/**
 * Movie Status Service
 * Tự động xác định trạng thái phim dựa trên suất chiếu thực tế
 */

import type { Movie, Showtime } from '../types';

export type MovieStatus = 'now_playing' | 'coming_soon';

/**
 * Kiểm tra phim có suất chiếu trong tương lai không
 */
export const hasUpcomingShowtimes = (movieId: number, showtimes: Showtime[]): boolean => {
  const now = new Date();
  return showtimes.some(
    (st) => st.movieId === movieId && new Date(st.startTime) > now
  );
};

/**
 * Kiểm tra phim có bất kỳ suất chiếu nào không (bao gồm cả quá khứ)
 */
export const hasAnyShowtimes = (movieId: number, showtimes: Showtime[]): boolean => {
  return showtimes.some((st) => st.movieId === movieId);
};

/**
 * Lấy trạng thái của phim
 * - now_playing: Có suất chiếu TRONG TƯƠNG LAI (chưa diễn ra)
 * - coming_soon: Không có suất chiếu trong tương lai
 */
export const getMovieStatus = (movie: Movie, showtimes: Showtime[]): MovieStatus => {
  // Phim có suất chiếu trong tương lai = Đang chiếu
  if (hasUpcomingShowtimes(movie.id, showtimes)) {
    return 'now_playing';
  }
  
  // Không có suất chiếu trong tương lai = Sắp chiếu
  return 'coming_soon';
};

/**
 * Lọc danh sách phim đang chiếu
 * Phim đang chiếu = có ít nhất 1 suất chiếu trong tương lai
 */
export const filterNowPlayingMovies = (movies: Movie[], showtimes: Showtime[]): Movie[] => {
  return movies.filter((movie) => getMovieStatus(movie, showtimes) === 'now_playing');
};

/**
 * Lọc danh sách phim sắp chiếu
 */
export const filterComingSoonMovies = (movies: Movie[], showtimes: Showtime[]): Movie[] => {
  return movies.filter((movie) => getMovieStatus(movie, showtimes) === 'coming_soon');
};

/**
 * Lấy các suất chiếu của một phim trong một ngày cụ thể
 * CHỈ TRẢ VỀ CÁC SUẤT CHIẾU TRONG TƯƠNG LAI
 */
export const getShowtimesForMovieOnDate = (
  movieId: number,
  date: Date,
  showtimes: Showtime[]
): Showtime[] => {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const now = new Date();
  
  return showtimes.filter((st) => {
    if (st.movieId !== movieId) return false;
    const stDate = st.startTime.split('T')[0];
    const stTime = new Date(st.startTime);
    // Chỉ trả về suất chiếu: đúng ngày VÀ chưa bắt đầu
    return stDate === dateStr && stTime > now;
  });
};

/**
 * Lấy tất cả phim có suất chiếu trong một ngày cụ thể
 * CHỈ TÍNH CÁC SUẤT CHIẾU TRONG TƯƠNG LAI
 */
export const getMoviesWithShowtimesOnDate = (
  movies: Movie[],
  date: Date,
  showtimes: Showtime[]
): Movie[] => {
  const dateStr = date.toISOString().split('T')[0];
  const now = new Date();
  
  // Lấy các movieId có suất chiếu TRONG TƯƠNG LAI trong ngày này
  const movieIdsWithShowtimes = new Set(
    showtimes
      .filter((st) => {
        const stDate = st.startTime.split('T')[0];
        const stTime = new Date(st.startTime);
        // Chỉ tính suất chiếu: đúng ngày VÀ chưa bắt đầu
        return stDate === dateStr && stTime > now;
      })
      .map((st) => st.movieId)
  );
  
  return movies.filter((movie) => movieIdsWithShowtimes.has(movie.id));
};
