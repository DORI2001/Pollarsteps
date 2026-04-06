"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { EditStepModal } from "./EditStepModal";
import LocationSearch from "./LocationSearch";
import { RecommendationPanel } from "./RecommendationPanel";
import { api } from "@/lib/api";

type Step = {
  id: string;
  lat: number;
  lng: number;
  timestamp: string;
  note?: string;
  image_url?: string;
  duration_days?: number;
  location_name?: string;
};

type TripViewerLeafletProps = {
  steps: Step[];
  onMapClick: (coords: { lat: number; lng: number }) => void;
  onStepsChange?: (updatedSteps: Step[]) => void;
  tripId: string;
  token: string;
  fitTrigger?: number;
  centerLocation?: { lat: number; lng: number; zoom?: number } | null;
};

// Reverse geocode coordinates to location name
async function getLocationName(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await response.json();
    
    // Extract city, town, or location name
    if (data.address) {
      const { city, town, village, county, state, country } = data.address;
      return `${city || town || village || county || 'Location'}, ${state || country || ''}`.replace(/,\s*$/, '');
    }
    return ''; // Return empty string on fallback, no coordinates
  } catch (error) {
    // Geocoding failed silently
    return ''; // Return empty string on failure, no coordinates
  }
}

function TripViewerLeafletComponent({ steps, onMapClick, onStepsChange, tripId, token, fitTrigger, centerLocation }: TripViewerLeafletProps) {
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<(L.Marker | L.Polyline)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    lat: number;
    lon: number;
  } | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Keep click handler in a ref so the map init effect never needs to re-run
  const onMapClickRef = useRef(onMapClick);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);

  // Handle edit step
  const handleEditStep = async (updates: any) => {
    if (!selectedStep) return;
    if (!token) {
      alert("Please sign in again to edit a location.");
      return;
    }
    setEditLoading(true);
    try {
      await api.updateStep(token, selectedStep.id, updates);
      
      // Update local state
      const updatedSteps = steps.map(s => 
        s.id === selectedStep.id ? { ...s, ...updates } : s
      );
      onStepsChange?.(updatedSteps);
      setShowEditModal(false);
      setSelectedStep(null);
    } catch (err) {
      console.error("Failed to update step:", err);
      throw err;
    } finally {
      setEditLoading(false);
    }
  };

  // Handle delete step
  const handleDeleteStep = async (stepId: string) => {
    if (!token) {
      alert("Please sign in again to delete a location.");
      return;
    }
    if (!confirm("Are you sure you want to delete this location?")) return;
    
    try {
      await api.deleteStep(token, stepId);
      
      // Update local state
      const updatedSteps = steps.filter(s => s.id !== stepId);
      onStepsChange?.(updatedSteps);
      setSelectedStep(null);
    } catch (err) {
      console.error("Failed to delete step:", err);
      alert("Failed to delete location");
    }
  };

  // Handle location search result
  const handleLocationSelected = (location: {
    name: string;
    lat: number;
    lon: number;
  }) => {
    setSelectedLocation(location);

    // Fly map to the searched location
    if (mapRef.current) {
      mapRef.current.flyTo([location.lat, location.lon], 13, { animate: true, duration: 1.0 });
    }
  };

  // Initialize map exactly once — empty deps so it never re-runs
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Defer past the paint cycle so the container is fully in the DOM
    const timer = setTimeout(() => {
      if (mapRef.current) return;

      const container = containerRef.current;
      if (!container) return;

      // Clear any stale Leaflet state from a previous React mount
      if ((container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
      }

      let initialCenter: [number, number] = [20, 0];
      let initialZoom = 4;
      if (steps.length > 0) {
        const lastStep = steps[steps.length - 1];
        initialCenter = [lastStep.lat, lastStep.lng];
        initialZoom = 13;
      }

      const map = L.map(container).setView(initialCenter, initialZoom);

      const tile = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 1,
      }).addTo(map);
      tileLayerRef.current = tile;

      mapRef.current = map;

      // Use the ref so the click handler is always current without re-running this effect
      map.on("click", (e) => {
        onMapClickRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }, 0);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers when steps change
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing layers
    layersRef.current.forEach((layer) => {
      if (mapRef.current) {
        mapRef.current.removeLayer(layer);
      }
    });
    layersRef.current = [];

    if (steps.length === 0) return;

    // Fetch all geocoded location names (regardless of custom names)
    Promise.all(
      steps.map((step) => 
        getLocationName(step.lat, step.lng)
      )
    ).then((geocodedNames) => {
      // Ensure map still exists before adding layers
      if (!mapRef.current) return;
      
      // Add markers for each step with location names
      steps.forEach((step, index) => {
        const geocodedLocationName = geocodedNames[index];
        
        // Determine marker color
        let color = "#007AFF"; // Default blue
        if (index === 0) {
          color = "#34C759"; // Green for first
        } else if (index === steps.length - 1) {
          color = "#FF3B30"; // Red for last
        }

        // Create SVG icon for marker
        const svgIcon = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='14' fill='${encodeURIComponent(color)}' stroke='white' stroke-width='2'/%3E%3Ccircle cx='16' cy='16' r='6' fill='white'/%3E%3C/svg%3E`;

        // Format date nicely
        const date = new Date(step.timestamp);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        // Create enhanced popup content
        const isStart = index === 0;
        const isEnd = index === steps.length - 1;
        
        let popupContent = `
          <div style="font-family: -apple-system, sans-serif; padding: 12px; min-width: 280px; border-radius: 8px; background: #FFFFFF;">
            <div style="font-weight: 700; color: #1D1D1D; font-size: 14px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <span>📍</span>
              <span>${step.location_name || "Place " + (index + 1)}</span>
        `;
        
        if (isStart) {
          popupContent += `<span style="display: inline-block; background: #34C759; color: white; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; margin-left: auto;">START</span>`;
        } else if (isEnd) {
          popupContent += `<span style="display: inline-block; background: #FF3B30; color: white; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; margin-left: auto;">END</span>`;
        }
        
        popupContent += `
            </div>
          <div style="color: #666; font-size: 12px; line-height: 1.8; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>📅</span>
              <span>${dateStr}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>🕐</span>
              <span>${timeStr}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>📍</span>
              <span>Stop ${index + 1} of ${steps.length}</span>
            </div>
      `;
      
      if (step.duration_days && step.duration_days > 0) {
        popupContent += `
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>📌</span>
              <span>${step.duration_days} day${step.duration_days !== 1 ? 's' : ''}</span>
            </div>
        `;
      }
      
      popupContent += `
            <div style="font-size: 11px; color: #666; grid-column: 1 / -1; padding: 6px 0; border-top: 1px solid #E5E5EA; margin-top: 4px; padding-top: 8px;">
              ${step.note ? `<div style="margin-bottom: 8px; padding: 8px; background: #F5F5F7; border-left: 3px solid #667eea; border-radius: 4px;"><strong>Memory:</strong> ${step.note.substring(0, 100)}${step.note.length > 100 ? '...' : ''}</div>` : ''}
              ${geocodedLocationName ? `<div style="display: flex; align-items: center; gap: 4px;">
                <span>🗺️</span>
                <span style="font-weight: 500;">${geocodedLocationName}</span>
              </div>` : ''}
            </div>
      `;
      
      if (step.image_url) {
        popupContent += `
          <div style="margin-top: 8px; border-radius: 4px; overflow: hidden; max-height: 120px;">
            <img src="${step.image_url}" alt="Memory" style="width: 100%; height: auto; max-height: 120px; object-fit: cover;" />
          </div>
        `;
      }
      
      // Add edit/delete buttons
      popupContent += `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #E5E5EA; display: flex; gap: 8px;">
              <button class="edit-step-btn" data-step-id="${step.id}" style="flex: 1; padding: 8px 12px; background: #667eea; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s;">Edit</button>
              <button class="delete-step-btn" data-step-id="${step.id}" style="flex: 1; padding: 8px 12px; background: #FF3B30; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s;">Delete</button>
            </div>
      `;
      
      popupContent += `</div>`;

      const marker = L.marker([step.lat, step.lng], {
        icon: L.icon({
          iconUrl: svgIcon,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        }),
      })
        .bindPopup(popupContent);
      
      if (mapRef.current) {
        marker.addTo(mapRef.current);
      }

      // Attach event listeners for buttons in the popup
      marker.on('popupopen', (e) => {
        try {
          const popup = e.popup;
          if (!popup) return;
          
          // Use requestAnimationFrame to ensure DOM is ready
          requestAnimationFrame(() => {
            const popupEl = popup.getElement?.();
            if (!popupEl) return;
            
            const editBtn = popupEl.querySelector(`.edit-step-btn[data-step-id="${step.id}"]`);
            const deleteBtn = popupEl.querySelector(`.delete-step-btn[data-step-id="${step.id}"]`);

            if (editBtn) {
              editBtn.addEventListener('click', () => {
                setSelectedStep(step);
                setShowEditModal(true);
              }, { once: true });
            }

            if (deleteBtn) {
              deleteBtn.addEventListener('click', () => {
                handleDeleteStep(step.id);
              }, { once: true });
            }
          });
        } catch (err) {
          console.error("Error handling popup open:", err);
        }
      });

      layersRef.current.push(marker);

      // Open popup for the most recent marker (last one)
      if (index === steps.length - 1) {
        marker.openPopup();
      }
      });
    });

      // Draw polyline connecting all steps
      if (steps.length > 1 && mapRef.current) {
        const latlngs = steps.map((step) => [step.lat, step.lng] as [number, number]);
        const polyline = L.polyline(latlngs, {
          color: "#667eea",
          weight: 3,
          opacity: 0.7,
          smoothFactor: 1,
          dashArray: "5, 5",
        }).addTo(mapRef.current);

        layersRef.current.push(polyline);
      }

      // Fit map to bounds
      if (steps.length > 0 && mapRef.current) {
        const latlngs = steps.map((step) => [step.lat, step.lng] as [number, number]);
        
        if (steps.length === 1) {
          // For a single marker, zoom to that point with a good zoom level
          mapRef.current.setView([steps[0].lat, steps[0].lng], 12, { animate: true });
        } else {
          // For multiple markers, fit all within bounds
          const bounds = L.latLngBounds(latlngs);
          mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
        }
      }
  }, [steps]);

  // Center map on last location when a new step is added
  useEffect(() => {
    if (!mapRef.current || steps.length === 0) return;

    // Get the last step
    const lastStep = steps[steps.length - 1];

    // Smooth animation to the last location only if it's a new addition
    // (i.e., only center when steps array length increased)
    mapRef.current.setView([lastStep.lat, lastStep.lng], 13, { animate: true });
  }, [steps.length]); // Only react to length changes, not the entire array

  // Re-fit map to show all steps when fitTrigger changes (e.g., after cancelling step creation)
  useEffect(() => {
    if (!mapRef.current || steps.length === 0 || !fitTrigger) return;

    // Skip if container is hidden; Leaflet needs a visible element to compute positions
    const container = containerRef.current;
    if (!container || container.offsetParent === null) return;

    try {
      mapRef.current.invalidateSize();
    } catch (err) {
      console.warn("Leaflet invalidateSize failed", err);
      return;
    }

    setTimeout(() => {
      if (!mapRef.current) return;
      if (steps.length === 1) {
        mapRef.current.setView([steps[0].lat, steps[0].lng], 12, { animate: true });
      } else {
        const latlngs = steps.map((s) => [s.lat, s.lng] as [number, number]);
        const bounds = L.latLngBounds(latlngs);
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    }, 100);
  }, [fitTrigger]);

  // Fly to a named location when centerLocation is set (e.g. trip title geocoded)
  useEffect(() => {
    if (!centerLocation || !mapRef.current) return;
    mapRef.current.flyTo(
      [centerLocation.lat, centerLocation.lng],
      centerLocation.zoom ?? 6,
      { animate: true, duration: 1.2 }
    );
  }, [centerLocation]);

  return (
    <>
      {showEditModal && selectedStep && (
        <EditStepModal
          step={selectedStep}
          onClose={() => {
            setShowEditModal(false);
            setSelectedStep(null);
          }}
          onSubmit={handleEditStep}
        />
      )}
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: "#e0e0e0",
        }}
      />

      {/* Location Search - Top Left */}
      <div style={{
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 100,
        maxWidth: 320,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}>
        <LocationSearch
          onLocationSelected={handleLocationSelected}
          token={token}
        />

        {/* Add stop here pill — appears after a location is selected */}
        {selectedLocation && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.95)",
            borderRadius: 12,
            padding: "10px 14px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            backdropFilter: "blur(8px)",
          }}>
            <span style={{ fontSize: 13, color: "#333", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              📍 {selectedLocation.name}
            </span>
            <button
              onClick={() => {
                onMapClickRef.current({ lat: selectedLocation.lat, lng: selectedLocation.lon });
                setSelectedLocation(null);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                background: "#5B6CF0",
                color: "white",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              + Add stop
            </button>
            <button
              onClick={() => setSelectedLocation(null)}
              style={{
                padding: "4px 6px",
                borderRadius: 6,
                border: "none",
                background: "transparent",
                color: "#999",
                fontSize: 14,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Map Style Toggle */}
      <button
        onClick={() => {
          if (!mapRef.current || !tileLayerRef.current) return;
          mapRef.current.removeLayer(tileLayerRef.current);
          const next = !isSatellite;
          const newTile = next
            ? L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
                attribution: "Tiles © Esri",
                maxZoom: 18,
                minZoom: 1,
              })
            : L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
                minZoom: 1,
              });
          newTile.addTo(mapRef.current);
          tileLayerRef.current = newTile;
          setIsSatellite(next);
        }}
        style={{
          position: "absolute",
          bottom: 24,
          left: 16,
          zIndex: 100,
          padding: "8px 14px",
          borderRadius: 10,
          border: "none",
          background: "rgba(255,255,255,0.92)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          color: "#333",
          backdropFilter: "blur(8px)",
        }}
      >
        {isSatellite ? "Map" : "Satellite"}
      </button>

      {/* Recommendations Panel - Top Right */}
      {showRecommendations && selectedLocation && (
        <RecommendationPanel
          currentLocation={{ name: selectedLocation.name, lat: selectedLocation.lat, lng: selectedLocation.lon }}
          onClose={() => setShowRecommendations(false)}
        />
      )}
    </>
  );
}

const TripViewerLeaflet = React.memo(TripViewerLeafletComponent);

export default TripViewerLeaflet;
