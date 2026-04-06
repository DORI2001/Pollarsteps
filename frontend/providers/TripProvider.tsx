"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { session, api } from "@/lib/api";
import { Trip, Step, User } from "@/lib/types";

interface CenterLocation {
  lat: number;
  lng: number;
  zoom?: number;
}

interface RecommendationLocation {
  name: string;
  lat: number;
  lng: number;
}

interface TripContextValue {
  // State
  user: User | null;
  trips: Trip[];
  currentTrip: Trip | null;
  steps: Step[];
  loading: boolean;
  newTripTitle: string;
  showStepModal: boolean;
  selectedMapCoords: { lat: number; lng: number } | null;
  showPhotoGallery: boolean;
  showRecommendations: boolean;
  recommendationLocation: RecommendationLocation | null;
  mapFitCounter: number;
  centerLocation: CenterLocation | null;

  // Setters
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
  setCurrentTrip: React.Dispatch<React.SetStateAction<Trip | null>>;
  setSteps: React.Dispatch<React.SetStateAction<Step[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setNewTripTitle: React.Dispatch<React.SetStateAction<string>>;
  setShowStepModal: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedMapCoords: React.Dispatch<React.SetStateAction<{ lat: number; lng: number } | null>>;
  setShowPhotoGallery: React.Dispatch<React.SetStateAction<boolean>>;
  setShowRecommendations: React.Dispatch<React.SetStateAction<boolean>>;
  setRecommendationLocation: React.Dispatch<React.SetStateAction<RecommendationLocation | null>>;
  setMapFitCounter: React.Dispatch<React.SetStateAction<number>>;
  setCenterLocation: React.Dispatch<React.SetStateAction<CenterLocation | null>>;

  // Actions
  handleCreateTrip: () => Promise<void>;
  handleCreateTripFromToolbar: (title: string, description: string, startDate: string, endDate?: string) => Promise<void>;
  handleMapClick: (coords: { lat: number; lng: number }) => void;
  handleCancelStep: () => void;
  handleAddStep: (note: string, imageUrl?: string, locationName?: string) => Promise<void>;
  handleStepsChange: (updatedSteps: Step[]) => void;
  handleLogout: () => void;
  handleSplitTrip: (newTripTitle: string, stepsToMove: Step[]) => Promise<void>;
  handleUpdateTrip: (updatedTrip: Trip) => void;
  handleDeleteTrip: (tripId: string) => Promise<void>;
  handleSelectTrip: (trip: Trip) => Promise<void>;
}

const TripContext = createContext<TripContextValue | null>(null);

export function useTripContext(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTripContext must be used within TripProvider");
  return ctx;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

async function geocodeTitle(title: string): Promise<CenterLocation | null> {
  try {
    const geo = await fetch(
      `${API_BASE}/geocoding/geocode?location=${encodeURIComponent(title)}`
    ).then((r) => r.json());
    if (geo?.latitude && geo?.longitude) {
      return { lat: geo.latitude, lng: geo.longitude, zoom: 6 };
    }
  } catch { /* non-critical */ }
  return null;
}

export function TripProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTripTitle, setNewTripTitle] = useState("");
  const [showStepModal, setShowStepModal] = useState(false);
  const [selectedMapCoords, setSelectedMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendationLocation, setRecommendationLocation] = useState<RecommendationLocation | null>(null);
  const [mapFitCounter, setMapFitCounter] = useState(0);
  const [centerLocation, setCenterLocation] = useState<CenterLocation | null>(null);

  const handleCreateTrip = useCallback(async () => {
    if (!newTripTitle.trim()) return;
    const token = session.getToken();
    if (!token) {
      alert("No authentication token - please log in again");
      return;
    }

    try {
      const title = newTripTitle.trim();
      const trip = await api.createTrip(token, title);
      setTrips((prev) => [...prev, trip]);
      setCurrentTrip(trip);
      setSteps([]);
      setNewTripTitle("");

      const loc = await geocodeTitle(title);
      if (loc) setCenterLocation(loc);
    } catch (err: any) {
      console.error("Failed to create trip:", err);
      const errorMsg = err.message || err.detail || JSON.stringify(err);
      alert(`Failed to create trip:\n${errorMsg}`);
    }
  }, [newTripTitle]);

