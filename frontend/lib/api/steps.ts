/**
 * Step endpoints: create, list, update, delete.
 */
import { createApiError, request } from "./client";
import { validateCoordinates } from "./validation";

export interface StepUpdate {
  location_name?: string;
  note?: string;
  duration_days?: number;
}

const requireToken = (token: string) => {
  if (!token) throw createApiError("Token required", 401, "MISSING_TOKEN");
};
const requireStepId = (stepId: string) => {
  if (!stepId) throw createApiError("Step ID required", 400, "MISSING_STEP_ID");
};
const requireTripId = (tripId: string) => {
  if (!tripId) throw createApiError("Trip ID required", 400, "MISSING_TRIP_ID");
};

export const stepsApi = {
  async createStep(
    token: string,
    tripId: string,
    lat: number,
    lng: number,
    note?: string,
    imageUrl?: string,
    locationName?: string
  ): Promise<any> {
    requireToken(token);
    requireTripId(tripId);
    if (!validateCoordinates(lat, lng)) {
      throw createApiError("Invalid coordinates", 400, "INVALID_COORDINATES");
    }

    const { v4: uuidv4 } = await import("uuid");
    const body: Record<string, unknown> = {
      trip_id: tripId,
      lat,
      lng,
      note: note?.trim() || "",
      image_url: imageUrl,
      timestamp: new Date().toISOString(),
      client_uuid: uuidv4(),
    };
    if (locationName && locationName.trim()) {
      body.location_name = locationName.trim();
    }

    return request<any>({
      method: "POST",
      path: "/steps/",
      auth: token,
      body,
      errorPrefix: "CREATE_STEP",
      fallbackMessage: "Failed to create step",
    });
  },

  async getSteps(token: string, tripId: string): Promise<any[]> {
    requireToken(token);
    requireTripId(tripId);
    const data = await request<{ steps?: any[] }>({
      method: "GET",
      path: `/steps/trip/${encodeURIComponent(tripId)}/`,
      auth: token,
      errorPrefix: "FETCH_STEPS",
      fallbackMessage: "Failed to fetch steps",
    });
    return Array.isArray(data?.steps) ? data.steps : [];
  },

  async updateStep(token: string, stepId: string, updates: StepUpdate): Promise<any> {
    requireToken(token);
    requireStepId(stepId);
    return request<any>({
      method: "PUT",
      path: `/steps/${encodeURIComponent(stepId)}/`,
      auth: token,
      body: updates,
      errorPrefix: "UPDATE_STEP",
      fallbackMessage: "Failed to update step",
    });
  },

  async deleteStep(token: string, stepId: string): Promise<any> {
    requireToken(token);
    requireStepId(stepId);
    return request<any>({
      method: "DELETE",
      path: `/steps/${encodeURIComponent(stepId)}/`,
      auth: token,
      errorPrefix: "DELETE_STEP",
      fallbackMessage: "Failed to delete step",
    });
  },
};
