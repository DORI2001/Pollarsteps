/**
 * Session management: token storage + auto-refresh scheduler.
 */
import { User } from "../types";
import { authApi } from "./auth";

let refreshTimeout: ReturnType<typeof setTimeout> | null = null;

const REFRESH_BEFORE_EXPIRY = 25 * 60 * 1000; // 25 min (access token TTL is 30 min)

const scheduleTokenRefresh = () => {
  if (refreshTimeout) clearTimeout(refreshTimeout);
  if (typeof window === "undefined") return;

  refreshTimeout = setTimeout(async () => {
    try {
      const refreshToken = session.getRefreshToken();
      if (refreshToken) {
        await authApi.refreshAccessToken(refreshToken);
        scheduleTokenRefresh();
      }
    } catch (err) {
      console.error("[API] Token auto-refresh failed:", err);
      session.logout();
    }
  }, REFRESH_BEFORE_EXPIRY);
};

export const session = {
  setTokens(accessToken: string, refreshToken: string): boolean {
    if (typeof window === "undefined") return false;
    try {
      localStorage.setItem("auth_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      document.cookie = `auth_token=${accessToken};path=/;max-age=2592000`;
      scheduleTokenRefresh();
      return true;
    } catch (err) {
      console.error("Failed to set tokens:", err);
      return false;
    }
  },

  setToken(token: string): boolean {
    if (typeof window === "undefined") return false;
    try {
      localStorage.setItem("auth_token", token);
      document.cookie = `auth_token=${token};path=/;max-age=2592000`;
      return true;
    } catch (err) {
      console.error("Failed to set token:", err);
      return false;
    }
  },

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem("auth_token");
    } catch (err) {
      console.error("Failed to get token:", err);
      return null;
    }
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem("refresh_token");
    } catch (err) {
      console.error("Failed to get refresh token:", err);
      return null;
    }
  },

  clearToken(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      document.cookie = "auth_token=;path=/;max-age=0";
      if (refreshTimeout) clearTimeout(refreshTimeout);
    } catch (err) {
      console.error("Failed to clear token:", err);
    }
  },

  setUser(user: User): boolean {
    if (typeof window === "undefined") return false;
    try {
      localStorage.setItem("user", JSON.stringify(user));
      return true;
    } catch (err) {
      console.error("Failed to set user:", err);
      return false;
    }
  },

  getUser(): User | null {
    if (typeof window === "undefined") return null;
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch (err) {
      console.error("Failed to get user:", err);
      return null;
    }
  },

  clearUser(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("user");
    } catch (err) {
      console.error("Failed to clear user:", err);
    }
  },

  logout(): void {
    this.clearToken();
    this.clearUser();
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
