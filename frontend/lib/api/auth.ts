/**
 * Auth endpoints: register, login, refresh, current user, change password.
 */
import { User } from "../types";
import {
  AUTH_TIMEOUT,
  TokenPair,
  createApiError,
  request,
} from "./client";
import {
  validateEmail,
  validatePassword,
  passwordRequirementsMessage,
} from "./validation";

export const authApi = {
  async register(email: string, password: string, name?: string): Promise<TokenPair> {
    if (!email || !validateEmail(email)) {
      throw createApiError("Invalid email format", 400, "INVALID_EMAIL");
    }
    if (!validatePassword(password)) {
      throw createApiError(passwordRequirementsMessage(), 400, "INVALID_PASSWORD");
    }

    const data = await request<TokenPair>({
      method: "POST",
      path: "/auth/register",
      body: { email, password, username: name || email.split("@")[0] },
      timeout: AUTH_TIMEOUT,
      errorPrefix: "REGISTER",
      fallbackMessage: "Registration failed",
    });
    if (!data?.access_token) throw new Error("Invalid token response");
    return data;
  },

  async login(emailOrUsername: string, password: string): Promise<TokenPair> {
    if (!emailOrUsername) {
      throw createApiError("Email or username required", 400, "MISSING_LOGIN");
    }
    if (!password) {
      throw createApiError("Password required", 400, "MISSING_PASSWORD");
    }

    const data = await request<TokenPair>({
      method: "POST",
      path: "/auth/login",
      body: { email_or_username: emailOrUsername, password },
      timeout: AUTH_TIMEOUT,
      errorPrefix: "LOGIN",
      errorMap: { 401: "INVALID_CREDENTIALS" },
      fallbackMessage: "Login failed",
    });
    if (!data?.access_token) throw new Error("Invalid token response");
    return data;
  },

  async getCurrentUser(token: string): Promise<User> {
    if (!token) throw createApiError("Token required", 401, "MISSING_TOKEN");

    const data = await request<User>({
      method: "GET",
      path: "/auth/me",
      auth: token,
      timeout: AUTH_TIMEOUT,
      errorPrefix: "FETCH_USER",
      errorMap: { 401: "UNAUTHORIZED", 404: "USER_NOT_FOUND" },
      fallbackMessage: "Failed to fetch user",
    });
    if (!data?.id) throw new Error("Invalid user response");
    return data;
  },

  async changePassword(
    token: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    if (!token) throw createApiError("Token required", 401, "MISSING_TOKEN");
    if (!validatePassword(newPassword)) {
      throw createApiError(passwordRequirementsMessage(), 400, "INVALID_PASSWORD");
    }
    await request<void>({
      method: "PATCH",
      path: "/auth/me/password",
      auth: token,
      body: { current_password: currentPassword, new_password: newPassword },
      errorPrefix: "CHANGE_PASSWORD",
      fallbackMessage: "Failed to change password",
    });
  },

  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    if (!refreshToken) {
      throw createApiError("No refresh token available", 401, "NO_REFRESH_TOKEN");
    }

    const { session } = await import("./session");

    let data: TokenPair;
    try {
      data = await request<TokenPair>({
        method: "POST",
        path: "/auth/refresh",
        body: { refresh_token: refreshToken },
        errorPrefix: "REFRESH",
        skipUnauthorizedLogout: true,
        fallbackMessage: "Token refresh failed",
      });
    } catch (err) {
      session.logout();
      throw err;
    }

    if (!data?.access_token) throw new Error("Invalid token response");
    session.setTokens(data.access_token, data.refresh_token);
    return data;
  },
};
