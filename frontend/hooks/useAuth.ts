import { useAuthContext } from "@/providers/TripProvider";

export function useAuth() {
  return useAuthContext();
}
