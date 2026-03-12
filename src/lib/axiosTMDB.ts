import axios from "axios";

const axiosTMDB = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  timeout: 8000,
});

axiosTMDB.interceptors.request.use(
  (config) => {
    const token = import.meta.env.VITE_TMDB_V4_TOKEN as string | undefined;
    const apiKey = import.meta.env.VITE_TMDB_V3_KEY as string | undefined;

    config.headers = config.headers ?? {};
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers.accept = "application/json";
    config.headers["Content-Type"] = "application/json;charset=utf-8";

    if (apiKey) {
      config.params = {
        ...(config.params || {}),
        api_key: apiKey,
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosTMDB;
export { axiosTMDB };
