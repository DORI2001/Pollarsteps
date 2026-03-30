"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { useColors } from "@/lib/theme";

interface StepModalProps {
  coords: { lat: number; lng: number };
  onClose: () => void;
  onSubmit: (note: string, imageUrl?: string, locationName?: string) => Promise<void>;
}

// Compress image client-side using Canvas API before uploading
async function compressImage(file: File, maxDimension = 1600, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Scale down if either dimension exceeds the max
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      } else {
        // Already small enough — return original file unchanged
        resolve(file);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          // Keep a .jpg extension so the server knows the MIME type
          const name = file.name.replace(/\.[^.]+$/, ".jpg");
          resolve(new File([blob], name, { type: "image/jpeg", lastModified: Date.now() }));
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}

export function StepModal({ coords, onClose, onSubmit }: StepModalProps) {
  const COLORS = useColors();
  const [locationName, setLocationName] = useState("");
  const [note, setNote] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageUpload = async (file: File) => {
    setImageFile(file);
    setLoading(true);
    setError("");

    try {
      // Compress before uploading — resizes to max 1600px, ~82% JPEG quality
      const compressed = await compressImage(file);
      const sizeBefore = (file.size / 1024).toFixed(0);
      const sizeAfter = (compressed.size / 1024).toFixed(0);
      console.log(`[Image] ${sizeBefore}KB → ${sizeAfter}KB`);

      const url = await api.uploadImage(compressed);
      setImageUrl(url);
    } catch (err: any) {
      const message =
        err.message || "Failed to upload image. Please check the file and try again.";
      setError(message);
      console.error("[Upload Error]", err);
      setImageFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    
    if (!note.trim()) {
      setError("Please add a memory/note for this location");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onSubmit(note.trim(), imageUrl || undefined, locationName.trim() || undefined);
      
      setLocationName("");
      setNote("");
      setImageUrl(null);
      setImageFile(null);
      onClose();
    } catch (err: any) {
      console.error("[StepModal] Caught error from onSubmit:", {
        error: err,
        message: err?.message,
        detail: err?.detail,
        code: err?.code,
        status: err?.status,
        toString: err?.toString()
      });
      
      let message = "Failed to save memory. Please try again.";
      if (err?.message) {
        message = err.message;
      } else if (err?.detail) {
        message = err.detail;
      } else if (typeof err === 'string') {
        message = err;
      }
      
      console.error("[StepModal] Display error:", message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .modal-content { animation: slideUp 0.3s ease-out; }
      `}</style>

      <div className="modal-content" style={{ background: COLORS.surface, borderRadius: 20, padding: 32, boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)", maxWidth: 450, width: "90%", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, margin: 0 }}>Add Memory</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textSecondary, transition: "all 0.2s" }} onMouseOver={(e) => e.currentTarget.style.color = COLORS.text} onMouseOut={(e) => e.currentTarget.style.color = COLORS.textSecondary}>
            ✕
          </button>
        </div>

        {/* Location Display */}
        <div style={{ padding: 12, background: `linear-gradient(135deg, ${COLORS.primary}10 0%, ${COLORS.primaryDark}10 100%)`, borderRadius: 12, marginBottom: 20, fontSize: 13, color: COLORS.textSecondary, border: `1px solid ${COLORS.primary}20` }}>
          <p style={{ margin: "0 0 4px 0", fontWeight: 600 }}>📍 Location</p>
          <p style={{ margin: 0 }}>
            {coords.lat.toFixed(4)}°, {coords.lng.toFixed(4)}°
          </p>
        </div>

        {/* Location Name Input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 10, letterSpacing: "0.3px", textTransform: "uppercase" }}>
            Place Name (Optional)
          </label>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g., Eiffel Tower, My Favorite Cafe"
            style={{
              width: "100%",
              padding: "12px 16px",
              border: `2px solid #e2e8f0`,
              borderRadius: 12,
              fontSize: 16,
              fontFamily: "inherit",
              boxSizing: "border-box",
              background: COLORS.background,
              color: COLORS.text,
              transition: "all 0.2s",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = COLORS.primary;
              e.currentTarget.style.background = COLORS.surface;
              e.currentTarget.style.boxShadow = `0 0 0 3px rgba(102, 126, 234, 0.1)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = COLORS.background;
              e.currentTarget.style.boxShadow = "none";
            }}
            disabled={loading}
          />
        </div>

        {/* Image Upload */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 10, letterSpacing: "0.3px", textTransform: "uppercase" }}>
            Photo (Optional)
          </label>

          {imageUrl ? (
            <div style={{ position: "relative", marginBottom: 12 }}>
              <img src={imageUrl} alt="Preview" style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 12 }} />
              <button
                onClick={() => {
                  setImageUrl(null);
                  setImageFile(null);
                }}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "rgba(0, 0, 0, 0.6)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <label style={{ display: "block", padding: "40px", border: `2px dashed #e2e8f0`, borderRadius: 12, textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: COLORS.background }} onMouseOver={(e) => { e.currentTarget.style.borderColor = COLORS.primary; e.currentTarget.style.background = `${COLORS.primary}08`; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = COLORS.background; }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📸</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, margin: "0 0 4px 0" }}>
                {loading ? "Uploading..." : "Drop image or click to select"}
              </p>
              <p style={{ fontSize: 12, color: COLORS.textSecondary, margin: 0 }}>PNG, JPG up to 10MB · auto-compressed</p>
              <input type="file" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} style={{ display: "none" }} disabled={loading} />
            </label>
          )}
        </div>

        {/* Note Input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 10, letterSpacing: "0.3px", textTransform: "uppercase" }}>
            Memory
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What happened here? What did you see, feel, or experience?"
            style={{
              width: "100%",
              padding: "12px 16px",
              border: `2px solid #e2e8f0`,
              borderRadius: 12,
              fontSize: 16,
              fontFamily: "inherit",
              resize: "none",
              height: 100,
              boxSizing: "border-box",
              background: COLORS.background,
              color: COLORS.text,
              transition: "all 0.2s",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = COLORS.primary;
              e.currentTarget.style.background = COLORS.surface;
              e.currentTarget.style.boxShadow = `0 0 0 3px rgba(102, 126, 234, 0.1)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = COLORS.background;
              e.currentTarget.style.boxShadow = "none";
            }}
            disabled={loading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ padding: 12, background: "rgba(255, 59, 48, 0.1)", color: COLORS.error, borderRadius: 8, fontSize: 13, marginBottom: 16, border: `1px solid ${COLORS.error}40` }}>
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onClose} disabled={loading} style={{ flex: 1, padding: "12px 16px", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", color: COLORS.text, transition: "all 0.2s", opacity: loading ? 0.6 : 1 }} onMouseOver={(e) => { e.currentTarget.style.background = COLORS.background; }} onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !note.trim()}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading || !note.trim() ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: loading || !note.trim() ? 0.6 : 1,
            }}
            onMouseOver={(e) => {
              if (!loading && note.trim()) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.4)";
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {loading ? "Saving..." : "Save Memory"}
          </button>
        </div>
      </div>
    </div>
  );
}
