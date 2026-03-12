import type { FestivalType } from "../types";
import api from "./api";

export const getFestivals = async (): Promise<FestivalType[]> => {
  const response = await api.get("/festivals");
  return response.data;
};

export const getFestivalById = async (id: number): Promise<FestivalType> => {
  const response = await api.get(`/festivals/${id}`);
  return response.data;
};
