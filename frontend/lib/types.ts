/**
 * Common types and interfaces used across the Pollarsteps application
 */

export interface User {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
}

export interface Step {
  id: string;
  trip_id: string;
  lat: number;
  lng: number;
  timestamp: string;
  location_name?: string;
  note?: string;
  duration_days?: number;
  image_url?: string | null;
  client_uuid?: string;
}

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_public?: boolean;
  created_at: string;
  updated_at: string;
  total_distance?: number;
  total_steps?: number;
  steps?: Step[];
  route_geojson?: GeoJSON;
  share_token?: string;
}

export interface GeoJSON {
  type: "FeatureCollection";
  features: GeoFeature[];
}

export interface GeoFeature {
  type: "Feature";
  geometry: GeoGeometry;
  properties: Record<string, any>;
}

export interface GeoGeometry {
  type: "LineString" | "Point";
  coordinates: number[] | number[][];
}

export interface Recommendation {
  title: string;
  type: string;
  description: string;
  why_recommended: string;
  estimated_time?: string;
}

export interface LocationRecommendations {
  location: string;
  recommendations: Recommendation[];
  summary: string;
}

export interface TripFilter {
  searchText?: string;
  minLocations?: number;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ShareLinkResponse {
  share_token: string;
  share_url: string;
}

export interface APIError {
  message: string;
  detail?: string;
  status?: number;
}

export type TripViewerCoords = {
  lat: number;
  lng: number;
};

export type MapClickEvent = {
  lat: number;
  lng: number;
  timestamp: string;
};
