"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useColors } from "@/lib/theme";
import { TripViewer } from "@/components/TripViewer";
import { StepModal } from "@/components/StepModal";
import { TripToolbar } from "@/components/TripToolbar";
import { TripStatistics } from "@/components/TripStatistics";
import { EnhancedStatistics } from "@/components/EnhancedStatistics";
import { TripSeparation } from "@/components/TripSeparation";
import { PhotoGallery } from "@/components/PhotoGallery";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import { session, api } from "@/lib/api";
import { calculateTotalDistance } from "@/lib/distance";

export default function Home() {
  const router = useRouter();
  const COLORS = useColors();
  const [user, setUser] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [currentTrip, setCurrentTrip] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTripTitle, setNewTripTitle] = useState("");
  const [showStepModal, setShowStepModal] = useState(false);
  const [selectedMapCoords, setSelectedMapCoords] = useState<any>(null);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendationLocation, setRecommendationLocation] = useState<any>(null);
  const [mapFitCounter, setMapFitCounter] = useState(0);

  return (
    <ProtectedRoute>
      <HomeContent
        COLORS={COLORS}
        router={router}
        user={user}
        setUser={setUser}
        trips={trips}
        setTrips={setTrips}
        currentTrip={currentTrip}
        setCurrentTrip={setCurrentTrip}
        steps={steps}
        setSteps={setSteps}
        loading={loading}
        setLoading={setLoading}
        newTripTitle={newTripTitle}
        setNewTripTitle={setNewTripTitle}
        showStepModal={showStepModal}
        setShowStepModal={setShowStepModal}
        selectedMapCoords={selectedMapCoords}
        setSelectedMapCoords={setSelectedMapCoords}
        showPhotoGallery={showPhotoGallery}
        setShowPhotoGallery={setShowPhotoGallery}
        showRecommendations={showRecommendations}
        setShowRecommendations={setShowRecommendations}
        recommendationLocation={recommendationLocation}
        setRecommendationLocation={setRecommendationLocation}
        mapFitCounter={mapFitCounter}
        setMapFitCounter={setMapFitCounter}
      />
    </ProtectedRoute>
  );
}

