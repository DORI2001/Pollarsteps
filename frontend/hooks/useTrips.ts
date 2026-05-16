import { useTripsContext } from "@/providers/TripProvider";

export function useTrips() {
  return useTripsContext();
}
