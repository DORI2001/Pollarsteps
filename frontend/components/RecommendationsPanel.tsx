"use client";

import React, { useState } from "react";
import { useColors } from "@/lib/theme";

interface Recommendation {
  title: string;
  type: string;
  description: string;
  why_recommended: string;
  estimated_time?: string;
}

interface RecommendationsPanelProps {
  locationName: string;
  latitude: number;
  longitude: number;
  onClose: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  restaurant: "🍽️",
  cafe: "☕",
  attraction: "🏛️",
  museum: "🏺",
  activity: "🎯",
  hotel: "🏨",
  landmark: "📍",
  park: "🌳",
  bar: "🍸",
  shop: "🛍️",
};

function getTypeIcon(type: string): string {
  const lower = type.toLowerCase();
  for (const [key, icon] of Object.entries(TYPE_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "✨";
}

const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  locationName,
  latitude,
  longitude,
  onClose,
}) => {
  const COLORS = useColors();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recType, setRecType] = useState("all");
  const [budget, setBudget] = useState("moderate");
  const [question, setQuestion] = useState("");
  const [askedQuestion, setAskedQuestion] = useState("");

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    setAskedQuestion(question.trim());

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setError("Please sign in to get recommendations");
        return;
      }

      const params = new URLSearchParams({
        location: locationName,
        lat: latitude.toString(),
        lon: longitude.toString(),
        rec_type: recType,
        budget: budget,
      });
      if (question.trim()) {
        params.append("question", question.trim());
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api"}/recommendations/location?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to fetch recommendations");
      }

      const data = await response.json();
      if (data?.recommendations?.length > 0) {
        setRecommendations(data.recommendations);
      } else {
        setError("No recommendations found for this location");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRecommendations([]);
    setError(null);
    setAskedQuestion("");
  };

  return (
    <div
      style={{
        background: COLORS.surface,
        borderRadius: 20,
        boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
        border: `1px solid ${COLORS.border}`,
        width: 380,
        maxHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "16px 18px 12px",
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, display: "flex", alignItems: "center", gap: 6 }}>
            <span>✨</span>
            <span>AI Recommendations</span>
          </div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
            📍 {locationName}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "transparent", border: "none",
            fontSize: 20, cursor: "pointer",
            color: COLORS.textSecondary, lineHeight: 1,
            padding: "2px 6px", borderRadius: 8,
          }}
        >
          ×
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ overflowY: "auto", flex: 1 }}>

        {/* Configure + Ask */}
        {recommendations.length === 0 && !loading && (
          <div style={{ padding: "14px 18px" }}>

            {/* Question input */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, display: "block", marginBottom: 6 }}>
                Ask a question (optional)
              </label>
              <input
                type="text"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchRecommendations()}
                placeholder="e.g. best place for sunset views, vegan food…"
                style={{
                  width: "100%", padding: "10px 12px",
                  borderRadius: 12, border: `1.5px solid ${COLORS.border}`,
                  background: COLORS.inputBg, color: COLORS.text,
                  fontSize: 13, boxSizing: "border-box", outline: "none",
                } as React.CSSProperties}
                onFocus={e => (e.currentTarget.style.borderColor = COLORS.primary)}
                onBlur={e => (e.currentTarget.style.borderColor = COLORS.border)}
              />
            </div>

            {/* Type filter */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, display: "block", marginBottom: 6 }}>
                What are you looking for?
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { value: "all", label: "All" },
                  { value: "restaurants", label: "🍽 Food" },
                  { value: "attractions", label: "🏛 Sights" },
                  { value: "activities", label: "🎯 Activities" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setRecType(opt.value)}
                    style={{
                      padding: "6px 12px", borderRadius: 20,
                      border: `1.5px solid ${recType === opt.value ? COLORS.primary : COLORS.border}`,
                      background: recType === opt.value ? `${COLORS.primary}15` : "transparent",
                      color: recType === opt.value ? COLORS.primary : COLORS.text,
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget filter */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, display: "block", marginBottom: 6 }}>
                Budget
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                {["budget", "moderate", "luxury"].map(b => (
                  <button
                    key={b}
                    onClick={() => setBudget(b)}
                    style={{
                      flex: 1, padding: "7px 0", borderRadius: 10,
                      border: `1.5px solid ${budget === b ? COLORS.primary : COLORS.border}`,
                      background: budget === b ? `${COLORS.primary}15` : "transparent",
                      color: budget === b ? COLORS.primary : COLORS.text,
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      transition: "all 0.15s",
                      textTransform: "capitalize" as const,
                    }}
                  >
                    {b === "budget" ? "💰" : b === "moderate" ? "💳" : "💎"} {b}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{
                background: `${COLORS.error}12`, border: `1px solid ${COLORS.error}40`,
                borderRadius: 10, padding: "10px 12px",
                fontSize: 12, color: COLORS.error, marginBottom: 12,
              }}>
                {error}
              </div>
            )}

            <button
              onClick={fetchRecommendations}
              style={{
                width: "100%", padding: "12px 0",
                borderRadius: 12, border: "none",
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
                color: "white", fontWeight: 700, fontSize: 14,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(91,108,240,0.3)",
              }}
            >
              ✨ Get Recommendations
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12,
              animation: "spin 1.5s linear infinite",
              display: "inline-block",
            }}>✨</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: 500 }}>
              Asking AI about {locationName}…
            </div>
            {askedQuestion && (
              <div style={{
                marginTop: 8, fontSize: 12, color: COLORS.primary,
                background: `${COLORS.primary}10`, borderRadius: 8,
                padding: "6px 12px", display: "inline-block",
              }}>
                "{askedQuestion}"
              </div>
            )}
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Results */}
        {recommendations.length > 0 && !loading && (
          <div style={{ padding: "14px 18px" }}>
            {askedQuestion && (
              <div style={{
                fontSize: 12, color: COLORS.primary,
                background: `${COLORS.primary}10`, borderRadius: 10,
                padding: "8px 12px", marginBottom: 12,
                fontStyle: "italic",
              }}>
                "{askedQuestion}"
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  style={{
                    background: COLORS.inputBg,
                    borderRadius: 14,
                    padding: "12px 14px",
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{getTypeIcon(rec.type)}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{rec.title}</div>
                        <div style={{ fontSize: 11, color: COLORS.primary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px" }}>
                          {rec.type}
                        </div>
                      </div>
                    </div>
                    {rec.estimated_time && (
                      <div style={{
                        fontSize: 11, color: COLORS.textSecondary,
                        background: COLORS.surface, borderRadius: 8,
                        padding: "3px 8px", flexShrink: 0,
                        border: `1px solid ${COLORS.border}`,
                      }}>
                        ⏱ {rec.estimated_time}
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: 12, color: COLORS.textSecondary, margin: "0 0 8px 0", lineHeight: 1.5 }}>
                    {rec.description}
                  </p>

                  <div style={{
                    background: `${COLORS.primary}0D`,
                    borderLeft: `3px solid ${COLORS.primary}`,
                    borderRadius: "0 8px 8px 0",
                    padding: "6px 10px",
                    fontSize: 11, color: COLORS.text, lineHeight: 1.5,
                  }}>
                    <strong>Why:</strong> {rec.why_recommended}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleReset}
              style={{
                width: "100%", marginTop: 14, padding: "10px 0",
                borderRadius: 12, border: `1.5px solid ${COLORS.border}`,
                background: "transparent", color: COLORS.textSecondary,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              ← Ask Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPanel;
