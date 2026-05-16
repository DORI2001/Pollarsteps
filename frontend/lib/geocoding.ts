import { request } from "./api/client";

export interface ResolvedLocation {
  lat: number;
  lng: number;
  zoom?: number;
}

export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  country: string;
  display_name: string;
}

// ─── Forward geocoding ────────────────────────────────────────────────────────

const forwardCache = new Map<string, Promise<ResolvedLocation | null>>();
const fullResultCache = new Map<string, Promise<GeocodingResult | null>>();

const fetchFullResult = async (query: string): Promise<GeocodingResult | null> => {
  try {
    return await request<GeocodingResult | null>({
      method: "GET",
      path: "/geocoding/geocode",
      query: { location: query },
    });
  } catch {
    return null;
  }
};

/** Resolves a location query to lat/lng/zoom (cached). Returns null on failure. */
export const resolveLocation = (query: string): Promise<ResolvedLocation | null> => {
  const key = query.trim().toLowerCase();
  if (!key) return Promise.resolve(null);
  const existing = forwardCache.get(key);
  if (existing) return existing;
  const pending = fetchFullResult(key).then((geo) =>
    geo?.latitude && geo?.longitude ? { lat: geo.latitude, lng: geo.longitude, zoom: 6 } : null
  );
  forwardCache.set(key, pending);
  pending.then((r) => { if (!r) forwardCache.delete(key); }).catch(() => forwardCache.delete(key));
  return pending;
};

/** Resolves a location query to the full backend GeocodingResult (cached). */
export const searchLocation = (query: string): Promise<GeocodingResult | null> => {
  const key = query.trim().toLowerCase();
  if (!key) return Promise.resolve(null);
  const existing = fullResultCache.get(key);
  if (existing) return existing;
  const pending = fetchFullResult(key);
  fullResultCache.set(key, pending);
  pending.then((r) => { if (!r) fullResultCache.delete(key); }).catch(() => fullResultCache.delete(key));
  return pending;
};

// ─── Reverse geocoding ────────────────────────────────────────────────────────

const reverseCache = new Map<string, Promise<string>>();

const fetchLocationName = async (lat: number, lng: number): Promise<string> => {
  try {
    const result = await request<string | null>({
      method: "GET",
      path: "/geocoding/reverse-geocode",
      query: { lat: String(lat), lon: String(lng) },
    });
    return typeof result === "string" ? result : "";
  } catch {
    return "";
  }
};

/** Reverse-geocodes lat/lng to a human-readable location name (cached). Returns "" on failure. */
export const resolveLocationName = (lat: number, lng: number): Promise<string> => {
  const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  const existing = reverseCache.get(key);
  if (existing) return existing;
  const pending = fetchLocationName(lat, lng);
  reverseCache.set(key, pending);
  pending.then((r) => { if (!r) reverseCache.delete(key); }).catch(() => reverseCache.delete(key));
  return pending;
};
