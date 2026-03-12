import type { User } from "./user";

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  password: string;
  phoneNumber: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}
