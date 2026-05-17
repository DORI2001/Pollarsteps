"use client";

import React, { useState } from "react";
import { useSearch } from "@/hooks/useSearch";
import { useColors } from "@/lib/theme";
import { radii } from "@/lib/design-tokens";
import { api, session as authSession } from "@/lib/api";
import { Trip } from "@/lib/types";
import { StoryReelModal } from "@/components/StoryReelModal";
import { CreateTripModal } from "@/components/modals/CreateTripModal";
import { EditTripModal } from "@/components/modals/EditTripModal";
import { DeleteTripModal } from "@/components/modals/DeleteTripModal";
import { ExportModal } from "@/components/modals/ExportModal";
import { ShareModal } from "@/components/modals/ShareModal";
import { FilterModal } from "@/components/modals/FilterModal";
import { SettingsModal } from "@/components/modals/SettingsModal";

interface TripToolbarProps {
  trips: Trip[];
  currentTrip: Trip | null;
  onSelectTrip: (trip: Trip) => void;
  onCreateTrip: (title: string, description: string, startDate: string, endDate?: string) => Promise<void>;
  onDeleteTrip?: (tripId: string) => Promise<void>;
  onUpdateTrip?: (trip: Trip) => void;
  onLogout?: () => void;
  loading?: boolean;
}

type ActiveModal = "create" | "edit" | "delete" | "export" | "share" | "filter" | "settings" | "reel" | null;

