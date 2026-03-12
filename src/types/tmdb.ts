// ===== Common =====
export interface TMDBPaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBProductionCompany {
  id: number;
  logo_path: string;
  name: string;
  origin_country: string;
}

export interface TMDBProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface TMDBSpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

// ===== Details: GET /movie/{movie_id} =====
export interface TMDBMovieDetailsResponse {
  adult: boolean;
  backdrop_path: string;
  belongs_to_collection: string; // docs ghi string
  budget: number;
  genres: TMDBGenre[];
  homepage: string;
  id: number;
  imdb_id: string;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;

  production_companies: TMDBProductionCompany[];
  production_countries: TMDBProductionCountry[];

  release_date: string;
  revenue: number;
  runtime: number;

  spoken_languages: TMDBSpokenLanguage[];

  status: string;
  tagline: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;

  // Appended responses
  credits?: TMDBMovieCreditsResponse;
  videos?: {
    results: TMDBMovieVideo[];
  };
}

// ===== Similar: GET /movie/{movie_id}/similar =====
export interface TMDBMovieSummary {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export type TMDBMovieSimilarResponse = TMDBPaginatedResponse<TMDBMovieSummary>;

// ===== Account states: GET /movie/{movie_id}/account_states =====
export interface TMDBMovieAccountStatesResponse {
  id: number;
  favorite: boolean;
  rated: {
    value: number;
  };
  watchlist: boolean;
}

// ===== Alternative titles: GET /movie/{movie_id}/alternative_titles =====
export interface TMDBMovieAlternativeTitle {
  iso_3166_1: string;
  title: string;
  type: string;
}

export interface TMDBMovieAlternativeTitlesResponse {
  id: number;
  titles: TMDBMovieAlternativeTitle[];
}

// ===== Changes: GET /movie/{movie_id}/changes =====
export interface TMDBMovieChangeItemValue {
  id: string;
  action: string;
  time: string;
  iso_639_1: string;
  iso_3166_1: string;
  value: Record<string, unknown>;
}

export interface TMDBMovieChangeItem {
  key: string;
  items: TMDBMovieChangeItemValue[];
}

export interface TMDBMovieChangesResponse {
  changes: TMDBMovieChangeItem[];
}

// ===== Credits: GET /movie/{movie_id}/credits =====
export interface TMDBMovieCast {
  adult: boolean;
  gender: number;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string;

  cast_id: number;
  character: string;
  credit_id: string;
  order: number;
}

export interface TMDBMovieCrew {
  adult: boolean;
  gender: number;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string;

  credit_id: string;
  department: string;
  job: string;
}

export interface TMDBMovieCreditsResponse {
  id: number;
  cast: TMDBMovieCast[];
  crew: TMDBMovieCrew[];
}

// ===== External IDs: GET /movie/{movie_id}/external_ids =====
export interface TMDBMovieExternalIdsResponse {
  id: number;
  imdb_id: string;
  wikidata_id: string;
  facebook_id: string;
  instagram_id: string;
  twitter_id: string;
}

// ===== Images: GET /movie/{movie_id}/images =====
export interface TMDBMediaImage {
  aspect_ratio: number;
  height: number;
  iso_639_1: string;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
}

export interface TMDBMovieImagesResponse {
  id: number;
  backdrops: TMDBMediaImage[];
  logos: TMDBMediaImage[];
  posters: TMDBMediaImage[];
}

// ===== Keywords: GET /movie/{movie_id}/keywords =====
export interface TMDBMovieKeyword {
  id: number;
  name: string;
}

export interface TMDBMovieKeywordsResponse {
  id: number;
  keywords: TMDBMovieKeyword[];
}

// ===== Latest: GET /movie/latest =====
export type TMDBLatestMovieResponse = TMDBMovieDetailsResponse;

// ===== Lists: GET /movie/{movie_id}/lists =====
export interface TMDBListSummary {
  description: string;
  favorite_count: number;
  id: number;
  item_count: number;
  iso_639_1: string;
  list_type: string;
  name: string;
  poster_path: string;
}

export interface TMDBMovieListsResponse
  extends TMDBPaginatedResponse<TMDBListSummary> {
  id: number;
}

// ===== Recommendations: GET /movie/{movie_id}/recommendations =====
export type TMDBMovieRecommendationsResponse =
  TMDBPaginatedResponse<TMDBMovieSummary>;

// ===== Release dates: GET /movie/{movie_id}/release_dates =====
export interface TMDBMovieReleaseDateItem {
  certification: string;
  descriptors: string[];
  iso_639_1: string;
  note: string;
  release_date: string;
  type: number;
}

export interface TMDBMovieReleaseDatesByCountry {
  iso_3166_1: string;
  release_dates: TMDBMovieReleaseDateItem[];
}

export interface TMDBMovieReleaseDatesResponse {
  id: number;
  results: TMDBMovieReleaseDatesByCountry[];
}

// ===== Reviews: GET /movie/{movie_id}/reviews =====
export interface TMDBReviewAuthorDetails {
  name: string;
  username: string;
  avatar_path: string;
  rating: string;
}

export interface TMDBMovieReview {
  author: string;
  author_details: TMDBReviewAuthorDetails;
  content: string;
  created_at: string;
  id: string;
  updated_at: string;
  url: string;
}

export interface TMDBMovieReviewsResponse
  extends TMDBPaginatedResponse<TMDBMovieReview> {
  id: number;
}

// ===== Translations: GET /movie/{movie_id}/translations =====
export interface TMDBMovieTranslationData {
  homepage: string;
  overview: string;
  runtime: number;
  tagline: string;
  title: string;
}

export interface TMDBMovieTranslation {
  iso_3166_1: string;
  iso_639_1: string;
  name: string;
  english_name: string;
  data: TMDBMovieTranslationData;
}

export interface TMDBMovieTranslationsResponse {
  id: number;
  translations: TMDBMovieTranslation[];
}

// ===== Videos: GET /movie/{movie_id}/videos =====
export interface TMDBMovieVideo {
  iso_639_1: string;
  iso_3166_1: string;
  name: string;
  key: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
  id: string;
}

export interface TMDBMovieVideosResponse {
  id: number;
  results: TMDBMovieVideo[];
}

// ===== Watch providers: GET /movie/{movie_id}/watch/providers =====
export interface TMDBWatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface TMDBWatchProviderRegion {
  link: string;
  flatrate: TMDBWatchProvider[];
  rent: TMDBWatchProvider[];
  buy: TMDBWatchProvider[];
}

export interface TMDBMovieWatchProvidersResponse {
  id: number;
  results: Record<string, TMDBWatchProviderRegion>;
}
