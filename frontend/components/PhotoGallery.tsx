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
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setSelectedImage(null)}
        >
          {/* Close button — fixed to viewport top-right, never moves */}
          <button
            onClick={() => setSelectedImage(null)}
            style={{
              position: "fixed",
              top: 20,
              right: 20,
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              fontSize: 20,
              width: 40,
              height: 40,
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.35)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.2)"; }}
          >✕</button>

          {/* Prev button — fixed to viewport left-center, never moves */}
          {photoSteps.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
              style={{
                position: "fixed",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white",
                width: 44,
                height: 44,
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1001,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.3)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)"; }}
            >‹</button>
          )}

          {/* Next button — fixed to viewport right-center, never moves */}
          {photoSteps.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              style={{
                position: "fixed",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white",
                width: 44,
                height: 44,
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1001,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.3)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)"; }}
            >›</button>
          )}

          {/* Content — image + info, centred, no layout shift */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              maxWidth: "80vw",
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Counter */}
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
              {imageIndex + 1} / {photoSteps.length}
            </div>

            {/* Main image */}
            <img
              src={selectedImage.image_url}
              alt={selectedImage.location_name}
              style={{
                maxWidth: "80vw",
                maxHeight: "65vh",
                objectFit: "contain",
                borderRadius: 8,
              }}
            />

            {/* Image info */}
            <div style={{ textAlign: "center", color: "white", maxWidth: 500 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                📍 {selectedImage.location_name}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
                {new Date(selectedImage.timestamp).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </div>
              {selectedImage.note && (
                <div style={{
                  fontSize: 12, fontStyle: "italic",
                  color: "rgba(255,255,255,0.75)",
                  paddingTop: 8,
                  borderTop: "1px solid rgba(255,255,255,0.2)",
                }}>
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
