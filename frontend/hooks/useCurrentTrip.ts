import { useCurrentTripContext } from "@/providers/TripProvider";

export function useCurrentTrip() {
  return useCurrentTripContext();
}
