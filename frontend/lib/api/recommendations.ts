/**
 * AI recommendations endpoint.
 */
import { request } from "./client";

export const recommendationsApi = {
  async getRecommendations(
    location: string,
    lat: number,
    lon: number,
    recType: string = "all",
    budget: string = "moderate",
    question?: string
  ): Promise<any> {
    return request<any>({
      method: "GET",
      path: "/recommendations/location",
      query: {
        location,
        lat: lat.toString(),
        lon: lon.toString(),
        rec_type: recType,
        budget,
        question: question?.trim() || undefined,
      },
      errorPrefix: "RECOMMENDATIONS",
      fallbackMessage: "Failed to get recommendations",
    });
  },
};
