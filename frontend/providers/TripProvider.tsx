"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { session, api } from "@/lib/api";
import { resolveLocation } from "@/lib/geocoding";
import { Trip, Step, User } from "@/lib/types";

// ─── Shared types ────────────────────────────────────────────────────────────

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

// ─── Context value shapes ─────────────────────────────────────────────────────

export interface AuthContextValue {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  handleLogout: () => void;
}

export interface TripsContextValue {
  trips: Trip[];
  setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  newTripTitle: string;
  setNewTripTitle: React.Dispatch<React.SetStateAction<string>>;
  handleCreateTrip: () => Promise<void>;
  handleCreateTripFromToolbar: (title: string, description: string, startDate: string, endDate?: string) => Promise<void>;
  handleSelectTrip: (trip: Trip) => Promise<void>;
  handleDeleteTrip: (tripId: string) => Promise<void>;
  handleSplitTrip: (newTripTitle: string, stepsToMove: Step[]) => Promise<void>;
}

export interface CurrentTripContextValue {
  currentTrip: Trip | null;
  setCurrentTrip: React.Dispatch<React.SetStateAction<Trip | null>>;
  steps: Step[];
  setSteps: React.Dispatch<React.SetStateAction<Step[]>>;
  handleUpdateTrip: (updatedTrip: Trip) => void;
  handleStepsChange: (updatedSteps: Step[]) => void;
}

export interface StepEditorContextValue {
  showStepModal: boolean;
  setShowStepModal: React.Dispatch<React.SetStateAction<boolean>>;
  selectedMapCoords: { lat: number; lng: number } | null;
  setSelectedMapCoords: React.Dispatch<React.SetStateAction<{ lat: number; lng: number } | null>>;
  handleMapClick: (coords: { lat: number; lng: number }) => void;
  handleCancelStep: () => void;
  handleAddStep: (note: string, imageUrl?: string, locationName?: string) => Promise<void>;
}

export interface TripUIContextValue {
  showPhotoGallery: boolean;
  setShowPhotoGallery: React.Dispatch<React.SetStateAction<boolean>>;
  showRecommendations: boolean;
  setShowRecommendations: React.Dispatch<React.SetStateAction<boolean>>;
  recommendationLocation: RecommendationLocation | null;
  setRecommendationLocation: React.Dispatch<React.SetStateAction<RecommendationLocation | null>>;
  mapFitCounter: number;
  setMapFitCounter: React.Dispatch<React.SetStateAction<number>>;
  centerLocation: CenterLocation | null;
  setCenterLocation: React.Dispatch<React.SetStateAction<CenterLocation | null>>;
}

// ─── Contexts ────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue | null>(null);
export const TripsContext = createContext<TripsContextValue | null>(null);
export const CurrentTripContext = createContext<CurrentTripContextValue | null>(null);
export const StepEditorContext = createContext<StepEditorContextValue | null>(null);
export const TripUIContext = createContext<TripUIContextValue | null>(null);

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within TripProvider");
  return ctx;
}

export function useTripsContext(): TripsContextValue {
  const ctx = useContext(TripsContext);
  if (!ctx) throw new Error("useTripsContext must be used within TripProvider");
  return ctx;
}

export function useCurrentTripContext(): CurrentTripContextValue {
  const ctx = useContext(CurrentTripContext);
  if (!ctx) throw new Error("useCurrentTripContext must be used within TripProvider");
  return ctx;
}

export function useStepEditorContext(): StepEditorContextValue {
  const ctx = useContext(StepEditorContext);
  if (!ctx) throw new Error("useStepEditorContext must be used within TripProvider");
  return ctx;
}

