import { Trip, TripFilter } from "./types";

/**
 * Extended filter options for advanced trip filtering
 */
export interface AdvancedTripFilter extends TripFilter {
  maxLocations?: number;
  minDistance?: number;
  maxDistance?: number;
  sortBy?: "name" | "date" | "distance" | "locations";
  sortOrder?: "asc" | "desc";
}

// Re-export TripFilter from types so it can be imported from here
export type { TripFilter } from "./types";

/**
 * Filter and search trips based on criteria.
 * @param trips - Array of trips to filter
 * @param filters - Filter criteria
 * @returns Filtered array of trips
 */
export function filterTrips(
  trips: Trip[],
  filters: AdvancedTripFilter
): Trip[] {
  let filtered = [...trips];

  // Search by title and description
  if (filters.searchText && filters.searchText.trim()) {
    const search = filters.searchText.toLowerCase();
    filtered = filtered.filter(
      (trip) =>
        trip.title.toLowerCase().includes(search) ||
        (trip.description && trip.description.toLowerCase().includes(search))
    );
  }

  // Filter by location count
  if (filters.minLocations !== undefined) {
    filtered = filtered.filter(
      (trip) => (trip.total_steps || 0) >= filters.minLocations!
    );
  }

  if (filters.maxLocations !== undefined) {
    filtered = filtered.filter(
      (trip) => (trip.total_steps || 0) <= filters.maxLocations!
    );
  }

  // Filter by distance
  if (filters.minDistance !== undefined) {
    filtered = filtered.filter(
      (trip) => (trip.total_distance || 0) >= filters.minDistance!
    );
  }

  if (filters.maxDistance !== undefined) {
    filtered = filtered.filter(
      (trip) => (trip.total_distance || 0) <= filters.maxDistance!
    );
  }

  // Sort trips
  const sortBy = filters.sortBy || "date";
  const sortOrder = filters.sortOrder || "desc";

  filtered.sort((a, b) => {
    let compareA = 0;
    let compareB = 0;

    if (sortBy === "name") {
      compareA = a.title.localeCompare(b.title);
      compareB = b.title.localeCompare(a.title);
    } else if (sortBy === "date") {
      compareA = new Date(a.created_at || 0).getTime();
      compareB = new Date(b.created_at || 0).getTime();
    } else if (sortBy === "distance") {
      compareA = a.total_distance || 0;
      compareB = b.total_distance || 0;
    } else if (sortBy === "locations") {
      compareA = a.total_steps ?? a.steps?.length ?? 0;
      compareB = b.total_steps ?? b.steps?.length ?? 0;
    }

    return sortOrder === "asc" ? compareA - compareB : compareB - compareA;
  });

  return filtered;
}

export function getFilterStats(trips: any[]) {
  if (trips.length === 0) {
    return {
      minLocations: 0,
      maxLocations: 0,
      minDistance: 0,
      maxDistance: 0,
    };
  }

  const locations = trips.map((t) => t.steps?.length || 0);
  const distances = trips.map((t) => t.total_distance || 0);

  return {
    minLocations: Math.min(...locations),
    maxLocations: Math.max(...locations),
    minDistance: Math.min(...distances),
    maxDistance: Math.max(...distances),
  };
}
