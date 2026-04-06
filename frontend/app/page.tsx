"use client";

import React, { useEffect } from "react";
import { useColors } from "@/lib/theme";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TripToolbar } from "@/components/TripToolbar";
import { StepModal } from "@/components/StepModal";
import { TripSeparation } from "@/components/TripSeparation";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { StatsPanel } from "@/components/StatsPanel";
import { PhotoGalleryModal } from "@/components/PhotoGalleryModal";
import { MapSection } from "@/components/MapSection";
import { TripProvider, useTripContext } from "@/providers/TripProvider";
import { session, api } from "@/lib/api";

export default function Home() {
  return (
    <ProtectedRoute>
      <TripProvider>
        <HomeContent />
      </TripProvider>
    </ProtectedRoute>
  );
}

function HomeContent() {
  const COLORS = useColors();
  const {
    loading, currentTrip, trips,
    setUser, setTrips, setCurrentTrip, setSteps, setLoading, setCenterLocation,
    handleCreateTripFromToolbar, handleUpdateTrip, handleDeleteTrip, handleSelectTrip, handleLogout,
    handleSplitTrip, handleCancelStep, handleAddStep,
    steps, showStepModal, selectedMapCoords,
    showRecommendations, recommendationLocation, setShowRecommendations,
  } = useTripContext();

  // Load user + trips on mount
  useEffect(() => {
    const token = session.getToken();
    const user = session.getUser();
    if (!token) return;

    setUser(user);

    const loadTrips = async () => {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

      try {
        const trips = await api.getTrips(token);

        if (!trips || trips.length === 0) {
          setTrips([]);
          setCurrentTrip(null);
          setSteps([]);
          return;
        }

        setTrips(trips);
        const latestTrip = trips[trips.length - 1];

        try {
          const tripSteps = await api.getSteps(token, latestTrip.id);
          setSteps(tripSteps);
          setCurrentTrip({ ...latestTrip, steps: tripSteps });

          // Fly to last visited location
          if (tripSteps.length > 0) {
            const last = tripSteps[tripSteps.length - 1];
            setCenterLocation({ lat: last.lat, lng: last.lng, zoom: 10 });
          } else if (latestTrip.title) {
            try {
              const geo = await fetch(
                `${API_BASE}/geocoding/geocode?location=${encodeURIComponent(latestTrip.title)}`
              ).then((r) => r.json());
              if (geo?.latitude && geo?.longitude) {
                setCenterLocation({ lat: geo.latitude, lng: geo.longitude, zoom: 6 });
              }
            } catch { /* non-critical */ }
          }
        } catch {
          setSteps([]);
          setCurrentTrip(latestTrip);
        }
      } catch (err) {
        console.error("[Home] Failed to load trips:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{
        width: "100vw", height: "100vh", background: COLORS.background,
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          border: `3px solid ${COLORS.border}`,
          borderTopColor: COLORS.primary, borderRightColor: COLORS.secondary,
          marginBottom: 24, animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: 17, fontWeight: 400, letterSpacing: "-0.4px", color: COLORS.textSecondary, margin: 0 }}>
          Loading your adventures...
        </p>
      </div>
    );
  }

  if (!currentTrip) {
    return <WelcomeScreen />;
  }

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", background: COLORS.background }}>
      <style>{`@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } } .slide-down { animation: slideDown 0.3s ease-out; }`}</style>

      <TripToolbar
        trips={trips}
        currentTrip={currentTrip}
        onSelectTrip={handleSelectTrip}
        onCreateTrip={handleCreateTripFromToolbar}
        onDeleteTrip={handleDeleteTrip}
        onUpdateTrip={handleUpdateTrip}
        onLogout={handleLogout}
      />

      <MapSection />

      <TripSeparation
        steps={steps}
        tripTitle={currentTrip?.title || ""}
        onSplitTrip={handleSplitTrip}
      />

      <StatsPanel />

      <PhotoGalleryModal />

      {showRecommendations && recommendationLocation && (
        <RecommendationPanel
          currentLocation={recommendationLocation}
          onClose={() => setShowRecommendations(false)}
        />
      )}

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
