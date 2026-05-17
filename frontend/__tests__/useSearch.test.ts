import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSearch } from "@/hooks/useSearch";
import type { Trip } from "@/lib/types";

const makeTrip = (title: string, total_steps = 0): Trip => ({
  id: Math.random().toString(),
  title,
  total_steps,
  created_at: "2024-01-01T00:00:00Z",
});

describe("useSearch", () => {
  const trips = [makeTrip("Japan", 5), makeTrip("Portugal", 3), makeTrip("Argentina", 8)];

  it("returns all trips initially", () => {
    const { result } = renderHook(() => useSearch(trips));
    expect(result.current.filteredTrips).toHaveLength(3);
  });

  it("filters trips when searchText is set", () => {
    const { result } = renderHook(() => useSearch(trips));
    act(() => result.current.setSearchText("japan"));
    expect(result.current.filteredTrips).toHaveLength(1);
    expect(result.current.filteredTrips[0].title).toBe("Japan");
  });

  it("clears filter when searchText is reset to empty", () => {
    const { result } = renderHook(() => useSearch(trips));
    act(() => result.current.setSearchText("japan"));
    act(() => result.current.setSearchText(""));
    expect(result.current.filteredTrips).toHaveLength(3);
  });

  it("updates filteredTrips when filterSettings change", () => {
    const { result } = renderHook(() => useSearch(trips));
    act(() => result.current.setFilterSettings({ minLocations: 5 }));
    expect(result.current.filteredTrips.every((t) => (t.total_steps ?? 0) >= 5)).toBe(true);
  });
});
