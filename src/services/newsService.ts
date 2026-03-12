import type { News } from '../types';
import api from './api';


export const getNews = async (): Promise<News[]> => {
  const response = await api.get('/news');
  return response.data;
};

export const getNewsById = async (id: number): Promise<News> => {
  const response = await api.get(`/news/${id}`);
  return response.data;
};