export function TripToolbar({
  trips, currentTrip, onSelectTrip, onCreateTrip, onDeleteTrip, onUpdateTrip, onLogout,
}: TripToolbarProps) {
  const COLORS = useColors();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [shareLink, setShareLink] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const { filteredTrips, searchText, setSearchText, filterSettings, setFilterSettings } = useSearch(trips);

  const close = () => setActiveModal(null);

  // Returns [token, tripId] or null if either is missing — centralises the
  // repeated "get token + guard currentTrip" pattern across all toolbar actions.
  const getAuth = (): [string, string] | null => {
    const token = authSession.getToken();
    if (!token || !currentTrip) return null;
    return [token, currentTrip.id];
  };

  const handleShare = async () => {
    const auth = getAuth();
    if (!auth) return;
    const [token, tripId] = auth;
    setShareLoading(true);
    try {
      const result = await api.shareTrip(token, tripId);
      setShareLink(`${window.location.origin}/shared/${result.share_token}`);
      setActiveModal("share");
    } catch {
      alert("Failed to generate share link");
    } finally {
      setShareLoading(false);
    }
  };

  const handleRevokeShare = async () => {
    const auth = getAuth();
    if (!auth) return;
    const [token, tripId] = auth;
    await api.revokeShareLink(token, tripId);
    setShareLink("");
  };

  const handleEditSave = async (updated: Trip) => {
    const auth = getAuth();
    if (!auth) return;
    const [token, tripId] = auth;
    const result = await api.updateTrip(token, tripId, {
      title: updated.title?.trim() || undefined,
      description: updated.description?.trim() || undefined,
      start_date: updated.start_date || undefined,
      end_date: updated.end_date || undefined,
    });
    onUpdateTrip?.(result);
  };

  const totalDays = currentTrip?.total_days_travelled || 0;
  const stepCount = currentTrip?.steps?.length || 0;
  const formattedDate = currentTrip?.start_date
    ? new Date(currentTrip.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Not set";

  // Shared pill-button style factory
  const ghostBtn = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: "8px 16px", borderRadius: radii["3xl"], border: "none",
    background: "transparent", color: COLORS.text,
    cursor: "pointer", fontSize: 13, fontWeight: 500,
    transition: "all 0.2s ease-in-out", ...extra,
  });

  const primaryAlpha = COLORS.primary === "#5B6CF0" ? "91, 108, 240" : "129, 140, 248";

  return (
    <>
      {/* Glass-morphism header */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 64,
        backdropFilter: "saturate(180%) blur(20px)", background: COLORS.headerBg,
        borderBottom: `1px solid ${COLORS.border}`,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", padding: "0 20px", gap: 20, height: "100%", justifyContent: "space-between" }}>

          {/* Trip meta */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>
              {currentTrip?.title || "No Trip Selected"}
            </div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, display: "flex", gap: 8, alignItems: "center" }}>
              <span>{formattedDate}</span>
              <span>·</span>
              <span>{stepCount} location{stepCount !== 1 ? "s" : ""}</span>
              <span>·</span>
              <span>{totalDays} day{totalDays !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>

            {/* Zone 1: Navigation */}
            <button onClick={() => setActiveModal("filter")} style={{ ...ghostBtn(), background: `rgba(${primaryAlpha}, 0.12)` }}
              onMouseOver={(e) => { e.currentTarget.style.background = `rgba(${primaryAlpha}, 0.2)`; }}
              onMouseOut={(e) => { e.currentTarget.style.background = `rgba(${primaryAlpha}, 0.12)`; }}>
              Search
            </button>

            <select onChange={(e) => { const t = filteredTrips.find(x => x.id === e.target.value); if (t) onSelectTrip(t); }}
              value={currentTrip?.id || ""}
              style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, cursor: "pointer", fontSize: 13 }}>
              <option value="">Select Trip</option>
              {filteredTrips.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>

            <button onClick={() => setActiveModal("create")}
              style={{ padding: "9px 20px", borderRadius: radii["3xl"], border: "none", background: COLORS.success, color: "white", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
              onMouseOver={(e) => { e.currentTarget.style.opacity = "0.85"; }}
              onMouseOut={(e) => { e.currentTarget.style.opacity = "1"; }}>
              + New Trip
            </button>

            {/* Zone 2: Trip actions */}
            {currentTrip && <span style={{ width: 1, height: 20, background: COLORS.border, opacity: 0.5 }} />}

            {currentTrip && (
              <button onClick={handleShare} disabled={shareLoading}
                style={{ ...ghostBtn({ background: `rgba(${primaryAlpha}, 0.12)`, color: COLORS.primary, opacity: shareLoading ? 0.6 : 1 }), cursor: shareLoading ? "not-allowed" : "pointer" }}
                onMouseOver={(e) => { if (!shareLoading) e.currentTarget.style.background = `rgba(${primaryAlpha}, 0.2)`; }}
                onMouseOut={(e) => { e.currentTarget.style.background = `rgba(${primaryAlpha}, 0.12)`; }}>
                {shareLoading ? "..." : "Share"}
              </button>
            )}

            {currentTrip && (
              <button onClick={() => setActiveModal("reel")}
                style={{ padding: "8px 16px", borderRadius: radii["3xl"], border: "none", background: COLORS.secondary, color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                onMouseOver={(e) => { e.currentTarget.style.opacity = "0.9"; }}
                onMouseOut={(e) => { e.currentTarget.style.opacity = "1"; }}>
                🎬 Reel
              </button>
            )}

            {currentTrip && (
              <button onClick={() => setActiveModal("export")} style={ghostBtn({ border: `1px solid ${COLORS.border}` })}
                onMouseOver={(e) => { e.currentTarget.style.background = COLORS.text === "#F5F5F7" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}>
                Export
              </button>
            )}

            {currentTrip && (
              <button onClick={() => setActiveModal("edit")} style={ghostBtn({ border: `1px solid ${COLORS.border}` })}
                onMouseOver={(e) => { e.currentTarget.style.background = COLORS.text === "#F5F5F7" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}>
                Edit
              </button>
            )}

            {currentTrip && onDeleteTrip && (
              <button onClick={() => setActiveModal("delete")} style={ghostBtn({ border: `1px solid ${COLORS.border}` })}
                onMouseOver={(e) => { e.currentTarget.style.background = COLORS.text === "#F5F5F7" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}>
                Delete
              </button>
            )}

            {/* Zone 3: System */}
            <span style={{ width: 1, height: 20, background: COLORS.border, opacity: 0.5 }} />

            <button onClick={() => setActiveModal("settings")} style={ghostBtn({ opacity: 0.55 })}
              onMouseOver={(e) => { e.currentTarget.style.opacity = "1"; }}
              onMouseOut={(e) => { e.currentTarget.style.opacity = "0.55"; }}>
              Settings
            </button>

            {onLogout && (
              <button onClick={onLogout} style={ghostBtn({ opacity: 0.55, fontWeight: 400 })}
                onMouseOver={(e) => { e.currentTarget.style.opacity = "1"; }}
                onMouseOut={(e) => { e.currentTarget.style.opacity = "0.55"; }}>
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === "create" && <CreateTripModal onClose={close} onCreate={onCreateTrip} />}
      {activeModal === "edit" && currentTrip && <EditTripModal trip={currentTrip} onClose={close} onSave={handleEditSave} />}
      {activeModal === "delete" && currentTrip && onDeleteTrip && (
        <DeleteTripModal tripTitle={currentTrip.title} onClose={close} onDelete={() => onDeleteTrip(currentTrip.id)} />
      )}
      {activeModal === "export" && currentTrip && <ExportModal trip={currentTrip} onClose={close} />}
      {activeModal === "share" && shareLink && currentTrip && (
        <ShareModal tripTitle={currentTrip.title} shareLink={shareLink} onClose={close} onRevoke={handleRevokeShare} />
      )}
      {activeModal === "filter" && (
        <FilterModal trips={trips} filteredTrips={filteredTrips} searchText={searchText}
          filterSettings={filterSettings} onSearchChange={setSearchText}
          onFilterChange={setFilterSettings} onSelectTrip={onSelectTrip} onClose={close} />
      )}
      {activeModal === "settings" && <SettingsModal onClose={close} />}
      {activeModal === "reel" && currentTrip && <StoryReelModal trip={currentTrip} onClose={close} />}

      {/* Spacer for fixed header */}
      <div style={{ height: 64 }} />
    </>
  );
}
