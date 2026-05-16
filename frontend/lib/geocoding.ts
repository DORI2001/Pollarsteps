/**
 * Location resolver. Wraps the backend /geocoding/geocode endpoint with
 * an in-memory cache and a single error path: failures resolve to null
 * rather than throwing.
 */
import { API_BASE } from "./api/client";

export interface ResolvedLocation {
  lat: number;
  lng: number;
  zoom?: number;
}

const cache = new Map<string, Promise<ResolvedLocation | null>>();

const fetchLocation = async (query: string): Promise<ResolvedLocation | null> => {
  try {
    const res = await fetch(
      `${API_BASE}/geocoding/geocode?location=${encodeURIComponent(query)}`
    );
    if (!res.ok) return null;
    const geo = await res.json();
    if (geo?.latitude && geo?.longitude) {
      return { lat: geo.latitude, lng: geo.longitude, zoom: 6 };
    }
    return null;
  } catch {
    return null;
  }
};

export const resolveLocation = (query: string): Promise<ResolvedLocation | null> => {
  const key = query.trim().toLowerCase();
  if (!key) return Promise.resolve(null);
  const existing = cache.get(key);
  if (existing) return existing;
  const pending = fetchLocation(key);
  cache.set(key, pending);
  // Evict failures so a retry can succeed.
  pending.then((r) => { if (!r) cache.delete(key); }).catch(() => cache.delete(key));
  return pending;
};

// Reverse geocoding cache (keyed by "lat,lng")
const reverseCache = new Map<string, Promise<string>>();

const fetchLocationName = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data.address) {
      const { city, town, village, county, state, country } = data.address;
      return `${city || town || village || county || "Location"}, ${state || country || ""}`.replace(/,\s*$/, "");
    }
    return "";
  } catch {
    return "";
  }
};

export const resolveLocationName = (lat: number, lng: number): Promise<string> => {
  const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  const existing = reverseCache.get(key);
  if (existing) return existing;
  const pending = fetchLocationName(lat, lng);
  reverseCache.set(key, pending);
  // Evict empty results so retries can succeed.
  pending.then((r) => { if (!r) reverseCache.delete(key); }).catch(() => reverseCache.delete(key));
  return pending;
};
