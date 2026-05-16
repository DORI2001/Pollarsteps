interface StepForPopup {
  id: string;
  lat: number;
  lng: number;
  timestamp: string;
  note?: string;
  image_url?: string;
  duration_days?: number;
  location_name?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildStepPopup(
  step: StepForPopup,
  index: number,
  total: number,
  geocodedLocationName: string
): string {
  const isStart = index === 0;
  const isEnd = index === total - 1;

  const date = new Date(step.timestamp);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const locationLabel = escapeHtml(step.location_name || `Place ${index + 1}`);
  const badgeHtml = isStart
    ? `<span style="display: inline-block; background: #34C759; color: white; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; margin-left: auto;">START</span>`
    : isEnd
    ? `<span style="display: inline-block; background: #FF3B30; color: white; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; margin-left: auto;">END</span>`
    : "";

  const durationHtml = step.duration_days && step.duration_days > 0
    ? `<div style="display: flex; align-items: center; gap: 4px;"><span>📌</span><span>${step.duration_days} day${step.duration_days !== 1 ? "s" : ""}</span></div>`
    : "";

  const noteHtml = step.note
    ? `<div style="margin-bottom: 8px; padding: 8px; background: #F5F5F7; border-left: 3px solid #667eea; border-radius: 4px;"><strong>Memory:</strong> ${escapeHtml(step.note.substring(0, 100))}${step.note.length > 100 ? "..." : ""}</div>`
    : "";

  const geocodedHtml = geocodedLocationName
    ? `<div style="display: flex; align-items: center; gap: 4px;"><span>🗺️</span><span style="font-weight: 500;">${escapeHtml(geocodedLocationName)}</span></div>`
    : "";

  const imageHtml = step.image_url
    ? `<div style="margin-top: 8px; border-radius: 4px; overflow: hidden; max-height: 120px;"><img src="${escapeHtml(step.image_url)}" alt="Memory" style="width: 100%; height: auto; max-height: 120px; object-fit: cover;" /></div>`
    : "";

  return `
    <div style="font-family: -apple-system, sans-serif; padding: 12px; min-width: 280px; border-radius: 8px; background: #FFFFFF;">
      <div style="font-weight: 700; color: #1D1D1D; font-size: 14px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
        <span>📍</span>
        <span>${locationLabel}</span>
        ${badgeHtml}
      </div>
      <div style="color: #666; font-size: 12px; line-height: 1.8; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 4px;"><span>📅</span><span>${dateStr}</span></div>
        <div style="display: flex; align-items: center; gap: 4px;"><span>🕐</span><span>${timeStr}</span></div>
        <div style="display: flex; align-items: center; gap: 4px;"><span>📍</span><span>Stop ${index + 1} of ${total}</span></div>
        ${durationHtml}
        <div style="font-size: 11px; color: #666; grid-column: 1 / -1; padding: 6px 0; border-top: 1px solid #E5E5EA; margin-top: 4px; padding-top: 8px;">
          ${noteHtml}
          ${geocodedHtml}
        </div>
        ${imageHtml}
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #E5E5EA; display: flex; gap: 8px; grid-column: 1 / -1;">
          <button class="edit-step-btn" data-step-id="${escapeHtml(step.id)}" style="flex: 1; padding: 8px 12px; background: #667eea; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s;">Edit</button>
          <button class="delete-step-btn" data-step-id="${escapeHtml(step.id)}" style="flex: 1; padding: 8px 12px; background: #FF3B30; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s;">Delete</button>
        </div>
      </div>
    </div>`;
}
