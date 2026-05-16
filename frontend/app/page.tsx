"use client";

import React from "react";
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
import { TripProvider } from "@/providers/TripProvider";
import { useAuth } from "@/hooks/useAuth";
import { useTrips } from "@/hooks/useTrips";
import { useCurrentTrip } from "@/hooks/useCurrentTrip";
import { useStepEditor } from "@/hooks/useStepEditor";
import { useTripUI } from "@/hooks/useTripUI";

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
  const { handleLogout } = useAuth();
  const {
    trips, loading,
    handleCreateTripFromToolbar, handleSelectTrip, handleDeleteTrip, handleSplitTrip,
  } = useTrips();
  const { currentTrip, steps, handleUpdateTrip } = useCurrentTrip();
  const { showStepModal, selectedMapCoords, handleCancelStep, handleAddStep } = useStepEditor();
  const { showRecommendations, setShowRecommendations, recommendationLocation } = useTripUI();

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
