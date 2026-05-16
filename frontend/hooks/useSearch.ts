"use client";

import { useState, useMemo } from "react";
import { filterTrips } from "@/lib/search";
import { Trip, TripFilter } from "@/lib/types";

const DEFAULT_FILTER: TripFilter = { searchText: "", sortBy: "date", sortOrder: "desc" };

export function useSearch(trips: Trip[]) {
  const [searchText, setSearchText] = useState("");
  const [filterSettings, setFilterSettings] = useState<TripFilter>(DEFAULT_FILTER);

  const filteredTrips = useMemo(
    () => filterTrips(trips, { ...filterSettings, searchText }),
    [trips, filterSettings, searchText]
  );

  return { filteredTrips, searchText, setSearchText, filterSettings, setFilterSettings };
}
