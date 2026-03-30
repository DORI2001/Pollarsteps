// Export utilities for trip data in multiple formats

export interface ExportTrip {
  id: string;
  title: string;
  description?: string;
  start_date?: string;
  steps: ExportStep[];
  total_distance?: number;
  total_days?: number;
}

export interface ExportStep {
  id: string;
  lat: number;
  lng: number;
  timestamp: string;
  location_name?: string;
  note?: string;
  duration_days?: number;
  index: number;
}

// Export as JSON
export function exportAsJSON(trip: ExportTrip): void {
  const data = {
    trip: {
      id: trip.id,
      title: trip.title,
      description: trip.description || "",
      start_date: trip.start_date || null,
      total_distance_km: trip.total_distance || 0,
      total_days: trip.total_days || 0,
      exported_at: new Date().toISOString(),
    },
    steps: trip.steps.map((step) => ({
      index: step.index,
      location_name: step.location_name || `Stop ${step.index}`,
      coordinates: {
        latitude: step.lat,
        longitude: step.lng,
      },
      timestamp: step.timestamp,
      note: step.note || "",
      duration_days: step.duration_days || null,
    })),
  };

  downloadFile(
    JSON.stringify(data, null, 2),
    `${trip.title}-export.json`,
    "application/json"
  );
}

// Export as CSV
export function exportAsCSV(trip: ExportTrip): void {
  const headers = [
    "Stop #",
    "Location Name",
    "Latitude",
    "Longitude",
    "Timestamp",
    "Days Spent",
    "Memory/Note",
  ];

  const rows = trip.steps.map((step) => [
    step.index,
    step.location_name || `Stop ${step.index}`,
    step.lat,
    step.lng,
    step.timestamp,
    step.duration_days || "",
    `"${(step.note || "").replace(/"/g, '""')}"`, // Escape quotes in notes
  ]);

  const csvContent = [
    [`Trip: ${trip.title}`],
    [`Total Distance: ${trip.total_distance?.toFixed(0) || 0} km`],
    [`Exported: ${new Date().toLocaleString()}`],
    [],
    headers.map((h) => `"${h}"`),
    ...rows.map((row) => row.join(",")),
  ]
    .map((row) => (Array.isArray(row) ? row.join(",") : row))
    .join("\n");

  downloadFile(csvContent, `${trip.title}-export.csv`, "text/csv");
}

// Export as GeoJSON
export function exportAsGeoJSON(trip: ExportTrip): void {
  const features = trip.steps.map((step, index) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [step.lng, step.lat],
    },
    properties: {
      index: step.index,
      location_name: step.location_name || `Stop ${step.index}`,
      timestamp: step.timestamp,
      note: step.note || "",
      duration_days: step.duration_days || null,
    },
  }));

  // Add route line
  const routeFeature = {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: trip.steps.map((step) => [step.lng, step.lat]),
    },
    properties: {
      name: `${trip.title} Route`,
      total_distance_km: trip.total_distance || 0,
    },
  };

  const geojson = {
    type: "FeatureCollection",
    properties: {
      name: trip.title,
      description: trip.description || "",
      exported_at: new Date().toISOString(),
    },
    features: [routeFeature, ...features],
  };

  downloadFile(
    JSON.stringify(geojson, null, 2),
    `${trip.title}-export.geojson`,
    "application/geo+json"
  );
}

// Export as GPX (GPS Exchange Format)
export function exportAsGPX(trip: ExportTrip): void {
  const timestamp = new Date().toISOString();

  let gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Polarsteps" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXML(trip.title)}</name>
    <desc>${escapeXML(trip.description || "")}</desc>
    <time>${timestamp}</time>
  </metadata>
  <trk>
    <name>${escapeXML(trip.title)}</name>
    <trkseg>`;

  trip.steps.forEach((step) => {
    gpxContent += `
      <trkpt lat="${step.lat}" lon="${step.lng}">
        <time>${step.timestamp}</time>
        <name>${escapeXML(step.location_name || `Stop ${step.index}`)}</name>
        <desc>${escapeXML(step.note || "")}</desc>
      </trkpt>`;
  });

  gpxContent += `
    </trkseg>
  </trk>
  <wpt lat="${trip.steps[0]?.lat || 0}" lon="${trip.steps[0]?.lng || 0}">
    <name>Start: ${escapeXML(trip.steps[0]?.location_name || trip.title)}</name>
  </wpt>
  <wpt lat="${trip.steps[trip.steps.length - 1]?.lat || 0}" lon="${trip.steps[trip.steps.length - 1]?.lng || 0}">
    <name>End: ${escapeXML(trip.steps[trip.steps.length - 1]?.location_name || trip.title)}</name>
  </wpt>
</gpx>`;

  downloadFile(gpxContent, `${trip.title}-export.gpx`, "application/gpx+xml");
}

// Utility: Download file to user's computer
function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Utility: Escape XML special characters
function escapeXML(str: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  };
  return str.replace(/[&<>"']/g, (char) => map[char] || char);
}
