/**
 * Story (highlight reel) endpoints.
 */
import { Story } from "../types";
import { createApiError, request } from "./client";

export interface CreateStoryOptions {
  maxSlides?: number;
  includeMap?: boolean;
  shareable?: boolean;
  songProvider?: string;
  songId?: string;
  songTitle?: string;
  songThumbnail?: string;
  songStartTime?: number;
  songDuration?: number;
}

export const storiesApi = {
  async createStory(
    token: string,
    tripId: string,
    options: CreateStoryOptions = {}
  ): Promise<Story> {
    if (!token) throw createApiError("Token required", 401, "MISSING_TOKEN");
    if (!tripId) throw createApiError("Trip ID required", 400, "MISSING_TRIP_ID");

    return request<Story>({
      method: "POST",
      path: "/stories/",
      auth: token,
      body: {
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
      },
      errorPrefix: "CREATE_STORY",
      fallbackMessage: "Failed to create story",
    });
  },
};
