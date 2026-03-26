"use client";

import React from "react";
import TripViewerLeaflet from "./TripViewerLeaflet";

type Step = {
  id: string;
  lat: number;
  lng: number;
  timestamp: string;
  note?: string;
  image_url?: string;
};

type TripViewerProps = {
  steps: Step[];
  onMapClick: (coords: { lat: number; lng: number }) => void;
  tripId?: string;
  token?: string;
  onStepsChange?: (updatedSteps: Step[]) => void;
};

const COLORS = {
  primary: "#667eea",
  primaryDark: "#764ba2",
  gray: "#F5F5F7",
  darkGray: "#1D1D1D",
  lightText: "#86868B",
};

const TripViewerComponent: React.FC<TripViewerProps> = ({ steps, onMapClick, tripId, token, onStepsChange }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        background: COLORS.gray,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      
      <TripViewerLeaflet 
        steps={steps} 
        onMapClick={onMapClick}
        tripId={tripId || ""}
        token={token || ""}
        onStepsChange={onStepsChange}
      />
    </div>
  );
};

export const TripViewer = React.memo(TripViewerComponent);
