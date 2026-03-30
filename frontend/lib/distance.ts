import { Step } from "./types";

/**
 * Calculate distance between two geographic coordinates using Haversine formula.
 * @param lat1 - Latitude of first point in degrees
 * @param lon1 - Longitude of first point in degrees
 * @param lat2 - Latitude of second point in degrees
 * @param lon2 - Longitude of second point in degrees
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate total distance traveled across all steps.
 * @param steps - Array of step objects with lat/lng properties
 * @returns Total distance in kilometers
 */
export function calculateTotalDistance(steps: Step[]): number {
  if (!steps || steps.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < steps.length - 1; i++) {
    const distance = calculateDistance(
      steps[i].lat,
      steps[i].lng,
      steps[i + 1].lat,
      steps[i + 1].lng
    );
    totalDistance += distance;
  }

  return Math.round(totalDistance * 100) / 100; // Round to 2 decimal places
}

/**
 * Get distances for each segment between consecutive steps.
 * @param steps - Array of step objects with lat/lng properties
 * @returns Array of distances for each segment
 */
export function calculateSegmentDistances(steps: Step[]): number[] {
  if (!steps || steps.length < 2) return [];

  const distances: number[] = [];
  for (let i = 0; i < steps.length - 1; i++) {
    const distance = calculateDistance(
      steps[i].lat,
      steps[i].lng,
      steps[i + 1].lat,
      steps[i + 1].lng
    );
    distances.push(distance);
  }

  return distances;
}
