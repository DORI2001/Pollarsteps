"use client";

import React, { useState } from "react";

const COLORS = {
  primary: "#667eea",
  primaryDark: "#764ba2",
  background: "#F5F5F7",
  surface: "#FFFFFF",
  text: "#1D1D1D",
  textSecondary: "#86868B",
  border: "#E5E5EA",
};

interface PhotoStep {
  id: string;
  image_url: string;
  location_name?: string;
  timestamp: string;
  note?: string;
}

interface PhotoGalleryProps {
  steps: any[];
  title: string;
}

export function PhotoGallery({ steps, title }: PhotoGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<PhotoStep | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  // Filter steps with images
  const photoSteps: PhotoStep[] = steps
    .filter((step) => step.image_url)
    .map((step, index) => ({
      id: step.id,
      image_url: step.image_url,
      location_name: step.location_name || `Location ${index + 1}`,
      timestamp: step.timestamp,
      note: step.note,
    }));

  if (photoSteps.length === 0) {
    return (
      <div
        style={{
          padding: 32,
          textAlign: "center",
          background: COLORS.background,
          borderRadius: 8,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
        <div style={{ fontSize: 14, color: COLORS.textSecondary }}>
          No photos yet. Add images to your trip locations!
        </div>
      </div>
    );
  }

  const handlePrevious = () => {
    const newIndex = imageIndex === 0 ? photoSteps.length - 1 : imageIndex - 1;
    setImageIndex(newIndex);
    setSelectedImage(photoSteps[newIndex]);
  };

  const handleNext = () => {
    const newIndex = imageIndex === photoSteps.length - 1 ? 0 : imageIndex + 1;
    setImageIndex(newIndex);
    setSelectedImage(photoSteps[newIndex]);
  };

  const handleImageClick = (image: PhotoStep, index: number) => {
    setSelectedImage(image);
    setImageIndex(index);
  };

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 12,
          padding: 12,
          background: COLORS.background,
          borderRadius: 8,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        {photoSteps.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => handleImageClick(photo, index)}
            style={{
              position: "relative",
              aspectRatio: "1",
              borderRadius: 8,
              overflow: "hidden",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "scale(1.05)";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 4px 16px rgba(0, 0, 0, 0.2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 2px 8px rgba(0, 0, 0, 0.1)";
            }}
          >
            <img
              src={photo.image_url}
              alt={photo.location_name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                color: "white",
                padding: "8px 6px",
                fontSize: "10px",
                fontWeight: 600,
              }}
            >
              {photo.location_name}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.95)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            overflow: "auto",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setSelectedImage(null)}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              maxWidth: "90vw",
              maxHeight: "90vh",
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                color: "white",
                fontSize: 24,
                width: 40,
                height: 40,
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
                zIndex: 1000,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255, 255, 255, 0.3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255, 255, 255, 0.2)";
              }}
            >
              ✕
            </button>

            {/* Main image */}
            <img
              src={selectedImage.image_url}
              alt={selectedImage.location_name}
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
                borderRadius: 8,
              }}
            />

            {/* Navigation */}
            <div
              style={{
                display: "flex",
                gap: 16,
                marginTop: 20,
                alignItems: "center",
              }}
            >
              <button
                onClick={handlePrevious}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  color: "white",
                  padding: "10px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255, 255, 255, 0.2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255, 255, 255, 0.1)";
                }}
              >
                ← Previous
              </button>

              <div
                style={{
                  color: "white",
                  fontSize: 12,
                  minWidth: 80,
                  textAlign: "center",
                }}
              >
                {imageIndex + 1} / {photoSteps.length}
              </div>

              <button
                onClick={handleNext}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  color: "white",
                  padding: "10px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255, 255, 255, 0.2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255, 255, 255, 0.1)";
                }}
              >
                Next →
              </button>
            </div>

            {/* Image info */}
            <div
              style={{
                marginTop: 16,
                textAlign: "center",
                color: "white",
                maxWidth: 600,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                📍 {selectedImage.location_name}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.7)", marginBottom: 8 }}>
                {new Date(selectedImage.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              {selectedImage.note && (
                <div
                  style={{
                    fontSize: 12,
                    fontStyle: "italic",
                    color: "rgba(255, 255, 255, 0.8)",
                    paddingTop: 8,
                    borderTop: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  💭 {selectedImage.note}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