function HomeContent({
  COLORS,
  router,
  user,
  setUser,
  trips,
  setTrips,
  currentTrip,
  setCurrentTrip,
  steps,
  setSteps,
  loading,
  setLoading,
  newTripTitle,
  setNewTripTitle,
  showStepModal,
  setShowStepModal,
  selectedMapCoords,
  setSelectedMapCoords,
  showPhotoGallery,
  setShowPhotoGallery,
  showRecommendations,
  setShowRecommendations,
  recommendationLocation,
  setRecommendationLocation,
  mapFitCounter,
  setMapFitCounter,
}: any) {

  // Check authentication
  useEffect(() => {
    const token = session.getToken();
    const user = session.getUser();

    if (!token) {
      router.push("/signup");
      return;
    }

    setUser(user);

    // Load trips
    const loadTrips = async () => {
      try {
        const trips = await api.getTrips(token);
        
        if (!trips || trips.length === 0) {
          setTrips([]);
          setCurrentTrip(null);
          setSteps([]);
          return;
        }

        setTrips(trips);
        // Load the LATEST trip (last in array), not the first one
        const latestTrip = trips[trips.length - 1];

        try {
          const tripSteps = await api.getSteps(token, latestTrip.id);
          // Set both steps and currentTrip with steps included
          setSteps(tripSteps);
          setCurrentTrip({ ...latestTrip, steps: tripSteps });
        } catch (stepsErr: any) {
          console.error("[Home] Failed to load steps, but trip exists:", stepsErr);
          // Set trip without steps if loading steps fails
          setSteps([]);
          setCurrentTrip(latestTrip);
        }
      } catch (err: any) {
        console.error("[Home] Failed to load trips - FULL ERROR:", {
          message: err.message,
          detail: err.detail,
          code: err.code,
          status: err.status,
          fullError: JSON.stringify(err)
        });
        // Don't clear trips on error - just log it
        console.error("Could not load trips from server");
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, [router]);

  // Memoize calculated statistics
  const totalDaysTravelledMemo = React.useMemo(() => calculateTotalDays(steps), [steps]);
  const tripDurationDaysMemo = React.useMemo(() => calculateTripDuration(currentTrip), [currentTrip]);
  const totalDaysAtDestinationsMemo = React.useMemo(() => calculateDaysAtDestinations(steps), [steps]);
  const averageDaysPerLocationMemo = React.useMemo(() => calculateAverageDays(steps), [steps]);
  const totalDistanceMemo = React.useMemo(() => calculateTotalDistance(steps), [steps]);

  const handleCreateTrip = async () => {
    if (!newTripTitle.trim()) return;
    const token = session.getToken();
    if (!token) {
      alert("No authentication token - please log in again");
      return;
    }

    try {
      const trip = await api.createTrip(token, newTripTitle.trim());
      setTrips([...trips, trip]);
      setCurrentTrip(trip);
      setSteps([]);
      setNewTripTitle("");
    } catch (err: any) {
      console.error("Failed to create trip - Full error:", err);
      const errorMsg = err.message || err.detail || JSON.stringify(err);
      alert(`Failed to create trip:\n${errorMsg}`);
    }
  };

  const handleMapClick = (coords: { lat: number; lng: number }) => {
    setSelectedMapCoords(coords);
    setShowStepModal(true);
  };

  const handleCancelStep = () => {
    setShowStepModal(false);
    setSelectedMapCoords(null);
    const token = session.getToken();

    // Refresh steps so markers stay visible without a full page reload
    if (token && currentTrip?.id) {
      api
        .getSteps(token, currentTrip.id)
        .then((freshSteps) => {
          setSteps(freshSteps);
          setCurrentTrip({ ...currentTrip, steps: freshSteps });
        })
        .catch((err) => {
          console.error("Failed to refresh steps after cancel:", err);
          // Fallback: force rerender with existing steps
          setSteps([...steps]);
          setCurrentTrip(currentTrip ? { ...currentTrip, steps: [...steps] } : currentTrip);
        })
        .finally(() => {
          setMapFitCounter((c: number) => c + 1);
        });
    } else {
      // No token/trip; still force rerender so markers remain
      setSteps([...steps]);
      setCurrentTrip(currentTrip ? { ...currentTrip, steps: [...steps] } : currentTrip);
      setMapFitCounter((c: number) => c + 1);
    }
  };

  const handleAddStep = async (note: string, imageUrl?: string, locationName?: string) => {
    if (!currentTrip || !selectedMapCoords) {
      console.error("Missing trip or coordinates");
      return;
    }
    const token = session.getToken();
    if (!token) {
      router.push("/signup");
      return;
    }

    try {
      const step = await api.createStep(
        token,
        currentTrip.id,
        selectedMapCoords.lat,
        selectedMapCoords.lng,
        note,
        imageUrl,
        locationName
      );

      const updatedSteps = [...steps, step];
      setSteps(updatedSteps);
      // Update currentTrip to keep steps in sync
      setCurrentTrip({ ...currentTrip, steps: updatedSteps });
      setShowStepModal(false);
      setSelectedMapCoords(null);
    } catch (err: any) {
      console.error("Failed to add step:", err);
      // Error will be shown in StepModal
      throw err;
    }
  };

  const handleStepsChange = (updatedSteps: any[]) => {
    setSteps(updatedSteps);
    // Keep currentTrip in sync with steps
    if (currentTrip) {
      setCurrentTrip({ ...currentTrip, steps: updatedSteps });
    }
  };

  const handleLogout = () => {
    session.logout();
    router.push("/signup");
  };

  const handleSplitTrip = async (newTripTitle: string, stepsToMove: any[]): Promise<void> => {
    const token = session.getToken();
    if (!token || !currentTrip) return;

    const stepIds = stepsToMove.map((s: any) => s.id);
    const result = await api.splitTrip(token, currentTrip.id, newTripTitle, stepIds);

    // Reload trips list
    const updatedTrips = await api.getTrips(token);
    setTrips(updatedTrips);

    // Stay on the original trip with updated steps
    const originalSteps = await api.getSteps(token, result.original_trip.id);
    setSteps(originalSteps);
    setCurrentTrip({ ...result.original_trip, steps: originalSteps });
  };

  if (loading) {
    return (
      <div style={{
        width: "100vw",
        height: "100vh",
        background: COLORS.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column"
      }}>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes fadeInLoadingText {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .loading-spinner {
            animation: spin 1s linear infinite;
          }
          .loading-text {
            animation: fadeInLoadingText 0.8s ease-out 0.3s both;
          }
        `}</style>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          border: `3px solid ${COLORS.border}`,
          borderTopColor: COLORS.primary,
          borderRightColor: COLORS.secondary,
          marginBottom: 24,
          animation: "spin 0.8s linear infinite",
        }} />
        <p style={{
          fontSize: 17,
          fontWeight: 400,
          letterSpacing: "-0.4px",
          color: COLORS.textSecondary,
          margin: 0,
          textAlign: "center",
        }}>
          Loading your adventures...
        </p>
      </div>
    );
  }

  if (!currentTrip) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.background }}>
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scaleInGently {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
          }
          .welcome-header {
            animation: fadeInUp 0.6s ease-out;
          }
          .create-card {
            animation: scaleInGently 0.7s ease-out 0.1s both;
          }
          .info-card {
            animation: fadeInUp 0.6s ease-out 0.3s both;
          }
        `}</style>

        {/* Header with Glass Morphism */}
        <div style={{
          padding: "16px 24px",
          background: `${COLORS.cardBg}`,
          backdropFilter: "saturate(180%) blur(20px)",
          borderBottom: `1px solid ${COLORS.separator}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: `0 2px 12px ${COLORS.shadowColor}`
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 28, lineHeight: 1 }}>🗺️</div>
            <h1 style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "-0.4px",
              color: COLORS.text,
              margin: 0
            }}>
              Pollarsteps
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={handleLogout}
              style={{
                padding: "10px 16px",
                background: "transparent",
                color: COLORS.error,
                border: `1px solid ${COLORS.error}`,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "-0.3px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = COLORS.error;
                e.currentTarget.style.color = "white";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = COLORS.error;
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          padding: "60px 24px 40px",
          maxWidth: 540,
          margin: "0 auto"
        }}>
          {/* Welcome Section */}
          <div style={{
            marginBottom: 56,
            textAlign: "center"
          }} className="welcome-header">
            <h2 style={{
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: "-0.5px",
              color: COLORS.text,
              margin: "0 0 12px 0",
              lineHeight: 1.2
            }}>
              Welcome back, {user?.name || "Traveller"}!
            </h2>
            <p style={{
              fontSize: 17,
              fontWeight: 400,
              letterSpacing: "-0.4px",
              color: COLORS.textSecondary,
              margin: 0,
              lineHeight: 1.5
            }}>
              Create your first adventure by starting a new trip
            </p>
          </div>

          {/* Create Trip Card */}
          <div style={{
            background: COLORS.surfaceElevated,
            borderRadius: 24,
            padding: 32,
            marginBottom: 28,
            boxShadow: `0 8px 28px ${COLORS.shadowColor}`
          }} className="create-card">
            <label style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.5px",
              color: COLORS.textSecondary,
              marginBottom: 16,
              textTransform: "uppercase"
            }}>
              Trip Name
            </label>
            <input
              type="text"
              placeholder="e.g., European Summer, Japan 2026"
              value={newTripTitle}
              onChange={(e) => setNewTripTitle(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCreateTrip()}
              style={{
                width: "100%",
                padding: "14px 16px",
                border: `1px solid ${COLORS.separator}`,
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 400,
                boxSizing: "border-box",
                background: COLORS.background,
                color: COLORS.text,
                marginBottom: 20,
                fontFamily: "inherit",
                transition: "all 0.2s ease",
                outline: "none"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.boxShadow = `0 0 0 3px rgba(91, 108, 240, 0.1)`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = COLORS.separator;
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              onClick={handleCreateTrip}
              style={{
                width: "100%",
                padding: "14px 16px",
                background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                color: "white",
                border: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "-0.3px",
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: `0 4px 16px rgba(91, 108, 240, 0.25)`
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = `0 8px 24px rgba(91, 108, 240, 0.35)`;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = `0 4px 16px rgba(91, 108, 240, 0.25)`;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Create Trip
            </button>
          </div>

          {/* Info Card */}
          <div style={{
            padding: 28,
            background: COLORS.surfaceElevated,
            borderRadius: 20,
            textAlign: "center",
            boxShadow: `0 4px 12px ${COLORS.shadowColor}`,
            borderTop: `1px solid ${COLORS.separator}`
          }} className="info-card">
            <p style={{
              fontSize: 15,
              fontWeight: 400,
              letterSpacing: "-0.3px",
              color: COLORS.textSecondary,
              lineHeight: 1.6,
              margin: 0
            }}>
              Start exploring the world. Pin locations on your map, add stories and memories to each place you visit.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateTripFromToolbar = async (
    title: string,
    description: string,
    startDate: string,
    endDate?: string
  ) => {
    const token = session.getToken();
    if (!token) {
      alert("Please sign in to create a trip.");
      window.location.href = "/signin";
      return;
    }

    try {
      const trip = await api.createTrip(token, title, description, startDate, endDate);
      setTrips([...trips, trip]);
      setCurrentTrip(trip);
      setSteps([]);
    } catch (err: any) {
      console.error("Failed to create trip:", err);
      throw err;
    }
  };

  const handleUpdateTrip = (updatedTrip: any) => {
    setTrips((prev: any[]) => prev.map((t: any) => t.id === updatedTrip.id ? { ...t, ...updatedTrip } : t));
    if (currentTrip?.id === updatedTrip.id) {
      setCurrentTrip((prev: any) => ({ ...prev, ...updatedTrip }));
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    const token = session.getToken();
    if (!token) return;

    try {
      const deleteResult = await api.deleteTrip(token, tripId);

      // Remove trip from list
      const updatedTrips = trips.filter((t: any) => t.id !== tripId);
      setTrips(updatedTrips);

      // If deleted trip was current, select next one or show create screen
      if (currentTrip?.id === tripId) {
        if (updatedTrips.length > 0) {
          try {
            const nextTrip = await api.getTrip(token, updatedTrips[0].id);
            setCurrentTrip(nextTrip);
            setSteps(nextTrip.steps || []);
          } catch (nextErr: any) {
            console.error("Error loading next trip:", nextErr);
            // If loading next trip fails, try other trips
            if (updatedTrips.length > 1) {
              try {
                const fallbackTrip = await api.getTrip(token, updatedTrips[1].id);
                setCurrentTrip(fallbackTrip);
                setSteps(fallbackTrip.steps || []);
              } catch (fallbackErr) {
                // Still failed, just use first trip data from list
                setCurrentTrip(updatedTrips[0]);
                setSteps([]);
              }
            } else {
              // Only one trip failed to load, use its data from the list
              setCurrentTrip(updatedTrips[0]);
              setSteps([]);
            }
          }
        } else {
          setCurrentTrip(null);
          setSteps([]);
        }
      }
    } catch (err: any) {
      console.error("Delete failed:", err);
      const errorMsg = err?.message || err?.toString() || "Unknown error";
      alert(`Delete failed: ${errorMsg}`);
      throw err;
    }
  };

  const handleSelectTrip = async (trip: any) => {
    setCurrentTrip(trip);
    const token = session.getToken();
    if (token) {
      try {
        const tripSteps = await api.getSteps(token, trip.id);
        setSteps(tripSteps);
        // Keep currentTrip in sync with steps
        setCurrentTrip({ ...trip, steps: tripSteps });
      } catch (err) {
        console.error("Failed to load trip steps:", err);
        setSteps([]);
        setCurrentTrip({ ...trip, steps: [] });
      }
    }
  };

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", background: COLORS.background }}>
      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .slide-down { animation: slideDown 0.3s ease-out; }
      `}</style>

      {/* Toolbar */}
      <TripToolbar
        trips={trips}
        currentTrip={currentTrip}
        onSelectTrip={handleSelectTrip}
        onCreateTrip={handleCreateTripFromToolbar}
        onDeleteTrip={handleDeleteTrip}
        onUpdateTrip={handleUpdateTrip}
        onLogout={handleLogout}
      />

      {/* Map Container */}
      <div className="map-container" style={{ position: "absolute", top: "70px", left: 0, right: steps.length > 0 ? "420px" : 0, bottom: 0, zIndex: 0, overflow: "hidden" }}>
        <TripViewer
          steps={steps}
          onMapClick={handleMapClick}
          tripId={currentTrip?.id}
          token={session.getToken() || undefined}
          onStepsChange={handleStepsChange}
          fitTrigger={mapFitCounter}
        />
      </div>

      {/* Trip Separation Panel */}
      <TripSeparation
        steps={steps}
        tripTitle={currentTrip?.title || ""}
        onSplitTrip={handleSplitTrip}
      />

      {/* Trip Statistics Panel */}
      {currentTrip && steps.length > 0 && (
        <div
          className="stats-panel"
          style={{
            position: "fixed",
            top: 90,
            right: 16,
            left: "auto",
            bottom: 24,
            width: 380,
            maxWidth: "calc(100vw - 48px)",
            background: COLORS.cardBg,
            borderRadius: 20,
            padding: 24,
            boxShadow: `0 12px 40px ${COLORS.shadowHeavy}`,
            backdropFilter: "saturate(180%) blur(20px)",
            zIndex: 70,
            pointerEvents: "auto",
            overflowY: "auto",
            overflowX: "hidden",
            borderTop: `1px solid ${COLORS.separator}`
          }}
        >
          {/* Ask Questions Button - Top of Panel */}
          <button
            onClick={() => {
              const firstStep = steps[0];
              if (firstStep && firstStep.lat && firstStep.lng) {
                setRecommendationLocation({
                  name: firstStep.location_name || "Current Location",
                  lat: firstStep.lat,
                  lng: firstStep.lng,
                });
                setShowRecommendations(true);
              } else {
                alert("Please add at least one location to your trip first");
              }
            }}
            style={{
              width: "100%",
              marginBottom: 20,
              padding: "12px 16px",
              background: `linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.secondary}dd 100%)`,
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "-0.3px",
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: `0 4px 12px rgba(6, 182, 212, 0.2)`
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = `0 6px 16px rgba(6, 182, 212, 0.3)`;
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = `0 4px 12px rgba(6, 182, 212, 0.2)`;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Ask Questions
          </button>

          <h3 style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.5px",
            color: COLORS.textSecondary,
            margin: "0 0 16px 0",
            textTransform: "uppercase"
          }}>
            Trip Statistics
          </h3>
          <TripStatistics
            trip={currentTrip}
            totalDaysTravelled={totalDaysTravelledMemo}
            tripDurationDays={tripDurationDaysMemo}
            totalDaysAtDestinations={totalDaysAtDestinationsMemo}
            locationCount={steps.length}
            averageDaysPerLocation={averageDaysPerLocationMemo}
            totalDistance={totalDistanceMemo}
          />

          <div style={{
            marginTop: 20,
            marginBottom: 20,
            borderTop: `1px solid ${COLORS.separator}`,
            paddingTop: 20
          }}>
            <h3 style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.5px",
              color: COLORS.textSecondary,
              margin: "0 0 16px 0",
              textTransform: "uppercase"
            }}>
              Detailed Analytics
            </h3>
            <EnhancedStatistics
              steps={steps}
              totalDistance={totalDistanceMemo}
              tripDurationDays={tripDurationDaysMemo}
              totalDaysTravelled={totalDaysTravelledMemo}
            />
          </div>

          {/* Step Timeline */}
          {steps.length > 0 && (
            <div style={{ marginTop: 20, borderTop: `1px solid ${COLORS.separator}`, paddingTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.5px", color: COLORS.textSecondary, margin: "0 0 12px 0", textTransform: "uppercase" }}>
                Timeline ({steps.length} stop{steps.length !== 1 ? "s" : ""})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {steps.map((step: any, i: number) => (
                  <div key={step.id} style={{ display: "flex", gap: 12, position: "relative" }}>
                    {/* Vertical line connector */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: "50%",
                        background: i === 0 ? COLORS.primary : COLORS.secondary,
                        border: `2px solid ${COLORS.surface}`,
                        boxShadow: `0 0 0 2px ${i === 0 ? COLORS.primary : COLORS.secondary}40`,
                        zIndex: 1,
                      }} />
                      {i < steps.length - 1 && (
                        <div style={{ width: 2, flex: 1, background: `${COLORS.textSecondary}30`, marginTop: 2, marginBottom: 2 }} />
                      )}
                    </div>
                    {/* Content */}
                    <div style={{ paddingBottom: 16, flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {step.location_name || `Stop ${i + 1}`}
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                        {new Date(step.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {step.duration_days ? ` · ${step.duration_days}d` : ""}
                      </div>
                      {step.note && (
                        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>
                          {step.note}
                        </div>
                      )}
                      {step.image_url && (
                        <img src={step.image_url} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", marginTop: 6 }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photo Gallery Button */}
          {steps.some((s: any) => s.image_url) && (
            <button
              onClick={() => setShowPhotoGallery(true)}
              style={{
                width: "100%",
                marginTop: 20,
                padding: "12px 16px",
                background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "-0.3px",
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: `0 4px 12px rgba(91, 108, 240, 0.25)`
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = `0 6px 16px rgba(91, 108, 240, 0.35)`;
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = `0 4px 12px rgba(91, 108, 240, 0.25)`;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              View Photo Gallery
            </button>
          )}

        </div>
      )}

      {/* Photo Gallery Modal */}
      {showPhotoGallery && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 500,
            padding: 20,
            overflowY: "auto",
            backdropFilter: "blur(12px)"
          }}
          onClick={() => setShowPhotoGallery(false)}
        >
          <div
            style={{
              background: COLORS.surfaceElevated,
              borderRadius: 24,
              padding: 28,
              maxWidth: "95vw",
              maxHeight: "95vh",
              overflowY: "auto",
              boxShadow: `0 20px 60px ${COLORS.shadowHeavy}`,
              borderTop: `1px solid ${COLORS.separator}`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <h2 style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.4px",
                color: COLORS.text,
                margin: 0
              }}>
                {currentTrip?.title} - Photo Gallery
              </h2>
              <button
                onClick={() => setShowPhotoGallery(false)}
                style={{
                  width: 40,
                  height: 40,
                  background: COLORS.background,
                  border: `1px solid ${COLORS.separator}`,
                  borderRadius: "50%",
                  fontSize: 18,
                  cursor: "pointer",
                  color: COLORS.textSecondary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = COLORS.separator;
                  e.currentTarget.style.color = COLORS.text;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = COLORS.background;
                  e.currentTarget.style.color = COLORS.textSecondary;
                }}
              >
                ×
              </button>
            </div>
            <PhotoGallery steps={steps} title={currentTrip?.title || "Trip"} />
          </div>
        </div>
      )}

      {/* Recommendation Panel */}
      {showRecommendations && recommendationLocation && (
        <RecommendationPanel
          currentLocation={recommendationLocation}
          onClose={() => setShowRecommendations(false)}
        />
      )}

      {/* Step Modal */}
      {showStepModal && selectedMapCoords && (
        <StepModal
          coords={selectedMapCoords}
          onClose={handleCancelStep}
          onSubmit={handleAddStep}
        />
      )}
    </div>
  );
}

// Helper functions for statistics
function calculateTotalDays(steps: any[]): number {
  if (!steps || steps.length < 2) return 0;
  const first = steps[0];
  const last = steps[steps.length - 1];
  if (!first.timestamp || !last.timestamp) return 0;
  const delta = new Date(last.timestamp).getTime() - new Date(first.timestamp).getTime();
  return Math.ceil(delta / (1000 * 60 * 60 * 24)) + 1;
}

function calculateTripDuration(trip: any): number {
  if (!trip || !trip.start_date) return 0;
  if (trip.end_date) {
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    const delta = end.getTime() - start.getTime();
    return Math.ceil(delta / (1000 * 60 * 60 * 24)) + 1;
  }
  const start = new Date(trip.start_date);
  const today = new Date();
  const delta = today.getTime() - start.getTime();
  return Math.ceil(delta / (1000 * 60 * 60 * 24)) + 1;
}

function calculateDaysAtDestinations(steps: any[]): number {
  if (!steps) return 0;
  return steps.reduce((sum, step) => sum + (step.duration_days || 0), 0);
}

function calculateAverageDays(steps: any[]): number {
  if (!steps || steps.length === 0) return 0;
  const total = calculateDaysAtDestinations(steps);
  return total / steps.length;
}
