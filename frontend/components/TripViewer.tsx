"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useColors } from "@/lib/theme";

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
  fitTrigger?: number;
};

// Leaflet depends on the browser `window`; load it client-side only
const TripViewerLeaflet = dynamic(() => import("./TripViewerLeaflet"), { ssr: false });

const TripViewerComponent: React.FC<TripViewerProps> = ({ steps, onMapClick, tripId, token, onStepsChange, fitTrigger }) => {
  const COLORS = useColors();
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        background: COLORS.mapBg,
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
        fitTrigger={fitTrigger}
      />
    </div>
  );
};

export const TripViewer = React.memo(TripViewerComponent);
