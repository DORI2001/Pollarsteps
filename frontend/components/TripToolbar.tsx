"use client";

import React, { useState, useMemo } from "react";
import { exportAsJSON, exportAsCSV, exportAsGeoJSON, exportAsGPX, ExportTrip } from "@/lib/export";
import { filterTrips, TripFilter } from "@/lib/search";
import { ThemeToggle } from "./ThemeToggle";

const COLORS = {
  primary: "#667eea",
  primaryDark: "#764ba2",
  secondary: "#5AC8FA",
  background: "#F5F5F7",
  surface: "#FFFFFF",
  text: "#1D1D1D",
  textSecondary: "#86868B",
  border: "#E5E5EA",
  success: "#34C759",
  warning: "#FF9500",
  error: "#FF3B30",
};

interface Trip {
  id: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  total_days_travelled?: number;
  steps?: any[];
  total_distance?: number;
}

interface TripToolbarProps {
  trips: Trip[];
  currentTrip: Trip | null;
  onSelectTrip: (trip: Trip) => void;
  onCreateTrip: (title: string, description: string, startDate: string) => Promise<void>;
  onDeleteTrip?: (tripId: string) => Promise<void>;
  onLogout?: () => void;
  loading?: boolean;
}

export function TripToolbar({
  trips,
  currentTrip,
  onSelectTrip,
  onCreateTrip,
  onDeleteTrip,
  onLogout,
  loading = false,
}: TripToolbarProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tripTitle, setTripTitle] = useState("");
  const [tripDesc, setTripDesc] = useState("");
  const [startDate, setStartDate] = useState("");
  const [creatingTrip, setCreatingTrip] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterSettings, setFilterSettings] = useState<TripFilter>({
    searchText: "",
    sortBy: "date",
    sortOrder: "desc",
  });

  const handleCreateTrip = async () => {
    if (!tripTitle.trim()) {
      alert("Please enter a trip title");
      return;
    }

    setCreatingTrip(true);
    try {
      await onCreateTrip(tripTitle, tripDesc, startDate);
      setTripTitle("");
      setTripDesc("");
      setStartDate("");
      setShowCreateModal(false);
    } catch (error) {
      alert("Failed to create trip");
    } finally {
      setCreatingTrip(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!currentTrip || !onDeleteTrip) return;
    try {
      await onDeleteTrip(currentTrip.id);
      setShowDeleteConfirm(false);
    } catch (error: any) {
      const errorMsg = error?.message || error?.toString() || "Unknown error";
      console.error("Delete error:", error);
      alert(`Failed to delete trip: ${errorMsg}`);
    }
  };

  const handleExport = (format: "json" | "csv" | "geojson" | "gpx") => {
    if (!currentTrip) return;

    const exportData: ExportTrip = {
      id: currentTrip.id,
      title: currentTrip.title,
      description: currentTrip.description,
      start_date: currentTrip.start_date,
      steps: (currentTrip.steps || []).map((step: any, index: number) => ({
        id: step.id,
        lat: step.lat,
        lng: step.lng,
        timestamp: step.timestamp,
        location_name: step.location_name,
        note: step.note,
        duration_days: step.duration_days,
        index: index + 1,
      })),
      total_distance: currentTrip.total_distance || 0,
      total_days: currentTrip.total_days_travelled || 0,
    };

    try {
      if (format === "json") {
        exportAsJSON(exportData);
      } else if (format === "csv") {
        exportAsCSV(exportData);
      } else if (format === "geojson") {
        exportAsGeoJSON(exportData);
      } else if (format === "gpx") {
        exportAsGPX(exportData);
      }
      setShowExportModal(false);
    } catch (error) {
      alert("Failed to export trip");
    }
  };

  // Calculate filtered trips
  const filteredTrips = useMemo(() => {
    return filterTrips(trips, { ...filterSettings, searchText });
  }, [trips, filterSettings, searchText]);

  const totalDays = currentTrip?.total_days_travelled || 0;
  const stepCount = currentTrip?.steps?.length || 0;
  const formattedStartDate = currentTrip?.start_date
    ? new Date(currentTrip.start_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not set";

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
          color: "white",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 20px",
            gap: "20px",
            height: "70px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              ✈️ {currentTrip?.title || "No Trip Selected"}
            </div>
            <div style={{ fontSize: 11, opacity: 0.85, display: "flex", gap: 14 }}>
              <span>📅 {formattedStartDate}</span>
              <span>🗺️ {stepCount} location{stepCount !== 1 ? "s" : ""}</span>
              <span>⏱️ {totalDays} day{totalDays !== 1 ? "s" : ""}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => setShowFilterModal(true)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                background: "rgba(255, 255, 255, 0.2)",
                color: "white",
                cursor: "pointer",
                fontSize: 14,
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255, 255, 255, 0.3)";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255, 255, 255, 0.2)";
              }}
              title="Search & Filter"
            >
              🔍
            </button>

            <select
              onChange={(e) => {
                const trip = filteredTrips.find((t) => t.id === e.target.value);
                if (trip) onSelectTrip(trip);
              }}
              value={currentTrip?.id || ""}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                background: "rgba(255, 255, 255, 0.25)",
                color: "white",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <option value="" style={{ color: COLORS.text }}>
                Select Trip
              </option>
              {filteredTrips.map((trip) => (
                <option key={trip.id} value={trip.id} style={{ color: COLORS.text }}>
                  {trip.title}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: COLORS.success,
                color: "white",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 12,
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              + New Trip
            </button>

            {currentTrip && (
              <button
                onClick={() => setShowExportModal(true)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid rgba(255, 255, 255, 0.3)`,
                  background: "transparent",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 12,
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255, 255, 255, 0.1)";
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                ⬇️ Export
              </button>
            )}

            {currentTrip && onDeleteTrip && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid rgba(255, 255, 255, 0.3)`,
                  background: "transparent",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 12,
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255, 255, 255, 0.1)";
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                🗑️ Delete
              </button>
            )}

            <ThemeToggle />

            {onLogout && (
              <button
                onClick={onLogout}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid rgba(255, 255, 255, 0.3)`,
                  background: "transparent",
                  color: "#FFD700",
                  cursor: "pointer",
                  fontSize: 12,
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255, 255, 255, 0.1)";
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: COLORS.surface,
              borderRadius: 20,
              padding: 32,
              maxWidth: 400,
              width: "90%",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, margin: "0 0 20px 0" }}>
              Create New Trip
            </h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>
                Trip Title
              </label>
              <input
                type="text"
                placeholder="e.g., Europe 2024"
                value={tripTitle}
                onChange={(e) => setTripTitle(e.target.value)}
                disabled={creatingTrip}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: 14,
                  boxSizing: "border-box",
                  opacity: creatingTrip ? 0.6 : 1,
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>
                Description (optional)
              </label>
              <textarea
                placeholder="Tell us about this trip..."
                value={tripDesc}
                onChange={(e) => setTripDesc(e.target.value)}
                disabled={creatingTrip}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: 14,
                  boxSizing: "border-box",
                  minHeight: "80px",
                  fontFamily: "inherit",
                  opacity: creatingTrip ? 0.6 : 1,
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>
                Start Date (optional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={creatingTrip}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: 14,
                  boxSizing: "border-box",
                  opacity: creatingTrip ? 0.6 : 1,
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creatingTrip}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  background: "transparent",
                  color: COLORS.text,
                  cursor: creatingTrip ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  opacity: creatingTrip ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTrip}
                disabled={creatingTrip}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 8,
                  border: "none",
                  background: COLORS.primary,
                  color: "white",
                  cursor: creatingTrip ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  opacity: creatingTrip ? 0.6 : 1,
                }}
              >
                {creatingTrip ? "Creating..." : "Create Trip"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && currentTrip && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              background: COLORS.surface,
              borderRadius: 20,
              padding: 32,
              maxWidth: 400,
              width: "90%",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.error, margin: "0 0 12px 0" }}>
              Delete Trip?
            </h2>
            <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: "0 0 24px 0" }}>
              Are you sure you want to delete "{currentTrip.title}"? This action cannot be undone.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  background: "transparent",
                  color: COLORS.text,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTrip}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 8,
                  border: "none",
                  background: COLORS.error,
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showExportModal && currentTrip && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowExportModal(false)}
        >
          <div
            style={{
              background: COLORS.surface,
              borderRadius: 20,
              padding: 32,
              maxWidth: 400,
              width: "90%",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, margin: "0 0 12px 0" }}>
              Export Trip
            </h2>
            <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: "0 0 20px 0" }}>
              Choose a format to export "{currentTrip.title}":
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <button
                onClick={() => handleExport("json")}
                style={{
                  padding: "16px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.background,
                  color: COLORS.text,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = COLORS.border;
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = COLORS.background;
                }}
              >
                <span style={{ fontSize: 20 }}>📄</span>
                JSON
              </button>

              <button
                onClick={() => handleExport("csv")}
                style={{
                  padding: "16px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.background,
                  color: COLORS.text,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = COLORS.border;
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = COLORS.background;
                }}
              >
                <span style={{ fontSize: 20 }}>📊</span>
                CSV
              </button>

              <button
                onClick={() => handleExport("geojson")}
                style={{
                  padding: "16px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.background,
                  color: COLORS.text,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = COLORS.border;
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = COLORS.background;
                }}
              >
                <span style={{ fontSize: 20 }}>🗺️</span>
                GeoJSON
              </button>

              <button
                onClick={() => handleExport("gpx")}
                style={{
                  padding: "16px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.background,
                  color: COLORS.text,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = COLORS.border;
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = COLORS.background;
                }}
              >
                <span style={{ fontSize: 20 }}>📍</span>
                GPX
              </button>
            </div>

            <button
              onClick={() => setShowExportModal(false)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
                background: "transparent",
                color: COLORS.text,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showFilterModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowFilterModal(false)}
        >
          <div
            style={{
              background: COLORS.surface,
              borderRadius: 20,
              padding: 32,
              maxWidth: 400,
              width: "90%",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, margin: "0 0 20px 0" }}>
              🔍 Search & Filter
            </h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>
                Search Trips
              </label>
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>
                Sort By
              </label>
              <select
                value={filterSettings.sortBy || "date"}
                onChange={(e) =>
                  setFilterSettings({ ...filterSettings, sortBy: e.target.value as any })
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              >
                <option value="date">Most Recent</option>
                <option value="name">Alphabetical</option>
                <option value="distance">Distance</option>
                <option value="locations">Locations</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>
                Order
              </label>
              <select
                value={filterSettings.sortOrder || "desc"}
                onChange={(e) =>
                  setFilterSettings({ ...filterSettings, sortOrder: e.target.value as any })
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  setSearchText("");
                  setFilterSettings({ searchText: "", sortBy: "date", sortOrder: "desc" });
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  background: "transparent",
                  color: COLORS.text,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 8,
                  border: "none",
                  background: COLORS.primary,
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Done
              </button>
            </div>

            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: `1px solid ${COLORS.border}`,
                fontSize: 12,
                color: COLORS.textSecondary,
                textAlign: "center",
              }}
            >
              Showing {filteredTrips.length} of {trips.length} trip{trips.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      )}

      <div style={{ height: "70px" }} />
    </>
  );
}
