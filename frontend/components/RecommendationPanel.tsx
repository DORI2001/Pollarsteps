"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { useColors } from "@/lib/theme";

interface RecommendationPanelProps {
  currentLocation?: { name: string; lat: number; lng: number };
  onClose: () => void;
}

export function RecommendationPanel({
  currentLocation,
  onClose,
}: RecommendationPanelProps) {
  const COLORS = useColors();
  const [question, setQuestion] = useState("");
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [recType, setRecType] = useState("all");
  const [budget, setBudget] = useState("moderate");
  const [error, setError] = useState<string | null>(null);

  const handleGetRecommendations = async () => {
    if (!currentLocation) {
      alert("Please select a location on the map first");
      return;
    }

    if (!question.trim()) {
      alert("Please ask a question or select a recommendation type");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await api.getRecommendations(
        currentLocation.name,
        currentLocation.lat,
        currentLocation.lng,
        recType,
        budget,
        question
      );
      setRecommendations(result);
    } catch (err: any) {
      setError(err?.message || "Failed to get recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 90,
        right: 16,
        width: 380,
        maxWidth: "calc(100vw - 48px)",
        maxHeight: "calc(100vh - 120px)",
        background: "rgba(255, 255, 255, 0.95)",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.2)",
        backdropFilter: "blur(10px)",
        zIndex: 70,
        pointerEvents: "auto",
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, margin: 0 }}>
          💡 Ask for Recommendations
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: 20,
            cursor: "pointer",
            color: COLORS.textSecondary,
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* Location Display */}
      {currentLocation && (
        <div
          style={{
            padding: 12,
            background: COLORS.background,
            borderRadius: 8,
            fontSize: 14,
            color: COLORS.text,
          }}
        >
          📍 <strong>{currentLocation.name}</strong>
          <br />
          <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
            {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
          </span>
        </div>
      )}

      {/* Question Input */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.text,
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.3px",
          }}
        >
          What are you looking for?
        </label>
        <textarea
          placeholder="e.g., 'Best vegetarian restaurants nearby', 'Family-friendly activities'"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: `2px solid ${COLORS.border}`,
            borderRadius: 8,
            fontSize: 14,
            boxSizing: "border-box",
            background: "#F5F5F7",
            color: COLORS.text,
            fontFamily: "inherit",
            transition: "all 0.2s",
            outline: "none",
            minHeight: "80px",
            resize: "vertical",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = COLORS.primary;
            e.currentTarget.style.boxShadow = `0 0 0 3px rgba(102, 126, 234, 0.1)`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = COLORS.border;
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Recommendation Type */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.text,
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.3px",
          }}
        >
          Type
        </label>
        <select
          value={recType}
          onChange={(e) => setRecType(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: `2px solid ${COLORS.border}`,
            borderRadius: 8,
            fontSize: 14,
            boxSizing: "border-box",
            background: "#F5F5F7",
            color: COLORS.text,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          <option value="all">All Recommendations</option>
          <option value="restaurants">Restaurants</option>
          <option value="attractions">Attractions</option>
          <option value="activities">Activities</option>
        </select>
      </div>

      {/* Budget */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.text,
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.3px",
          }}
        >
          Budget
        </label>
        <select
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: `2px solid ${COLORS.border}`,
            borderRadius: 8,
            fontSize: 14,
            boxSizing: "border-box",
            background: "#F5F5F7",
            color: COLORS.text,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          <option value="budget">Budget</option>
          <option value="moderate">Moderate</option>
          <option value="luxury">Luxury</option>
        </select>
      </div>

      {/* Get Recommendations Button */}
      <button
        onClick={handleGetRecommendations}
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px 16px",
          background: loading
            ? `${COLORS.primary}99`
            : `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
          color: "white",
          border: "none",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          opacity: loading ? 0.6 : 1,
        }}
        onMouseOver={(e) => {
          if (!loading) {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 6px 16px rgba(102, 126, 234, 0.4)";
            (e.currentTarget as HTMLButtonElement).style.transform =
              "translateY(-2px)";
          }
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
        }}
      >
        {loading ? "Asking AI..." : "🤖 Get Recommendations"}
      </button>

      {/* Recommendations Display */}
      {error && (
        <div
          style={{
            padding: 12,
            background: "#fff3f3",
            borderRadius: 8,
            border: "1px solid #f0b3b3",
            color: "#9b1c1c",
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      {recommendations && (
        <div
          style={{
            padding: 16,
            background: COLORS.background,
            borderRadius: 8,
            borderLeft: `4px solid ${COLORS.primary}`,
          }}
        >
          <h4
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: COLORS.text,
              margin: "0 0 12px 0",
            }}
          >
            ✨ Recommendations
          </h4>

          {recommendations.recommendations &&
            recommendations.recommendations.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recommendations.recommendations.map(
                (rec: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: 12,
                      background: "white",
                      borderRadius: 6,
                      border: `1px solid ${COLORS.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: COLORS.text,
                        marginBottom: 4,
                      }}
                    >
                      {rec.title}
                    </div>
                    {rec.description && (
                      <div
                        style={{
                          fontSize: 12,
                          color: COLORS.textSecondary,
                          lineHeight: 1.4,
                          marginBottom: 4,
                        }}
                      >
                        {rec.description}
                      </div>
                    )}
                    {rec.rating && (
                      <div
                        style={{
                          fontSize: 12,
                          color: COLORS.warning,
                          fontWeight: 600,
                        }}
                      >
                        ⭐ {rec.rating}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          ) : (
            <div
              style={{
                fontSize: 13,
                color: COLORS.textSecondary,
                fontStyle: "italic",
              }}
            >
              No recommendations found for this location.
            </div>
          )}

          {recommendations.summary && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: `1px solid ${COLORS.border}`,
                fontSize: 12,
                color: COLORS.textSecondary,
                lineHeight: 1.5,
              }}
            >
              <strong>Summary:</strong> {recommendations.summary}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
