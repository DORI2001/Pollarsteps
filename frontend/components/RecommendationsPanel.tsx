import React, { useState } from "react";
import { Sparkles, LoadingSpinner } from "@/components/icons";

interface Recommendation {
  title: string;
  type: string;
  description: string;
  why_recommended: string;
  estimated_time?: string;
}

interface RecommendationsProps {
  locationName: string;
  latitude: number;
  longitude: number;
  onClose: () => void;
}

const RecommendationsPanel: React.FC<RecommendationsProps> = ({
  locationName,
  latitude,
  longitude,
  onClose,
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recType, setRecType] = useState<string>("all");
  const [budget, setBudget] = useState<string>("moderate");

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const params = new URLSearchParams({
        location: locationName,
        lat: latitude.toString(),
        lon: longitude.toString(),
        rec_type: recType,
        budget: budget,
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/recommendations/location?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data = await response.json();
      if (data && data.recommendations) {
        setRecommendations(data.recommendations);
      } else {
        setError("No recommendations found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-800">
            Recommendations for {locationName}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Filters */}
      {!loading && recommendations.length === 0 && !error && (
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What are you interested in?
            </label>
            <select
              value={recType}
              onChange={(e) => setRecType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All (Restaurants, Attractions, Activities)</option>
              <option value="restaurants">Restaurants & Cafes</option>
              <option value="attractions">Attractions & Museums</option>
              <option value="activities">Activities & Tours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget Level
            </label>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="budget">Budget</option>
              <option value="moderate">Moderate</option>
              <option value="luxury">Luxury</option>
            </select>
          </div>

          <button
            onClick={fetchRecommendations}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            disabled={loading}
          >
            <Sparkles className="w-4 h-4" />
            Get Recommendations
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-8">
          <LoadingSpinner className="w-8 h-8 text-blue-500 mb-2" />
          <p className="text-sm text-gray-600">Finding great recommendations...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchRecommendations}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Recommendations List */}
      {recommendations.length > 0 && !loading && (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-800">{rec.title}</h4>
                  <p className="text-xs font-medium text-blue-600 uppercase">
                    {rec.type}
                  </p>
                </div>
                {rec.estimated_time && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {rec.estimated_time}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-700 mb-2">{rec.description}</p>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
                <p className="text-xs text-blue-800">
                  <strong>Why:</strong> {rec.why_recommended}
                </p>
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              setRecommendations([]);
              setRecType("all");
              setBudget("moderate");
            }}
            className="w-full mt-4 text-blue-600 hover:text-blue-800 font-medium py-2 text-sm underline"
          >
            Get Different Recommendations
          </button>
        </div>
      )}

      {/* Empty State */}
      {recommendations.length === 0 && !loading && !error && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">
            Click "Get Recommendations" to discover amazing places! 🗺️
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendationsPanel;
