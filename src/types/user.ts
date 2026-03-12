export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  name: string; // Full name combined
  role: "admin" | "user";
  phone?: string;
  phoneNumber?: string;
  createdAt?: string;

  avatar?: string;
  birthDate?: string;
  gender?: "male" | "female" | "other";
  address?: string;

  status?: boolean;
}