  const handleCreateTripFromToolbar = useCallback(async (
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
      setTrips((prev) => [...prev, trip]);
      setCurrentTrip(trip);
      setSteps([]);

      const loc = await geocodeTitle(title);
      if (loc) setCenterLocation(loc);
    } catch (err: any) {
      console.error("Failed to create trip:", err);
      throw err;
    }
  }, []);

  const handleMapClick = useCallback((coords: { lat: number; lng: number }) => {
    setSelectedMapCoords(coords);
    setShowStepModal(true);
  }, []);

  const handleCancelStep = useCallback(() => {
    setShowStepModal(false);
    setSelectedMapCoords(null);
    const token = session.getToken();

    setCurrentTrip((prevTrip) => {
      if (token && prevTrip?.id) {
        api
          .getSteps(token, prevTrip.id)
          .then((freshSteps) => {
            setSteps(freshSteps);
            setCurrentTrip((t) => t ? { ...t, steps: freshSteps } : t);
          })
          .catch(() => {
            setSteps((prev) => [...prev]);
          })
          .finally(() => {
            setMapFitCounter((c) => c + 1);
          });
      } else {
        setSteps((prev) => [...prev]);
        setMapFitCounter((c) => c + 1);
      }
      return prevTrip;
    });
  }, []);

  const handleAddStep = useCallback(async (note: string, imageUrl?: string, locationName?: string) => {
    const token = session.getToken();
    if (!token) {
      router.push("/signup");
      return;
    }

    // Read current values via updater pattern to avoid stale closures
    let tripId: string | null = null;
    setCurrentTrip((prev) => { tripId = prev?.id ?? null; return prev; });

    if (!tripId || !selectedMapCoords) {
      console.error("Missing trip or coordinates");
      return;
    }

    const step = await api.createStep(
      token,
      tripId,
      selectedMapCoords.lat,
      selectedMapCoords.lng,
      note,
      imageUrl,
      locationName
    );

    setSteps((prev) => {
      const updated = [...prev, step];
      setCurrentTrip((t) => t ? { ...t, steps: updated } : t);
      return updated;
    });
    setShowStepModal(false);
    setSelectedMapCoords(null);
  }, [router, selectedMapCoords]);

  const handleStepsChange = useCallback((updatedSteps: Step[]) => {
    setSteps(updatedSteps);
    setCurrentTrip((prev) => prev ? { ...prev, steps: updatedSteps } : prev);
  }, []);

  const handleLogout = useCallback(() => {
    session.logout();
    router.push("/signup");
  }, [router]);

  const handleSplitTrip = useCallback(async (newTitle: string, stepsToMove: Step[]) => {
    const token = session.getToken();
    setCurrentTrip((prevTrip) => {
      if (!token || !prevTrip) return prevTrip;

      const stepIds = stepsToMove.map((s) => s.id);
      api.splitTrip(token, prevTrip.id, newTitle, stepIds).then(async (result) => {
        const updatedTrips = await api.getTrips(token);
        setTrips(updatedTrips);
        const originalSteps = await api.getSteps(token, result.original_trip.id);
        setSteps(originalSteps);
        setCurrentTrip({ ...result.original_trip, steps: originalSteps });
      });

      return prevTrip;
    });
  }, []);

  const handleUpdateTrip = useCallback((updatedTrip: Trip) => {
    setTrips((prev) => prev.map((t) => t.id === updatedTrip.id ? { ...t, ...updatedTrip } : t));
    setCurrentTrip((prev) => {
      if (prev?.id !== updatedTrip.id) return prev;
      const merged = { ...prev, ...updatedTrip };

      if (updatedTrip.title && updatedTrip.title !== prev?.title) {
        geocodeTitle(updatedTrip.title).then((loc) => {
          if (loc) setCenterLocation(loc);
        });
      }

      return merged;
    });
  }, []);

  const handleDeleteTrip = useCallback(async (tripId: string) => {
    const token = session.getToken();
    if (!token) return;

    try {
      await api.deleteTrip(token, tripId);
      setTrips((prev) => {
        const updated = prev.filter((t) => t.id !== tripId);

        setCurrentTrip((currentPrev) => {
          if (currentPrev?.id !== tripId) return currentPrev;

          if (updated.length > 0) {
            api.getTrip(token, updated[0].id)
              .then((nextTrip) => {
                setCurrentTrip(nextTrip);
                setSteps(nextTrip.steps || []);
              })
              .catch(() => {
                setCurrentTrip(updated[0]);
                setSteps([]);
              });
            return currentPrev; // will be updated async
          }
          setSteps([]);
          return null;
        });

        return updated;
      });
    } catch (err: any) {
      console.error("Delete failed:", err);
      const errorMsg = err?.message || err?.toString() || "Unknown error";
      alert(`Delete failed: ${errorMsg}`);
      throw err;
    }
  }, []);

  const handleSelectTrip = useCallback(async (trip: Trip) => {
    setCurrentTrip(trip);
    const token = session.getToken();
    if (token) {
      try {
        const tripSteps = await api.getSteps(token, trip.id);
        setSteps(tripSteps);
        setCurrentTrip({ ...trip, steps: tripSteps });
      } catch (err) {
        console.error("Failed to load trip steps:", err);
        setSteps([]);
        setCurrentTrip({ ...trip, steps: [] });
      }
    }
  }, []);

  const value = useMemo<TripContextValue>(() => ({
    user, trips, currentTrip, steps, loading, newTripTitle,
    showStepModal, selectedMapCoords, showPhotoGallery,
    showRecommendations, recommendationLocation, mapFitCounter, centerLocation,
    setUser, setTrips, setCurrentTrip, setSteps, setLoading, setNewTripTitle,
    setShowStepModal, setSelectedMapCoords, setShowPhotoGallery,
    setShowRecommendations, setRecommendationLocation, setMapFitCounter, setCenterLocation,
    handleCreateTrip, handleCreateTripFromToolbar, handleMapClick, handleCancelStep,
    handleAddStep, handleStepsChange, handleLogout, handleSplitTrip,
    handleUpdateTrip, handleDeleteTrip, handleSelectTrip,
  }), [
    user, trips, currentTrip, steps, loading, newTripTitle,
    showStepModal, selectedMapCoords, showPhotoGallery,
    showRecommendations, recommendationLocation, mapFitCounter, centerLocation,
    handleCreateTrip, handleCreateTripFromToolbar, handleMapClick, handleCancelStep,
    handleAddStep, handleStepsChange, handleLogout, handleSplitTrip,
    handleUpdateTrip, handleDeleteTrip, handleSelectTrip,
  ]);

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}
