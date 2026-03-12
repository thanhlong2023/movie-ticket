import type { TheaterType } from "../types/theater";
import api from "./api";

export const theatersServices = {
  async getAll(): Promise<TheaterType[]> {
    try {
      const res = await api.get<TheaterType[]>("/theaters");
      return res.data;
    } catch {
      throw new Error("Không thể lấy toàn bộ rạp phim!");
    }
  },

  async create(data: TheaterType): Promise<TheaterType> {
    try {
      const res = await api.post<TheaterType>("/theaters", data);
      return res.data;
    } catch {
      throw new Error("Không thể tạo rạp phim!");
    }
  },

  async update(data: Partial<TheaterType>): Promise<TheaterType> {
    try {
      const res = await api.put<TheaterType>(`/theaters/${data.id}`, data);
      return res.data;
    } catch {
      throw new Error("Không thể sửa rạp phim!");
    }
  },

  async remove(data: Partial<TheaterType>): Promise<TheaterType> {
    try {
      const res = await api.delete(`/theaters/${data.id}`);
      return res.data;
    } catch {
      throw new Error("Không thể xóa rạp phim!");
    }
  },
};
