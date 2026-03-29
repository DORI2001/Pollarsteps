"use client";

import React, { useState, useMemo } from "react";
import { exportAsJSON, exportAsCSV, exportAsGeoJSON, exportAsGPX, ExportTrip } from "@/lib/export";
import { filterTrips, TripFilter } from "@/lib/search";

import { useColors } from "@/lib/theme";
import { api, session as authSession } from "@/lib/api";

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
  const COLORS = useColors();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tripTitle, setTripTitle] = useState("");
  const [tripDesc, setTripDesc] = useState("");
  const [startDate, setStartDate] = useState("");
  const [creatingTrip, setCreatingTrip] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const handleShare = async () => {
    if (!currentTrip) return;
    const token = authSession.getToken();
    if (!token) return;

    setShareLoading(true);
    setCopied(false);
    try {
      const result = await api.shareTrip(token, currentTrip.id);
      const fullUrl = `${window.location.origin}/shared/${result.share_token}`;
      setShareLink(fullUrl);
      setShowShareModal(true);
    } catch (err) {
      console.error("Failed to generate share link:", err);
      alert("Failed to generate share link");
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = shareLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevokeShare = async () => {
    if (!currentTrip) return;
    const token = authSession.getToken();
    if (!token) return;

    try {
      await api.revokeShareLink(token, currentTrip.id);
      setShareLink("");
      setShowShareModal(false);
    } catch (err) {
      console.error("Failed to revoke share link:", err);
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
      {/* Glass Morphism Header */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: "64px",
          backdropFilter: "saturate(180%) blur(20px)",
          background: COLORS.headerBg,
          borderBottom: `1px solid ${COLORS.border}`,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: "20px",
            height: "100%",
            justifyContent: "space-between",
          }}
        >
          {/* Trip Title and Meta */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>
              {currentTrip?.title || "No Trip Selected"}
            </div>
            <div style={{ fontSize: 12, fontWeight: 400, color: COLORS.textSecondary, display: "flex", gap: 8, alignItems: "center" }}>
              <span>{formattedStartDate}</span>
              <span>·</span>
              <span>{stepCount} location{stepCount !== 1 ? "s" : ""}</span>
              <span>·</span>
              <span>{totalDays} day{totalDays !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Search & Filter Button */}
            <button
              onClick={() => setShowFilterModal(true)}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: "none",
                background: `rgba(${COLORS.primary === "#5B6CF0" ? "91, 108, 240" : "129, 140, 248"}, 0.12)`,
                color: COLORS.text,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                transition: "all 0.2s ease-in-out",
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = `rgba(${COLORS.primary === "#5B6CF0" ? "91, 108, 240" : "129, 140, 248"}, 0.2)`;
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = `rgba(${COLORS.primary === "#5B6CF0" ? "91, 108, 240" : "129, 140, 248"}, 0.12)`;
              }}
              title="Search & Filter"
            >
              Search
            </button>

            {/* Trip Select Dropdown */}
            <select
              onChange={(e) => {
                const trip = filteredTrips.find((t) => t.id === e.target.value);
                if (trip) onSelectTrip(trip);
              }}
              value={currentTrip?.id || ""}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.surface,
                color: COLORS.text,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 400,
                transition: "all 0.2s ease-in-out",
              }}
            >
              <option value="">Select Trip</option>
              {filteredTrips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.title}
                </option>
              ))}
            </select>

            {/* New Trip Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: "none",
                background: COLORS.success,
                color: "white",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
                transition: "all 0.2s ease-in-out",
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "1";
              }}
            >
              + New Trip
            </button>

            {/* Share Button */}
            {currentTrip && (
              <button
                onClick={handleShare}
                disabled={shareLoading}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: "none",
                  background: `rgba(${COLORS.primary === "#5B6CF0" ? "91, 108, 240" : "129, 140, 248"}, 0.12)`,
                  color: COLORS.primary,
                  cursor: shareLoading ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "all 0.2s ease-in-out",
                  opacity: shareLoading ? 0.6 : 1,
                }}
                onMouseOver={(e) => {
                  if (!shareLoading) (e.currentTarget as HTMLButtonElement).style.background = `rgba(${COLORS.primary === "#5B6CF0" ? "91, 108, 240" : "129, 140, 248"}, 0.2)`;
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = `rgba(${COLORS.primary === "#5B6CF0" ? "91, 108, 240" : "129, 140, 248"}, 0.12)`;
                }}
              >
                {shareLoading ? "..." : "Share"}
              </button>
            )}

            {/* Export Button */}
            {currentTrip && (
              <button
                onClick={() => setShowExportModal(true)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: `1px solid ${COLORS.border}`,
                  background: "transparent",
                  color: COLORS.text,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  transition: "all 0.2s ease-in-out",
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = `rgba(0, 0, 0, 0.06)`;
                  if (COLORS.text === "#F5F5F7") {
                    (e.currentTarget as HTMLButtonElement).style.background = `rgba(255, 255, 255, 0.1)`;
                  }
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                Export
              </button>
            )}

            {/* Delete Button */}
            {currentTrip && onDeleteTrip && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: `1px solid ${COLORS.border}`,
                  background: "transparent",
                  color: COLORS.text,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  transition: "all 0.2s ease-in-out",
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = `rgba(0, 0, 0, 0.06)`;
                  if (COLORS.text === "#F5F5F7") {
                    (e.currentTarget as HTMLButtonElement).style.background = `rgba(255, 255, 255, 0.1)`;
                  }
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                Delete
              </button>
            )}

            {/* Sign Out Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: "none",
                  background: "transparent",
                  color: COLORS.text,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 400,
                  opacity: 0.7,
                  transition: "all 0.2s ease-in-out",
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "0.7";
                }}
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Create Trip Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: COLORS.overlayBg,
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
              borderRadius: 28,
              padding: 36,
              maxWidth: 420,
              width: "90%",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
              animation: "scale-in 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 600, color: COLORS.text, margin: "0 0 8px 0" }}>
              Create New Trip
            </h2>
            <p style={{ fontSize: 13, fontWeight: 400, color: COLORS.textSecondary, margin: "0 0 24px 0" }}>
              Start tracking your next adventure
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>
                Trip Title
              </label>
              <input
                type="text"
                placeholder="Europe 2024"
                value={tripTitle}
                onChange={(e) => setTripTitle(e.target.value)}
                disabled={creatingTrip}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.inputBg,
                  color: COLORS.text,
                  fontSize: 14,
                  fontWeight: 400,
                  boxSizing: "border-box",
                  transition: "all 0.2s",
                  opacity: creatingTrip ? 0.6 : 1,
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>
                Description
              </label>
              <textarea
                placeholder="Tell us about this trip..."
                value={tripDesc}
                onChange={(e) => setTripDesc(e.target.value)}
                disabled={creatingTrip}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.inputBg,
                  color: COLORS.text,
                  fontSize: 14,
                  fontWeight: 400,
                  boxSizing: "border-box",
                  minHeight: "80px",
                  fontFamily: "inherit",
                  resize: "none",
                  transition: "all 0.2s",
                  opacity: creatingTrip ? 0.6 : 1,
                }}
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={creatingTrip}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.inputBg,
                  color: COLORS.text,
                  fontSize: 14,
                  fontWeight: 400,
                  boxSizing: "border-box",
                  transition: "all 0.2s",
                  opacity: creatingTrip ? 0.6 : 1,
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creatingTrip}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: "transparent",
                  color: COLORS.text,
                  cursor: creatingTrip ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s",
                  opacity: creatingTrip ? 0.6 : 1,
                }}
                onMouseOver={(e) => {
                  if (!creatingTrip) {
                    (e.currentTarget as HTMLButtonElement).style.background = `rgba(0, 0, 0, 0.05)`;
                    if (COLORS.text === "#F5F5F7") {
                      (e.currentTarget as HTMLButtonElement).style.background = `rgba(255, 255, 255, 0.1)`;
                    }
                  }
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
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
                  borderRadius: 12,
                  border: "none",
                  background: COLORS.primary,
                  color: "white",
                  cursor: creatingTrip ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s",
                  opacity: creatingTrip ? 0.6 : 1,
                }}
                onMouseOver={(e) => {
                  if (!creatingTrip) {
                    (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
                  }
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                }}
              >
                {creatingTrip ? "Creating..." : "Create Trip"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && currentTrip && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: COLORS.overlayBg,
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
              borderRadius: 28,
              padding: 36,
              maxWidth: 380,
              width: "90%",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
              animation: "scale-in 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 600, color: COLORS.error, margin: "0 0 8px 0" }}>
              Delete Trip?
            </h2>
            <p style={{ fontSize: 15, fontWeight: 400, color: COLORS.textSecondary, margin: "0 0 28px 0", lineHeight: 1.5 }}>
              Are you sure you want to delete "{currentTrip.title}"? This action cannot be undone.
            </p>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: "transparent",
                  color: COLORS.text,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = `rgba(0, 0, 0, 0.05)`;
                  if (COLORS.text === "#F5F5F7") {
                    (e.currentTarget as HTMLButtonElement).style.background = `rgba(255, 255, 255, 0.1)`;
                  }
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTrip}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: "none",
                  background: COLORS.error,
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && currentTrip && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: COLORS.overlayBg,
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
              borderRadius: 28,
              padding: 36,
              maxWidth: 420,
              width: "90%",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
              animation: "scale-in 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 600, color: COLORS.text, margin: "0 0 6px 0" }}>
              Export Trip
            </h2>
            <p style={{ fontSize: 15, fontWeight: 400, color: COLORS.textSecondary, margin: "0 0 24px 0" }}>
              Choose a format for "{currentTrip.title}"
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <button
                onClick={() => handleExport("json")}
                style={{
                  padding: "16px",
                  borderRadius: 14,
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
                JSON
              </button>

              <button
                onClick={() => handleExport("csv")}
                style={{
                  padding: "16px",
                  borderRadius: 14,
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
                CSV
              </button>

              <button
                onClick={() => handleExport("geojson")}
                style={{
                  padding: "16px",
                  borderRadius: 14,
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
                GeoJSON
              </button>

              <button
                onClick={() => handleExport("gpx")}
                style={{
                  padding: "16px",
                  borderRadius: 14,
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
                GPX
              </button>
            </div>

            <button
              onClick={() => setShowExportModal(false)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 12,
                border: `1px solid ${COLORS.border}`,
                background: "transparent",
                color: COLORS.text,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = `rgba(0, 0, 0, 0.05)`;
                if (COLORS.text === "#F5F5F7") {
                  (e.currentTarget as HTMLButtonElement).style.background = `rgba(255, 255, 255, 0.1)`;
                }
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && shareLink && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: COLORS.overlayBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowShareModal(false)}
        >
          <div
            style={{
              background: COLORS.surface,
              borderRadius: 28,
              padding: 36,
              maxWidth: 460,
              width: "90%",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
              animation: "scale-in 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 600, color: COLORS.text, margin: "0 0 8px 0" }}>
              Share Your Trip
            </h2>
            <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: "0 0 24px 0", lineHeight: 1.5 }}>
              Anyone with this link can view "{currentTrip?.title}" and all its locations on the map.
            </p>

            {/* Link display */}
            <div style={{
              display: "flex",
              gap: 8,
              marginBottom: 20,
            }}>
              <input
                type="text"
                readOnly
                value={shareLink}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.inputBg,
                  color: COLORS.text,
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopyLink}
                style={{
                  padding: "12px 20px",
                  borderRadius: 12,
                  border: "none",
                  background: copied ? COLORS.success : COLORS.primary,
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleRevokeShare}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.error}`,
                  background: "transparent",
                  color: COLORS.error,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = COLORS.error;
                  (e.currentTarget as HTMLButtonElement).style.color = "white";
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = COLORS.error;
                }}
              >
                Revoke Link
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: "none",
                  background: COLORS.primary,
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s",
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: COLORS.overlayBg,
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
              borderRadius: 28,
              padding: 36,
              maxWidth: 420,
              width: "90%",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
              animation: "scale-in 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 600, color: COLORS.text, margin: "0 0 6px 0" }}>
              Search & Filter
            </h2>
            <p style={{ fontSize: 13, fontWeight: 400, color: COLORS.textSecondary, margin: "0 0 24px 0" }}>
              Find and sort your trips
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>
                Search
              </label>
              <input
                type="text"
                placeholder="Search trips..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.inputBg,
                  color: COLORS.text,
                  fontSize: 14,
                  fontWeight: 400,
                  boxSizing: "border-box",
                  transition: "all 0.2s",
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
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
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.inputBg,
                  color: COLORS.text,
                  fontSize: 14,
                  fontWeight: 400,
                  boxSizing: "border-box",
                  transition: "all 0.2s",
                }}
              >
                <option value="date">Most Recent</option>
                <option value="name">Alphabetical</option>
                <option value="distance">Distance</option>
                <option value="locations">Locations</option>
              </select>
            </div>

            <div style={{ marginBottom: 28 }}>
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
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.inputBg,
                  color: COLORS.text,
                  fontSize: 14,
                  fontWeight: 400,
                  boxSizing: "border-box",
                  transition: "all 0.2s",
                }}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => {
                  setSearchText("");
                  setFilterSettings({ searchText: "", sortBy: "date", sortOrder: "desc" });
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: "transparent",
                  color: COLORS.text,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = `rgba(0, 0, 0, 0.05)`;
                  if (COLORS.text === "#F5F5F7") {
                    (e.currentTarget as HTMLButtonElement).style.background = `rgba(255, 255, 255, 0.1)`;
                  }
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: "none",
                  background: COLORS.primary,
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                }}
              >
                Done
              </button>
            </div>

            <div
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: `1px solid ${COLORS.border}`,
                fontSize: 12,
                fontWeight: 400,
                color: COLORS.textSecondary,
                textAlign: "center",
              }}
            >
              Showing {filteredTrips.length} of {trips.length} trip{trips.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed header */}
      <div style={{ height: "64px" }} />
    </>
  );
}
