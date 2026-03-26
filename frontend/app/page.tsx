"use client";

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TripViewer } from "@/components/TripViewer";
import { StepModal } from "@/components/StepModal";
import { TripToolbar } from "@/components/TripToolbar";
import { TripStatistics } from "@/components/TripStatistics";
import { EnhancedStatistics } from "@/components/EnhancedStatistics";
import { TripSeparation } from "@/components/TripSeparation";
import { PhotoGallery } from "@/components/PhotoGallery";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeToggle } from "@/components/ThemeToggle";
import { session, api } from "@/lib/api";
import { calculateTotalDistance } from "@/lib/distance";

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

export default function Home() {
  const router = useRouter();
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

  return (
    <ProtectedRoute>
      <HomeContent
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
      />
    </ProtectedRoute>
  );
}

function HomeContent({
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
    console.log("[Home] User loaded:", user?.name || user?.email);

    // Load trips
    const loadTrips = async () => {
      try {
        console.log("[Home] Loading trips with token:", token ? `${token.substring(0, 20)}...` : "NO TOKEN");
        const trips = await api.getTrips(token);
        console.log("[Home] Trips loaded successfully:", trips.length, "trips", trips);
        
        if (!trips || trips.length === 0) {
          console.warn("[Home] No trips returned from API");
          setTrips([]);
          setCurrentTrip(null);
          setSteps([]);
          return;
        }

        setTrips(trips);
        // Load the LATEST trip (last in array), not the first one
        const latestTrip = trips[trips.length - 1];
        console.log("[Home] Setting latest trip as current:", latestTrip.id);
        
        try {
          const tripSteps = await api.getSteps(token, latestTrip.id);
          console.log("[Home] Steps loaded:", tripSteps.length, tripSteps);
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
      console.log("Creating trip with title:", newTripTitle.trim());
      console.log("Token:", token ? `${token.substring(0, 20)}...` : "NO TOKEN");
      const trip = await api.createTrip(token, newTripTitle.trim());
      console.log("Trip created:", trip);
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

  const handleAddStep = async (note: string, imageUrl?: string, locationName?: string) => {
    console.log("[HandleAddStep] Starting - tripId:", currentTrip?.id, "coords:", selectedMapCoords);
    
    if (!currentTrip || !selectedMapCoords) {
      console.error("[HandleAddStep] Missing trip or coordinates", {
        currentTrip: currentTrip?.id,
        selectedMapCoords
      });
      return;
    }
    const token = session.getToken();
    if (!token) {
      console.error("[HandleAddStep] No token");
      router.push("/signup");
      return;
    }

    try {
      console.log("[HandleAddStep] Calling api.createStep with:", {
        tripId: currentTrip.id,
        lat: selectedMapCoords.lat,
        lng: selectedMapCoords.lng,
        note,
        imageUrl,
        locationName
      });
      
      const step = await api.createStep(
        token,
        currentTrip.id,
        selectedMapCoords.lat,
        selectedMapCoords.lng,
        note,
        imageUrl,
        locationName
      );
      
      console.log("[HandleAddStep] Step created successfully:", step);
      
      const updatedSteps = [...steps, step];
      console.log("[HandleAddStep] Updated steps:", updatedSteps);
      
      setSteps(updatedSteps);
      // Update currentTrip to keep steps in sync
      setCurrentTrip({ ...currentTrip, steps: updatedSteps });
      setShowStepModal(false);
      setSelectedMapCoords(null);
      
      console.log("[HandleAddStep] Step added successfully!");
    } catch (err: any) {
      console.error("[HandleAddStep] Failed to add step - FULL ERROR:", {
        message: err.message,
        detail: err.detail,
        code: err.code,
        status: err.status,
        fullError: JSON.stringify(err)
      });
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

  if (loading) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 50, height: 50, borderRadius: "50%", border: "3px solid rgba(255, 255, 255, 0.3)", borderTopColor: "white", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!currentTrip) {
    return (
      <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)` }}>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .fade-in { animation: fadeIn 0.6s ease-out; }
          .slide-up { animation: slideUp 0.6s ease-out; }
        `}</style>

        {/* Header */}
        <div style={{ padding: "20px 24px", background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(10px)", borderBottom: `1px solid rgba(255, 255, 255, 0.2)`, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 28 }}>🗺️</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, margin: 0 }}>Polarsteps</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ThemeToggle />
            <button onClick={handleLogout} style={{ padding: "8px 16px", background: "transparent", color: COLORS.error, border: `1px solid ${COLORS.error}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ padding: "40px 24px", maxWidth: 600, margin: "0 auto" }}>
          {/* Welcome Section */}
          <div style={{ marginBottom: 40, textAlign: "center", animation: "slideUp 0.6s ease-out" }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: "white", marginBottom: 8, margin: 0 }}>
              Welcome back, {user?.name || "Traveler"}!
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255, 255, 255, 0.9)", marginBottom: 30, margin: 0, paddingTop: 8 }}>
              Create your first adventure by starting a new trip
            </p>
          </div>

          {/* Create Trip Card */}
          <div style={{ background: "rgba(255, 255, 255, 0.95)", borderRadius: 20, padding: 28, boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)", animation: "fadeIn 0.8s ease-out", marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 12, letterSpacing: "0.3px", textTransform: "uppercase" }}>Trip Name</label>
            <input type="text" placeholder="e.g., European Summer, Japan 2026" value={newTripTitle} onChange={(e) => setNewTripTitle(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleCreateTrip()} style={{ width: "100%", padding: "14px 16px", border: `2px solid #e2e8f0`, borderRadius: 12, fontSize: 16, boxSizing: "border-box", background: "#F5F5F7", color: COLORS.text, marginBottom: 16, fontFamily: "inherit", transition: "all 0.2s", outline: "none" }} onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.primary; e.currentTarget.style.background = "#F5F5F7"; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(102, 126, 234, 0.1)`; }} onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#F5F5F7"; e.currentTarget.style.boxShadow = "none"; }} />
            <button onClick={handleCreateTrip} style={{ width: "100%", padding: "14px 16px", background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`, color: "white", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)" }} onMouseOver={(e) => { e.currentTarget.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.4)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseOut={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              Create Trip
            </button>
          </div>

          {/* Info Card */}
          <div style={{ padding: 24, background: "rgba(255, 255, 255, 0.95)", borderRadius: 16, textAlign: "center", boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)" }}>
            <div style={{ fontSize: 16, marginBottom: 8 }}>✨</div>
            <p style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 1.6, margin: 0 }}>
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
    startDate: string
  ) => {
    const token = session.getToken();
    if (!token) return;

    try {
      const trip = await api.createTrip(
        token,
        title,
        description,
        startDate
      );
      setTrips([...trips, trip]);
      setCurrentTrip(trip);
      setSteps([]);
    } catch (err: any) {
      console.error("Failed to create trip:", err);
      throw err;
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    const token = session.getToken();
    if (!token) return;

    try {
      console.log("[DELETE] Starting delete for trip:", tripId);
      const deleteResult = await api.deleteTrip(token, tripId);
      console.log("[DELETE] Trip deleted successfully:", deleteResult);
      
      // Remove trip from list
      const updatedTrips = trips.filter((t: any) => t.id !== tripId);
      setTrips(updatedTrips);
      
      // If deleted trip was current, select next one or show create screen
      if (currentTrip?.id === tripId) {
        if (updatedTrips.length > 0) {
          try {
            console.log("[DELETE] Loading next trip:", updatedTrips[0].id);
            const nextTrip = await api.getTrip(token, updatedTrips[0].id);
            setCurrentTrip(nextTrip);
            setSteps(nextTrip.steps || []);
            console.log("[DELETE] Loaded next trip successfully");
          } catch (nextErr: any) {
            console.error("[DELETE] Error loading next trip:", nextErr);
            // If loading next trip fails, try other trips
            if (updatedTrips.length > 1) {
              try {
                const fallbackTrip = await api.getTrip(token, updatedTrips[1].id);
                setCurrentTrip(fallbackTrip);
                setSteps(fallbackTrip.steps || []);
                console.log("[DELETE] Loaded fallback trip");
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
          console.log("[DELETE] No more trips, showing create screen");
        }
      }
    } catch (err: any) {
      console.error("[DELETE] Full error:", err);
      const errorMsg = err?.message || err?.toString() || "Unknown error";
      console.error("[DELETE] Error message:", errorMsg);
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
    <div style={{ position: "relative", width: "100vw", height: "100vh", background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)` }}>
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
        onLogout={handleLogout}
      />

      {/* Map Container */}
      <div style={{ position: "absolute", top: "70px", left: 0, right: steps.length > 0 ? "420px" : 0, bottom: 0, zIndex: 0, overflow: "hidden" }}>
        <TripViewer 
          steps={steps} 
          onMapClick={handleMapClick}
          tripId={currentTrip?.id}
          token={session.getToken() || undefined}
          onStepsChange={handleStepsChange}
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
          style={{
            position: "fixed",
            top: 90,
            right: 16,
            left: "auto",
            bottom: 24,
            width: 380,
            maxWidth: "calc(100vw - 48px)",
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.2)",
            backdropFilter: "blur(10px)",
            zIndex: 70,
            pointerEvents: "auto",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {/* Ask Questions Button - Top of Panel */}
          <button
            onClick={() => {
              // Use first step location
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
              marginBottom: 16,
              padding: "12px 16px",
              background: COLORS.secondary,
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "1";
            }}
          >
            ❓ Ask Questions
          </button>

          <h3 style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, margin: "0 0 16px 0" }}>
            📊 Trip Statistics
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

          <div style={{ marginTop: 16, marginBottom: 16, borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, margin: "0 0 16px 0" }}>
              📈 Detailed Analytics
            </h3>
            <EnhancedStatistics
              steps={steps}
              totalDistance={totalDistanceMemo}
              tripDurationDays={tripDurationDaysMemo}
              totalDaysTravelled={totalDaysTravelledMemo}
            />
          </div>

          {/* Photo Gallery Button */}
          {steps.some((s: any) => s.image_url) && (
            <button
              onClick={() => setShowPhotoGallery(true)}
              style={{
                width: "100%",
                marginTop: 16,
                padding: "12px 16px",
                background: COLORS.primary,
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "1";
              }}
            >
              📷 View Photo Gallery
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
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 500,
            padding: 20,
            overflowY: "auto",
          }}
          onClick={() => setShowPhotoGallery(false)}
        >
          <div
            style={{
              background: COLORS.surface,
              borderRadius: 16,
              padding: 20,
              maxWidth: "95vw",
              maxHeight: "95vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, margin: 0 }}>
                📷 {currentTrip?.title} - Photo Gallery
              </h2>
              <button
                onClick={() => setShowPhotoGallery(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: COLORS.textSecondary,
                }}
              >
                ✕
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
          onClose={() => setShowStepModal(false)}
          onSubmit={handleAddStep}
        />
      )}
    </div>
  );
}

// Handler for splitting trips
async function handleSplitTrip(
  newTripTitle: string,
  stepsToMove: any[]
): Promise<void> {
  // This would be implemented in the HomeContent component
  // For now, it's a placeholder that would call the API
  console.log("Split trip:", newTripTitle, stepsToMove);
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
