import React, { useState, useRef, useEffect } from "react";

interface LocationSearchProps {
  onLocationSelected: (location: {
    name: string;
    lat: number;
    lon: number;
  }) => void;
  token: string;
}

interface SearchResult {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  country: string;
  display_name: string;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelected,
  token,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search function
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);

    // Debounce the search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          location: query,
        });

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/geocoding/geocode?${params}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 404 || response.status === 204) {
          setResults([]);
          setShowResults(true);
        } else if (!response.ok) {
          console.error("Search failed:", response.status);
          setResults([]);
        } else {
          const data = await response.json();
          if (data) {
            setResults([data]); // Single result from geocoding
            setShowResults(true);
          } else {
            setResults([]);
          }
        }
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce
  };

  const handleSelectResult = (result: SearchResult) => {
    onLocationSelected({
      name: result.display_name,
      lat: result.latitude,
      lon: result.longitude,
    });
    setSearchQuery("");
    setResults([]);
    setShowResults(false);
  };

  useEffect(() => {
    // Close results on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (
        e.target instanceof HTMLElement &&
        !e.target.closest(".location-search-container")
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="location-search-container relative">
      <div className="flex items-center bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <span className="px-3 text-gray-400">🔍</span>
        <input
          type="text"
          placeholder="Search location... (e.g., Tel Aviv, Israel)"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => searchQuery && setShowResults(true)}
          className="flex-1 px-3 py-3 outline-none text-gray-800 placeholder-gray-400"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setResults([]);
              setShowResults(false);
            }}
            className="px-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-64 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-gray-500">
              <div className="inline-block animate-spin">⏳</div> Searching...
            </div>
          )}

          {!loading && results.length > 0 && (
            <div>
              {results.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectResult(result)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="font-semibold text-gray-800 text-sm">
                    📍 {result.display_name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {result.country && `${result.country} • `}
                    <span>
                      {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && results.length === 0 && searchQuery && (
            <div className="p-4 text-center text-gray-500 text-sm">
              No locations found for "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
