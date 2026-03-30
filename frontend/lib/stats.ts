import { Step, Trip } from "./types";

/**
 * Calculate the number of days between first and last step.
 * @param steps - Array of steps with timestamps
 * @returns Number of days
 */
export function calculateTotalDays(steps: Step[]): number {
  if (!steps || steps.length < 2) return 0;
  const first = steps[0];
  const last = steps[steps.length - 1];
  if (!first.timestamp || !last.timestamp) return 0;
  const delta =
    new Date(last.timestamp).getTime() - new Date(first.timestamp).getTime();
  return Math.ceil(delta / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Calculate trip duration based on start and end dates.
 * @param trip - Trip object with start_date and optional end_date
 * @returns Number of days
 */
export function calculateTripDuration(trip: Trip): number {
  if (!trip || !trip.start_date) return 0;
  if (trip.end_date) {
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    const delta = end.getTime() - start.getTime();
    return Math.ceil(delta / (1000 * 60 * 60 * 24)) + 1;
  }
  const start = new Date(trip.start_date);
  const today = new Date();
  const delta = today.getTime() - start.getTime();
  return Math.ceil(delta / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Calculate total days spent at all destinations.
 * @param steps - Array of steps with duration_days property
 * @returns Total days at destinations
 */
export function calculateDaysAtDestinations(steps: Step[]): number {
  if (!steps) return 0;
  return steps.reduce(
    (sum: number, step: Step) => sum + (step.duration_days || 0),
    0
  );
}

/**
 * Calculate average days spent at each destination.
 * @param steps - Array of steps
 * @returns Average days per destination
 */
export function calculateAverageDays(steps: Step[]): number {
  if (!steps || steps.length === 0) return 0;
  const total = calculateDaysAtDestinations(steps);
  return Math.round((total / steps.length) * 10) / 10;
}

/**
 * Get all unique destination names from steps.
 * @param steps - Array of steps
 * @returns Array of unique location names
 */
export function getUniqueLocations(steps: Step[]): string[] {
  if (!steps) return [];
  return Array.from(
    new Set(
      steps
        .map((s) => s.location_name)
        .filter((name): name is string => !!name)
    )
  );
}

/**
 * Get statistics summary for a trip.
 * @param trip - Trip object with steps
 * @returns Statistics object
 */
export function getTripStatistics(trip: Trip) {
  const steps = trip.steps || [];
  return {
    totalDistance: trip.total_distance || 0,
    numberOfLocations: trip.total_steps || 0,
    uniqueLocations: getUniqueLocations(steps),
    totalDays: calculateTotalDays(steps),
    tripDuration: calculateTripDuration(trip),
    daysAtDestinations: calculateDaysAtDestinations(steps),
    averageDaysPerDestination: calculateAverageDays(steps),
  };
}
