/**
 * API Client for Pollarsteps
 * Handles all HTTP communication with comprehensive error handling and type safety
 */

import {
  Trip,
  Step,
  User,
  Story,
  ShareLinkResponse,
  LocationRecommendations,
} from "./types";
import { AppError, extractErrorMessage } from "./errors";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
const REQUEST_TIMEOUT = 30000; // 30 seconds
const AUTH_TIMEOUT = 45000; // 45 seconds for auth requests

interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface ApiErrorResponse {
  detail?: string;
  message?: string;
  error?: string;
}

type ApiError = {
  message: string;
  status: number;
  code?: string;
};

// Error handling utilities
const createApiError = (
  message: string,
  status: number,
  code?: string
): ApiError => ({ message, status, code });

const parseApiError = async (response: Response): Promise<string> => {
  try {
    const error = (await response.json()) as ApiErrorResponse;
    return error.detail || error.message || "API Error";
  } catch {
    return `HTTP ${response.status}: ${response.statusText}`;
  }
};

// Fetch with timeout
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout = REQUEST_TIMEOUT
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(
        "Request timeout - server is taking too long to respond. Please try again."
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Input validation
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password: string): boolean => {
  return !!(password && password.length >= 6);
};

const validateCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

export const api = {
  // Auth endpoints
  async register(email: string, password: string, name?: string): Promise<TokenPair> {
    if (!email || !validateEmail(email)) {
      throw createApiError("Invalid email format", 400, "INVALID_EMAIL");
    }
    if (!validatePassword(password)) {
      throw createApiError("Password must be at least 6 characters", 400, "INVALID_PASSWORD");
    }

    try {
      const response = await fetchWithTimeout(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          username: name || email.split("@")[0],
        }),
      }, AUTH_TIMEOUT);

      if (!response.ok) {
        const message = await parseApiError(response);
        throw createApiError(message, response.status, "REGISTER_FAILED");
      }

      const data = await response.json();
      if (!data.access_token) throw new Error("Invalid token response");
      return data;
    } catch (err) {
      if (err && typeof err === "object" && "code" in err) {
        throw err;
      }
      throw createApiError(
        err instanceof Error ? err.message : "Registration failed",
        0,
        "NETWORK_ERROR"
      );
    }
  },

  async login(emailOrUsername: string, password: string): Promise<TokenPair> {
    if (!emailOrUsername) {
      throw createApiError("Email or username required", 400, "MISSING_LOGIN");
    }
    if (!password) {
      throw createApiError("Password required", 400, "MISSING_PASSWORD");
    }

    try {
      const response = await fetchWithTimeout(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_or_username: emailOrUsername, password }),
      }, AUTH_TIMEOUT);

      if (!response.ok) {
        const message = await parseApiError(response);
        throw createApiError(
          message,
          response.status,
          response.status === 401 ? "INVALID_CREDENTIALS" : "LOGIN_FAILED"
        );
      }

      const data = await response.json();
      if (!data.access_token) throw new Error("Invalid token response");
      return data;
    } catch (err) {
      if (err && typeof err === "object" && "code" in err) {
        throw err;
      }
      throw createApiError(
        err instanceof Error ? err.message : "Login failed",
        0,
        "NETWORK_ERROR"
      );
    }
  },

  // Trip endpoints
  async createTrip(
    token: string,
    title: string,
    description?: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    if (!token) throw createApiError("Token required", 401, "MISSING_TOKEN");
    if (!title || title.trim().length === 0) {
      throw createApiError("Trip title required", 400, "MISSING_TITLE");
    }

    try {
      const url = `${API_BASE}/trips/`;
      const body: any = {
        title: title.trim(),
      };

      // Only include description if it has content
      if (description && description.trim()) {
        body.description = description.trim();
      }

      // Only include start_date if it has content
      if (startDate && startDate.trim()) {
        body.start_date = startDate;
      }

      if (endDate && endDate.trim()) {
        body.end_date = endDate;
      }
      
      const response = await fetchWithTimeout(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorMsg = await parseApiError(response);
        console.error("[API] Error response:", errorMsg);
        throw createApiError(errorMsg, response.status, "CREATE_TRIP_FAILED");
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      if (err && typeof err === "object" && "code" in err) {
        throw err;
      }
      throw createApiError(
        err instanceof Error ? err.message : "Failed to create trip",
        0,
        "NETWORK_ERROR"
      );
    }
  },

  async getTrips(token: string): Promise<any[]> {
    if (!token) throw createApiError("Token required", 401, "MISSING_TOKEN");

    try {
      const url = `${API_BASE}/trips/`;
      const response = await fetchWithTimeout(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorMsg = await parseApiError(response);
        throw createApiError("Failed to fetch trips", response.status, "FETCH_TRIPS_FAILED");
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      if (err && typeof err === "object" && "code" in err) {
        throw err;
      }
      throw createApiError(
        err instanceof Error ? err.message : "Failed to fetch trips",
        0,
        "NETWORK_ERROR"
      );
    }
  },

  async getTrip(token: string, tripId: string): Promise<any> {
    if (!token) throw createApiError("Token required", 401, "MISSING_TOKEN");
    if (!tripId) throw createApiError("Trip ID required", 400, "MISSING_TRIP_ID");

    try {
      const response = await fetchWithTimeout(`${API_BASE}/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw createApiError("Trip not found", 404, "TRIP_NOT_FOUND");
        }
        throw createApiError("Failed to fetch trip", response.status, "FETCH_TRIP_FAILED");
      }
      return await response.json();
    } catch (err) {
      if (err && typeof err === "object" && "code" in err) {
        throw err;
      }
      throw createApiError(
        err instanceof Error ? err.message : "Failed to fetch trip",
        0,
        "NETWORK_ERROR"
      );
    }
  },

  async deleteTrip(token: string, tripId: string): Promise<any> {
    if (!token) throw createApiError("Token required", 401, "MISSING_TOKEN");
    if (!tripId) throw createApiError("Trip ID required", 400, "MISSING_TRIP_ID");

    try {
      const url = `${API_BASE}/trips/${tripId}`;
      const response = await fetchWithTimeout(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw createApiError("Trip not found", 404, "TRIP_NOT_FOUND");
        }
        const errorMsg = await parseApiError(response);
        throw createApiError(errorMsg, response.status, "DELETE_TRIP_FAILED");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      if (err && typeof err === "object" && "code" in err) {
        throw err;
      }
      throw createApiError(
        err instanceof Error ? err.message : "Failed to delete trip",
        0,
        "NETWORK_ERROR"
      );
    }
  },

  async updateTrip(
    token: string,
    tripId: string,
    updates: { title?: string; description?: string; start_date?: string; end_date?: string; is_public?: boolean }
  ): Promise<any> {
    if (!token) throw createApiError("Token required", 401, "MISSING_TOKEN");
    if (!tripId) throw createApiError("Trip ID required", 400, "MISSING_TRIP_ID");

    try {
      const response = await fetchWithTimeout(`${API_BASE}/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const errorMsg = await parseApiError(response);
        throw createApiError(errorMsg, response.status, "UPDATE_TRIP_FAILED");
      }
      return await response.json();
    } catch (err) {
      if (err && typeof err === "object" && "code" in err) throw err;
      throw createApiError(err instanceof Error ? err.message : "Failed to update trip", 0, "NETWORK_ERROR");
    }
  },

  async splitTrip(
    token: string,
    tripId: string,
    newTripTitle: string,
    stepIds: string[]
  ): Promise<{ original_trip: any; new_trip: any }> {
    if (!token) throw createApiError("Token required", 401, "MISSING_TOKEN");
    if (!tripId) throw createApiError("Trip ID required", 400, "MISSING_TRIP_ID");
    if (!newTripTitle?.trim()) throw createApiError("New trip title required", 400, "MISSING_TITLE");
    if (!stepIds?.length) throw createApiError("No steps provided", 400, "MISSING_STEPS");

    try {
      const response = await fetchWithTimeout(`${API_BASE}/trips/${tripId}/split`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ new_trip_title: newTripTitle, step_ids: stepIds }),
      });

      if (!response.ok) {
        const errorMsg = await parseApiError(response);
        throw createApiError(errorMsg, response.status, "SPLIT_TRIP_FAILED");
      }

      return await response.json();
    } catch (err) {
      if (err && typeof err === "object" && "code" in err) throw err;
      throw createApiError(
        err instanceof Error ? err.message : "Failed to split trip",
        0,
        "NETWORK_ERROR"
      );
    }
  },

  // Step endpoints
  async createStep(
    token: string,
    tripId: string,
    lat: number,
    lng: number,
    note?: string,
    imageUrl?: string,
    locationName?: string
  ): Promise<any> {
    if (!token) {
      throw createApiError("Token required", 401, "MISSING_TOKEN");
    }
    if (!tripId) {
      throw createApiError("Trip ID required", 400, "MISSING_TRIP_ID");
    }
    if (!validateCoordinates(lat, lng)) {
      throw createApiError("Invalid coordinates", 400, "INVALID_COORDINATES");
    }

    try {
      const { v4: uuidv4 } = await import("uuid");
      const clientUuid = uuidv4();
      
      const body: any = {
        trip_id: tripId,
        lat,
        lng,
        note: note?.trim() || "",
        image_url: imageUrl,
        timestamp: new Date().toISOString(),
        client_uuid: clientUuid,
      };
      
      // Only include location_name if provided
      if (locationName && locationName.trim()) {
        body.location_name = locationName.trim();
      }

      const response = await fetchWithTimeout(`${API_BASE}/steps/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw createApiError("Failed to create step", response.status, "CREATE_STEP_FAILED");
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      
      if (err && typeof err === "object" && "code" in err) {
        throw err;
      }
      throw createApiError(
        err instanceof Error ? err.message : "Failed to create step",
        0,
        "NETWORK_ERROR"
      );
    }
  },

  async getSteps(token: string, tripId: string): Promise<any[]> {
    if (!token) throw createApiError("Token required", 401, "MISSING_TOKEN");
    if (!tripId) throw createApiError("Trip ID required", 400, "MISSING_TRIP_ID");

    try {
      const url = `${API_BASE}/steps/trip/${encodeURIComponent(tripId)}/`;
      const response = await fetchWithTimeout(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorMsg = await parseApiError(response);
        throw createApiError("Failed to fetch steps", response.status, "FETCH_STEPS_FAILED");
      }

      const data = await response.json();
      // Backend returns TripWithSteps object with steps array
      return Array.isArray(data.steps) ? data.steps : [];
    } catch (err) {
      if (err && typeof err === "object" && "code" in err) {
        throw err;
      }
      throw createApiError(
        err instanceof Error ? err.message : "Failed to fetch steps",
        0,
        "NETWORK_ERROR"
      );
    }
  },

  async updateStep(token: string, stepId: string, updates: { location_name?: string; note?: string; duration_days?: number }): Promise<any> {
    if (!token) throw createApiError("Token required", 401, "MISSING_TOKEN");
    if (!stepId) throw createApiError("Step ID required", 400, "MISSING_STEP_ID");

    try {
      const url = `${API_BASE}/steps/${encodeURIComponent(stepId)}/`;
      const response = await fetchWithTimeout(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw createApiError("Failed to update step", response.status, "UPDATE_STEP_FAILED");
      }
      return await response.json();
    } catch (err) {
      if (err && typeof err === "object" && "code" in err) {
        throw err;
      }
      throw createApiError(
        err instanceof Error ? err.message : "Failed to update step",
        0,
        "NETWORK_ERROR"
      );
    }
  },

  async deleteStep(token: string, stepId: string): Promise<any> {
    if (!token) throw createApiError("Token required", 401, "MISSING_TOKEN");
    if (!stepId) throw createApiError("Step ID required", 400, "MISSING_STEP_ID");

    try {
      const url = `${API_BASE}/steps/${encodeURIComponent(stepId)}/`;
      const response = await fetchWithTimeout(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw createApiError("Failed to delete step", response.status, "DELETE_STEP_FAILED");
      }
      return await response.json();
    } catch (err) {
      if (err && typeof err === "object" && "code" in err) {
        throw err;
      }
      throw createApiError(
        err instanceof Error ? err.message : "Failed to delete step",
        0,
        "NETWORK_ERROR"
      );
    }
  },

  async changePassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
    if (!token) throw createApiError("Token required", 401, "MISSING_TOKEN");
    const response = await fetchWithTimeout(`${API_BASE}/auth/me/password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw createApiError(err.detail || "Failed to change password", response.status, "CHANGE_PASSWORD_FAILED");
    }
  },

  // Get current user
  async getCurrentUser(token: string): Promise<User> {
    if (!token) throw createApiError("Token required", 401, "MISSING_TOKEN");

    try {
      const response = await fetchWithTimeout(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }, AUTH_TIMEOUT);

      if (!response.ok) {
        if (response.status === 401) {
          throw createApiError("Unauthorized", 401, "UNAUTHORIZED");
        }
        if (response.status === 404) {
          throw createApiError("User not found", 404, "USER_NOT_FOUND");
        }
        throw createApiError("Failed to fetch user", response.status, "FETCH_USER_FAILED");
      }

      const data = await response.json();
      if (!data.id) throw new Error("Invalid user response");
      return data;
    } catch (err) {
      if (err && typeof err === "object" && "code" in err) {
        throw err;
      }
      throw createApiError(
        err instanceof Error ? err.message : "Failed to fetch user",
        0,
        "NETWORK_ERROR"
      );
    }
  },

  // Image upload with comprehensive error handling
  async uploadImage(file: File): Promise<string> {
    const MAX_SIZE = 4 * 1024 * 1024; // 4MB
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    // Validate file
    if (!file) {
      throw createApiError("File required", 400, "MISSING_FILE");
    }
    if (file.size > MAX_SIZE) {
      throw createApiError("File too large (max 4MB)", 400, "FILE_TOO_LARGE");
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw createApiError("Invalid file type (PNG, JPG, GIF, WebP only)", 400, "INVALID_FILE_TYPE");
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetchWithTimeout(
        `${API_BASE}/uploads/image`,
        {
          method: "POST",
          body: formData,
        },
        15000 // longer timeout for image upload
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw createApiError(
          error.detail || "Image upload failed",
          response.status,
          "UPLOAD_FAILED"
        );
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error("Invalid response from server");
      }

      // If it's a data URL, return as-is; otherwise prepend API_BASE
      if (data.url.startsWith("data:")) {
        return data.url;
      }
      return `${API_BASE}${data.url}`;
    } catch (err) {
      if (err && typeof err === "object" && "code" in err) {
        throw err;
      }
      if (err instanceof DOMException && err.name === "AbortError") {
        throw createApiError("Image upload timeout", 0, "UPLOAD_TIMEOUT");
      }
      throw createApiError(
        err instanceof Error ? err.message : "Image upload failed",
        0,
        "UPLOAD_ERROR"
      );
    }
  },

  // Recommendations endpoint
  async getRecommendations(
    location: string,
    lat: number,
    lon: number,
    recType: string = "all",
    budget: string = "moderate",
    question?: string
  ): Promise<any> {
    try {
      const params = new URLSearchParams({
        location,
        lat: lat.toString(),
        lon: lon.toString(),
        rec_type: recType,
        budget,
      });
      if (question && question.trim()) {
        params.append("question", question.trim());
      }
      
      const response = await fetchWithTimeout(
        `${API_BASE}/recommendations/location?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const msg = await parseApiError(response);
        throw createApiError(msg || "Recommendations unavailable", response.status, "RECOMMENDATIONS_FAILED");
      }

      return await response.json();
    } catch (err) {
      if (err && typeof err === "object" && "code" in err) throw err;
      throw createApiError(
        err instanceof Error ? err.message : "Failed to get recommendations",
        0,
        "NETWORK_ERROR"
      );
    }
  },

  // Token refresh endpoint
  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    if (!refreshToken) {
      throw createApiError("No refresh token available", 401, "NO_REFRESH_TOKEN");
    }

    try {
      const response = await fetchWithTimeout(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        session.logout(); // Clear session if refresh fails
        throw createApiError("Token refresh failed", response.status, "REFRESH_FAILED");
      }

      const data = await response.json();
      if (!data.access_token) throw new Error("Invalid token response");

      // Update stored tokens
      session.setTokens(data.access_token, data.refresh_token);
      return data;
    } catch (err) {
      if (err && typeof err === "object" && "code" in err) {
        throw err;
      }
      throw createApiError(
        err instanceof Error ? err.message : "Token refresh failed",
        0,
        "NETWORK_ERROR"
      );
    }
  },

  // Share trip
  async shareTrip(token: string, tripId: string): Promise<{ share_token: string; share_url: string }> {
    const response = await fetchWithTimeout(`${API_BASE}/trips/${tripId}/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw createApiError("Failed to generate share link", response.status, "SHARE_FAILED");
    return response.json();
  },

  // Create story (highlight reel)
  async createStory(
    token: string,
    tripId: string,
    options: {
      maxSlides?: number;
      includeMap?: boolean;
      shareable?: boolean;
      songProvider?: string;
      songId?: string;
      songTitle?: string;
      songThumbnail?: string;
      songStartTime?: number;
      songDuration?: number;
    } = {}
  ): Promise<Story> {
    if (!token) throw createApiError("Token required", 401, "MISSING_TOKEN");
    if (!tripId) throw createApiError("Trip ID required", 400, "MISSING_TRIP_ID");

    const payload = {
      trip_id: tripId,
      max_slides: options.maxSlides ?? 12,
      include_map: options.includeMap ?? true,
      shareable: options.shareable ?? true,
      song_provider: options.songProvider,
      song_id: options.songId,
      song_title: options.songTitle,
      song_thumbnail: options.songThumbnail,
      song_start_time: options.songStartTime ?? 0,
      song_duration: options.songDuration ?? 15,
    };

    const response = await fetchWithTimeout(`${API_BASE}/stories/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = await parseApiError(response);
      throw createApiError(message, response.status, "CREATE_STORY_FAILED");
    }

    return response.json();
  },

  // Revoke share link
  async revokeShareLink(token: string, tripId: string): Promise<void> {
    const response = await fetchWithTimeout(`${API_BASE}/trips/${tripId}/share`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw createApiError("Failed to revoke share link", response.status, "REVOKE_FAILED");
  },

  // Get shared trip (no auth needed)
  async getSharedTrip(shareToken: string): Promise<any> {
    const response = await fetchWithTimeout(`${API_BASE}/trips/shared/${shareToken}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw createApiError("Shared trip not found", response.status, "SHARED_NOT_FOUND");
    return response.json();
  },
};

// Session management with best practices
// Auto-refresh token manager
let refreshTimeout: NodeJS.Timeout | null = null;

const scheduleTokenRefresh = () => {
  if (refreshTimeout) clearTimeout(refreshTimeout);
  
  if (typeof window === "undefined") return;
  
  // Refresh token 5 minutes before expiry (access token expires in 30 minutes)
  // So refresh after 25 minutes
  const REFRESH_BEFORE_EXPIRY = 25 * 60 * 1000;
  
  refreshTimeout = setTimeout(async () => {
    try {
      const refreshToken = session.getRefreshToken();
      if (refreshToken) {
        await api.refreshAccessToken(refreshToken);
        scheduleTokenRefresh(); // Schedule next refresh
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
      // Also set access token in a cookie for middleware access
      document.cookie = `auth_token=${accessToken};path=/;max-age=2592000`;
      scheduleTokenRefresh(); // Schedule auto-refresh
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
      // Also set in a cookie for middleware access
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
      // Clear cookie
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
