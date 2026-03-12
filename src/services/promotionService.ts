import type { Promotion } from "../types";
import api from "./api";

export const getPromotions = async (): Promise<Promotion[]> => {
  const response = await api.get("/promotions");
  return response.data;
};

export const getPromotionById = async (id: number): Promise<Promotion> => {
  const response = await api.get(`/promotions/${id}`);
  return response.data;
};
