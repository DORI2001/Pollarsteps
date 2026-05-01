"use client";

import React from "react";
import { useColors } from "@/lib/theme";
import { ModalShell } from "./ModalShell";
import { Trip } from "@/lib/types";
import { TripFilter } from "@/lib/search";

interface FilterModalProps {
  trips: Trip[];
  filteredTrips: Trip[];
  searchText: string;
  filterSettings: TripFilter;
  onSearchChange: (text: string) => void;
  onFilterChange: (f: TripFilter) => void;
  onSelectTrip: (trip: Trip) => void;
  onClose: () => void;
}

export function FilterModal({
  trips, filteredTrips, searchText, filterSettings,
  onSearchChange, onFilterChange, onSelectTrip, onClose,
}: FilterModalProps) {
  const COLORS = useColors();

  const selectStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 12,
    border: `1px solid ${COLORS.border}`, background: COLORS.inputBg,
    color: COLORS.text, fontSize: 14, boxSizing: "border-box",
  };

  const handleReset = () => {
    onSearchChange("");
    onFilterChange({ searchText: "", sortBy: "date", sortOrder: "desc" });
  };

  return (
    <ModalShell onClose={onClose}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: COLORS.text, margin: "0 0 6px 0" }}>Search & Filter</h2>
      <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: "0 0 24px 0" }}>Find and sort your trips</p>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>Search</label>
        <input type="text" placeholder="Search trips..." value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ ...selectStyle }} />
      </div>

      <div style={{ maxHeight: 240, overflowY: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 14, marginBottom: 20, padding: 8, background: COLORS.surface }}>
        {filteredTrips.length === 0 ? (
          <div style={{ padding: 12, color: COLORS.textSecondary, fontSize: 13 }}>
            No trips match &quot;{searchText}&quot;
          </div>
        ) : (
          filteredTrips.map((trip) => (
            <button key={trip.id}
              onClick={() => { onSelectTrip(trip); onClose(); }}
              style={{ width: "100%", textAlign: "left", padding: "10px 12px", border: "none", background: "transparent", color: COLORS.text, cursor: "pointer", borderRadius: 10, transition: "all 0.15s" }}
              onMouseOver={(e) => { e.currentTarget.style.background = COLORS.inputBg; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ fontWeight: 600, fontSize: 14 }}>{trip.title}</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
                {(trip.total_steps ?? trip.steps?.length ?? 0)} locations · {trip.total_distance || 0} km
              </div>
            </button>
          ))
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>Sort By</label>
        <select value={filterSettings.sortBy || "date"}
          onChange={(e) => onFilterChange({ ...filterSettings, sortBy: e.target.value as TripFilter["sortBy"] })}
          style={selectStyle}>
          <option value="date">Most Recent</option>
          <option value="name">Alphabetical</option>
          <option value="distance">Distance</option>
          <option value="locations">Locations</option>
        </select>
      </div>

      <div style={{ marginBottom: 28 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>Order</label>
        <select value={filterSettings.sortOrder || "desc"}
          onChange={(e) => onFilterChange({ ...filterSettings, sortOrder: e.target.value as TripFilter["sortOrder"] })}
          style={selectStyle}>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={handleReset}
          style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.text, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
          Reset
        </button>
        <button onClick={onClose}
          style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: COLORS.primary, color: "white", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
          Done
        </button>
      </div>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.border}`, fontSize: 12, color: COLORS.textSecondary, textAlign: "center" }}>
        Showing {filteredTrips.length} of {trips.length} trip{trips.length !== 1 ? "s" : ""}
      </div>
    </ModalShell>
  );
}
