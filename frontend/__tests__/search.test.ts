import { describe, it, expect } from "vitest";
import { filterTrips } from "@/lib/search";
import type { Trip } from "@/lib/types";

const makeTrip = (overrides: Partial<Trip> & { title: string }): Trip => ({
  id: Math.random().toString(),
  title: overrides.title,
  description: overrides.description,
  total_steps: overrides.total_steps ?? 0,
  total_distance: overrides.total_distance ?? 0,
  created_at: overrides.created_at ?? "2024-01-01T00:00:00Z",
  ...overrides,
});

const trips: Trip[] = [
  makeTrip({ title: "Japan 2023", description: "Cherry blossoms", total_steps: 5, total_distance: 800, created_at: "2023-03-01T00:00:00Z" }),
  makeTrip({ title: "Portugal 2024", description: "Lisbon vibes", total_steps: 3, total_distance: 300, created_at: "2024-06-01T00:00:00Z" }),
  makeTrip({ title: "Argentina", description: "Patagonia hike", total_steps: 8, total_distance: 1200, created_at: "2022-12-01T00:00:00Z" }),
];

describe("filterTrips", () => {
  it("returns all trips when no filters applied", () => {
    expect(filterTrips(trips, {})).toHaveLength(3);
  });

  it("filters by title search text (case-insensitive)", () => {
    const result = filterTrips(trips, { searchText: "japan" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Japan 2023");
  });

  it("filters by description search text", () => {
    const result = filterTrips(trips, { searchText: "patagonia" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Argentina");
  });

  it("returns empty array when no trips match search", () => {
    expect(filterTrips(trips, { searchText: "Antarctica" })).toHaveLength(0);
  });

  it("filters by minimum location count", () => {
    const result = filterTrips(trips, { minLocations: 5 });
    expect(result.every((t) => (t.total_steps ?? 0) >= 5)).toBe(true);
    expect(result).toHaveLength(2);
  });

  it("sorts by date descending by default", () => {
    const result = filterTrips(trips, { sortBy: "date", sortOrder: "desc" });
    expect(result[0].title).toBe("Portugal 2024");
    expect(result[result.length - 1].title).toBe("Argentina");
  });

  it("sorts by name ascending", () => {
    const result = filterTrips(trips, { sortBy: "name", sortOrder: "asc" });
    expect(result[0].title).toBe("Argentina");
  });

  it("sorts by distance descending", () => {
    const result = filterTrips(trips, { sortBy: "distance", sortOrder: "desc" });
    expect(result[0].title).toBe("Argentina");
  });
});
