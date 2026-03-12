import api from "./api";
import type { AuthResponse, LoginData, RegisterData, User } from "../types";

export const authService = {
  // Login
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post("/login", data);
    const { accessToken, user } = response.data;

    // Prevent login for locked users
    if (user && user.status === false) {
      throw new Error("Tài khoản của bạn đã bị khoá. Vui lòng liên hệ quản trị.");
    }

    // Store token, user, and expiration (30 minutes)
    const expiresAt = Date.now() + 30 * 60 * 1000;
    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("tokenExpiry", expiresAt.toString());

    return { token: accessToken, user };
  },

  // Check if username exists
  async checkUserNameExists(userName: string): Promise<boolean> {
    try {
      const response = await api.get(
        `/check-username?userName=${encodeURIComponent(userName)}`
      );
      return response.data.exists;
    } catch (error) {
      console.error("Error checking username:", error);
      return false; // Default to not exists if check fails
    }
  },

  // Check if email exists
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const response = await api.get(
        `/check-email?email=${encodeURIComponent(email)}`
      );
      return response.data.exists;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  },

  // Register
  async register(data: RegisterData): Promise<AuthResponse> {
    const fullName = `${data.firstName} ${data.lastName}`.trim();

    // Check unique email
    const emailExists = await this.checkEmailExists(data.email);
    if (emailExists) {
      throw {
        response: { data: "Email đã tồn tại. Vui lòng sử dụng email khác." },
      };
    }

    // Check unique username only
    const exists = await this.checkUserNameExists(data.userName);
    if (exists) {
      throw {
        response: { data: "Tên tài khoản đã tồn tại. Vui lòng chọn tên khác." },
      };
    }

    const userData = {
      ...data,
      name: fullName, // Combine for backward compatibility
      phone: data.phoneNumber,
      role: "user", // Default role
      createdAt: new Date().toISOString(),
      status: true,
    };

    const response = await api.post("/register", userData);
    const { accessToken, user } = response.data;

    // Store token, user, and expiration (30 minutes)
    const expiresAt = Date.now() + 30 * 60 * 1000;
    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("tokenExpiry", expiresAt.toString());

    return { token: accessToken, user };
  },

  // Update Profile
  async updateProfile(id: number, data: Partial<User>): Promise<User> {
    const response = await api.patch(`/users/${id}`, data);
    const updatedUser = response.data;

    // Update localStorage
    localStorage.setItem("user", JSON.stringify(updatedUser));
    return updatedUser;
  },

  // Logout
  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tokenExpiry");
  },

  // Get current user from localStorage
  getCurrentUser(): User | null {
    if (!this.isAuthenticated()) {
      return null;
    }
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem("token");
    const expiry = localStorage.getItem("tokenExpiry");

    if (!token || !expiry) {
      return false;
    }

    if (Date.now() > parseInt(expiry)) {
      this.logout();
      return false;
    }

    return true;
  },

  // Check if user is admin
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === "admin";
  },
};
