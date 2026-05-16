/**
 * Trip endpoints: CRUD, split, share.
 */
import { createApiError, request } from "./client";

export interface TripUpdate {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_public?: boolean;
}

const requireToken = (token: string) => {
  if (!token) throw createApiError("Token required", 401, "MISSING_TOKEN");
};
const requireTripId = (tripId: string) => {
  if (!tripId) throw createApiError("Trip ID required", 400, "MISSING_TRIP_ID");
};

export const tripsApi = {
  async createTrip(
    token: string,
    title: string,
    description?: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    requireToken(token);
    if (!title || title.trim().length === 0) {
      throw createApiError("Trip title required", 400, "MISSING_TITLE");
    }

    const body: Record<string, unknown> = { title: title.trim() };
    if (description && description.trim()) body.description = description.trim();
    if (startDate && startDate.trim()) body.start_date = startDate;
    if (endDate && endDate.trim()) body.end_date = endDate;

    return request<any>({
      method: "POST",
      path: "/trips/",
      auth: token,
      body,
      errorPrefix: "CREATE_TRIP",
      fallbackMessage: "Failed to create trip",
    });
  },

  async getTrips(token: string): Promise<any[]> {
    requireToken(token);
    const data = await request<any[]>({
      method: "GET",
      path: "/trips/",
      auth: token,
      errorPrefix: "FETCH_TRIPS",
      fallbackMessage: "Failed to fetch trips",
    });
    return Array.isArray(data) ? data : [];
  },

  async getTrip(token: string, tripId: string): Promise<any> {
    requireToken(token);
    requireTripId(tripId);
    return request<any>({
      method: "GET",
      path: `/trips/${tripId}`,
      auth: token,
      errorPrefix: "FETCH_TRIP",
      errorMap: { 404: "TRIP_NOT_FOUND" },
      fallbackMessage: "Failed to fetch trip",
    });
  },

  async deleteTrip(token: string, tripId: string): Promise<any> {
    requireToken(token);
    requireTripId(tripId);
    return request<any>({
      method: "DELETE",
      path: `/trips/${tripId}`,
      auth: token,
      errorPrefix: "DELETE_TRIP",
      errorMap: { 404: "TRIP_NOT_FOUND" },
      fallbackMessage: "Failed to delete trip",
    });
  },

  async updateTrip(token: string, tripId: string, updates: TripUpdate): Promise<any> {
    requireToken(token);
    requireTripId(tripId);
    return request<any>({
      method: "PATCH",
      path: `/trips/${tripId}`,
      auth: token,
      body: updates,
      errorPrefix: "UPDATE_TRIP",
      fallbackMessage: "Failed to update trip",
    });
  },

  async splitTrip(
    token: string,
    tripId: string,
    newTripTitle: string,
    stepIds: string[]
  ): Promise<{ original_trip: any; new_trip: any }> {
    requireToken(token);
    requireTripId(tripId);
    if (!newTripTitle?.trim())
      throw createApiError("New trip title required", 400, "MISSING_TITLE");
    if (!stepIds?.length) throw createApiError("No steps provided", 400, "MISSING_STEPS");

    return request<{ original_trip: any; new_trip: any }>({
      method: "POST",
      path: `/trips/${tripId}/split`,
      auth: token,
      body: { new_trip_title: newTripTitle, step_ids: stepIds },
      errorPrefix: "SPLIT_TRIP",
      fallbackMessage: "Failed to split trip",
    });
  },

  async shareTrip(
    token: string,
    tripId: string
  ): Promise<{ share_token: string; share_url: string }> {
    return request<{ share_token: string; share_url: string }>({
      method: "POST",
      path: `/trips/${tripId}/share`,
      auth: token,
      errorPrefix: "SHARE",
      fallbackMessage: "Failed to generate share link",
    });
  },

  async revokeShareLink(token: string, tripId: string): Promise<void> {
    await request<void>({
      method: "DELETE",
      path: `/trips/${tripId}/share`,
      auth: token,
      errorPrefix: "REVOKE",
      fallbackMessage: "Failed to revoke share link",
    });
  },

  async getSharedTrip(shareToken: string): Promise<any> {
    return request<any>({
      method: "GET",
      path: `/trips/shared/${shareToken}`,
      errorPrefix: "SHARED_NOT_FOUND",
      fallbackMessage: "Shared trip not found",
    });
  },
};