export function useTripUIContext(): TripUIContextValue {
  const ctx = useContext(TripUIContext);
  if (!ctx) throw new Error("useTripUIContext must be used within TripProvider");
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function TripProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Auth slice
  const [user, setUser] = useState<User | null>(null);

  // Trips slice
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTripTitle, setNewTripTitle] = useState("");

  // Current trip slice
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);

  // Step editor slice
  const [showStepModal, setShowStepModal] = useState(false);
  const [selectedMapCoords, setSelectedMapCoords] = useState<{ lat: number; lng: number } | null>(null);

  // UI slice
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendationLocation, setRecommendationLocation] = useState<RecommendationLocation | null>(null);
  const [mapFitCounter, setMapFitCounter] = useState(0);
  const [centerLocation, setCenterLocation] = useState<CenterLocation | null>(null);

  // ── Auth callbacks ──────────────────────────────────────────────────────────

  const handleLogout = useCallback(() => {
    session.logout();
    router.push("/signup");
  }, [router]);

  // ── Trips callbacks ─────────────────────────────────────────────────────────

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
      const loc = await resolveLocation(title);
      if (loc) setCenterLocation(loc);
    } catch (err: any) {
      console.error("Failed to create trip:", err);
      alert(`Failed to create trip:\n${err.message || err.detail || JSON.stringify(err)}`);
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
      const loc = await resolveLocation(title);
      if (loc) setCenterLocation(loc);
    } catch (err: any) {
      console.error("Failed to create trip:", err);
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
            return currentPrev;
          }
          setSteps([]);
          return null;
        });
        return updated;
      });
    } catch (err: any) {
      console.error("Delete failed:", err);
      alert(`Delete failed: ${err?.message || err?.toString() || "Unknown error"}`);
      throw err;
    }
  }, []);

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

  // ── Current trip callbacks ──────────────────────────────────────────────────

  const handleUpdateTrip = useCallback((updatedTrip: Trip) => {
    setTrips((prev) => prev.map((t) => t.id === updatedTrip.id ? { ...t, ...updatedTrip } : t));
    setCurrentTrip((prev) => {
      if (prev?.id !== updatedTrip.id) return prev;
      if (updatedTrip.title && updatedTrip.title !== prev?.title) {
        resolveLocation(updatedTrip.title).then((loc) => {
          if (loc) setCenterLocation(loc);
        });
      }
      return { ...prev, ...updatedTrip };
    });
  }, []);

  const handleStepsChange = useCallback((updatedSteps: Step[]) => {
    setSteps(updatedSteps);
    setCurrentTrip((prev) => prev ? { ...prev, steps: updatedSteps } : prev);
  }, []);

  // ── Step editor callbacks ───────────────────────────────────────────────────

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
        api.getSteps(token, prevTrip.id)
          .then((freshSteps) => {
            setSteps(freshSteps);
            setCurrentTrip((t) => t ? { ...t, steps: freshSteps } : t);
          })
          .catch(() => { setSteps((prev) => [...prev]); })
          .finally(() => { setMapFitCounter((c) => c + 1); });
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
    let tripId: string | null = null;
    setCurrentTrip((prev) => { tripId = prev?.id ?? null; return prev; });
    if (!tripId || !selectedMapCoords) {
      console.error("Missing trip or coordinates");
      return;
    }
    const step = await api.createStep(token, tripId, selectedMapCoords.lat, selectedMapCoords.lng, note, imageUrl, locationName);
    setSteps((prev) => {
      const updated = [...prev, step];
      setCurrentTrip((t) => t ? { ...t, steps: updated } : t);
      return updated;
    });
    setShowStepModal(false);
    setSelectedMapCoords(null);
  }, [router, selectedMapCoords]);

  // ── Context values (each memoized independently) ────────────────────────────

  const authValue = useMemo<AuthContextValue>(() => ({
    user, setUser, handleLogout,
  }), [user, handleLogout]);

  const tripsValue = useMemo<TripsContextValue>(() => ({
    trips, setTrips, loading, setLoading, newTripTitle, setNewTripTitle,
    handleCreateTrip, handleCreateTripFromToolbar, handleSelectTrip, handleDeleteTrip, handleSplitTrip,
  }), [trips, loading, newTripTitle, handleCreateTrip, handleCreateTripFromToolbar, handleSelectTrip, handleDeleteTrip, handleSplitTrip]);

  const currentTripValue = useMemo<CurrentTripContextValue>(() => ({
    currentTrip, setCurrentTrip, steps, setSteps, handleUpdateTrip, handleStepsChange,
  }), [currentTrip, steps, handleUpdateTrip, handleStepsChange]);

  const stepEditorValue = useMemo<StepEditorContextValue>(() => ({
    showStepModal, setShowStepModal, selectedMapCoords, setSelectedMapCoords,
    handleMapClick, handleCancelStep, handleAddStep,
  }), [showStepModal, selectedMapCoords, handleMapClick, handleCancelStep, handleAddStep]);

  const tripUIValue = useMemo<TripUIContextValue>(() => ({
    showPhotoGallery, setShowPhotoGallery, showRecommendations, setShowRecommendations,
    recommendationLocation, setRecommendationLocation, mapFitCounter, setMapFitCounter,
    centerLocation, setCenterLocation,
  }), [showPhotoGallery, showRecommendations, recommendationLocation, mapFitCounter, centerLocation]);

  return (
    <AuthContext.Provider value={authValue}>
      <TripsContext.Provider value={tripsValue}>
        <CurrentTripContext.Provider value={currentTripValue}>
          <StepEditorContext.Provider value={stepEditorValue}>
            <TripUIContext.Provider value={tripUIValue}>
              {children}
            </TripUIContext.Provider>
          </StepEditorContext.Provider>
        </CurrentTripContext.Provider>
      </TripsContext.Provider>
    </AuthContext.Provider>
  );
}
