"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useColors } from "@/lib/theme";
import { api, session as authSession } from "@/lib/api";

interface Trip {
  id: string;
  title: string;
  steps?: any[];
}

interface StoryReelModalProps {
  trip: Trip;
  onClose: () => void;
}

type ModalStep = "configure" | "preview" | "playing";

export function StoryReelModal({ trip, onClose }: StoryReelModalProps) {
  const COLORS = useColors();
  const [modalStep, setModalStep] = useState<ModalStep>("configure");

  // Song search
  const [songQuery, setSongQuery] = useState("");
  const [songResults, setSongResults] = useState<any[]>([]);
  const [songSelected, setSongSelected] = useState<any | null>(null);
  const [songSearching, setSongSearching] = useState(false);
  const [songError, setSongError] = useState("");
  const searchTimerRef = useRef<any>(null);

  // Clip selection
  const [clipDuration, setClipDuration] = useState<15 | 30>(15);
  const [startTime, setStartTime] = useState(0);
  const [maxStartTime, setMaxStartTime] = useState(225); // default: 4min - 15s

  // Story creation
  const [creating, setCreating] = useState(false);
  const [createdStory, setCreatedStory] = useState<any | null>(null);
  const [storyError, setStoryError] = useState("");
  const [shareLink, setShareLink] = useState("");

  // Reel playback
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reelFinished, setReelFinished] = useState(false);
  const [copied, setCopied] = useState(false);
  const slideTimerRef = useRef<any>(null);
  const reelContainerRef = useRef<HTMLDivElement>(null);

  const steps = trip.steps || [];
  const numSlides = Math.max(steps.length, 1);
  const slideDurationMs = (clipDuration * 1000) / numSlides;

  // ---- Song search ----
  const searchSongs = useCallback((query: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!query.trim()) { setSongResults([]); return; }
    searchTimerRef.current = setTimeout(async () => {
      setSongSearching(true);
      setSongError("");
      try {
        const res = await fetch(`/api/music/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Music search failed. Make sure your YouTube API key is set.");
        const data = await res.json();
        setSongResults(data.items || []);
      } catch (err: any) {
        setSongError(err?.message || "Search failed");
        setSongResults([]);
      } finally {
        setSongSearching(false);
      }
    }, 350);
  }, []);

  const handleSongQueryChange = (q: string) => {
    setSongQuery(q);
    searchSongs(q);
  };

  const handleSelectSong = (item: any) => {
    setSongSelected(item);
    // Reset start time when new song selected
    setStartTime(0);
    setMaxStartTime(240 - clipDuration);
  };

  // Update max start time when clip duration changes
  useEffect(() => {
    setMaxStartTime(Math.max(0, 240 - clipDuration));
    setStartTime(prev => Math.min(prev, Math.max(0, 240 - clipDuration)));
  }, [clipDuration]);

  // ---- Story creation ----
  const handleCreateReel = async () => {
    const token = authSession.getToken();
    if (!token) { alert("Please sign in to create a reel"); return; }
    setCreating(true);
    setStoryError("");
    try {
      const story = await (api as any).createStory(token, trip.id, {
        includeMap: true,
        shareable: true,
        maxSlides: 15,
        songProvider: songSelected?.provider || null,
        songId: songSelected?.id || null,
        songTitle: songSelected?.title || null,
        songThumbnail: songSelected?.thumbnail || null,
        songStartTime: startTime,
        songDuration: clipDuration,
      });
      setCreatedStory(story);
      if (story.share_token) {
        setShareLink(`${window.location.origin}/api/stories/public/${story.share_token}`);
      }
      setModalStep("preview");
    } catch (err: any) {
      setStoryError(err?.message || "Failed to create reel");
    } finally {
      setCreating(false);
    }
  };

  // ---- Reel playback ----
  const startPlaying = () => {
    setCurrentSlide(0);
    setReelFinished(false);
    setIsPlaying(true);
    setModalStep("playing");
  };

  useEffect(() => {
    if (!isPlaying) return;
    if (currentSlide >= numSlides) {
      setIsPlaying(false);
      setReelFinished(true);
      return;
    }
    slideTimerRef.current = setTimeout(() => {
      setCurrentSlide(prev => prev + 1);
    }, slideDurationMs);
    return () => { if (slideTimerRef.current) clearTimeout(slideTimerRef.current); };
  }, [isPlaying, currentSlide, slideDurationMs, numSlides]);

  const handleCopyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(shareLink);
    }
  };

  const handleNativeShare = async () => {
    if (!shareLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${trip.title} — Reel`,
          text: `Check out my travel reel from ${trip.title}!`,
          url: shareLink,
        });
      } catch { /* cancelled */ }
    } else {
      handleCopyLink();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const youtubeClipSrc = songSelected
    ? `https://www.youtube.com/embed/${songSelected.id}?start=${startTime}&end=${startTime + clipDuration}&autoplay=1&controls=0&mute=0&modestbranding=1&rel=0`
    : "";

  const youtubeReelSrc = songSelected
    ? `https://www.youtube.com/embed/${songSelected.id}?start=${startTime}&end=${startTime + clipDuration}&autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&loop=0`
    : "";

  // ─── CONFIGURE STEP ────────────────────────────────────────────────────────
  if (modalStep === "configure") {
    return (
      <div
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 2000,
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: COLORS.surface,
            borderRadius: 28,
            width: 540,
            maxWidth: "94vw",
            maxHeight: "90vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 32px 64px rgba(0,0,0,0.25)",
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: "24px 28px 0 28px",
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, margin: 0 }}>
                🎬 Create Reel
              </h2>
              <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: "4px 0 0 0" }}>
                Turn your trip into an Instagram-style reel
              </p>
            </div>
            <button onClick={onClose} style={{
              border: "none", background: "transparent", cursor: "pointer",
              fontSize: 22, color: COLORS.textSecondary, lineHeight: 1,
              padding: "0 4px",
            }}>×</button>
          </div>

          {/* Scrollable content */}
          <div style={{ overflowY: "auto", padding: "20px 28px 28px 28px" }}>

            {/* Duration selector */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 10 }}>
                Reel Duration
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {([15, 30] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setClipDuration(d)}
                    style={{
                      flex: 1, padding: "12px 0", borderRadius: 14,
                      border: clipDuration === d ? `2px solid ${COLORS.primary}` : `2px solid ${COLORS.border}`,
                      background: clipDuration === d ? `${COLORS.primary}15` : COLORS.inputBg,
                      color: clipDuration === d ? COLORS.primary : COLORS.text,
                      fontWeight: 600, fontSize: 15, cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            {/* Song search */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 10 }}>
                Choose Song (YouTube)
              </div>
              <input
                type="text"
                placeholder="Search artist or song title..."
                value={songQuery}
                onChange={e => handleSongQueryChange(e.target.value)}
                style={{
                  width: "100%", padding: "11px 14px",
                  borderRadius: 12, border: `1px solid ${COLORS.border}`,
                  background: COLORS.inputBg, color: COLORS.text,
                  fontSize: 14, boxSizing: "border-box",
                  outline: "none",
                } as React.CSSProperties}
              />
              {songError && (
                <div style={{ color: COLORS.error, fontSize: 12, marginTop: 6 }}>{songError}</div>
              )}
            </div>

            {/* Search results */}
            {(songSearching || songResults.length > 0) && !songSelected && (
              <div style={{
                maxHeight: 220, overflowY: "auto",
                borderRadius: 12, border: `1px solid ${COLORS.border}`,
                background: COLORS.inputBg, marginBottom: 16,
              }}>
                {songSearching && (
                  <div style={{ padding: 14, fontSize: 13, color: COLORS.textSecondary }}>Searching...</div>
                )}
                {!songSearching && songResults.length === 0 && songQuery.trim() && (
                  <div style={{ padding: 14, fontSize: 13, color: COLORS.textSecondary }}>No results</div>
                )}
                {!songSearching && songResults.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSong(item)}
                    style={{
                      width: "100%", display: "flex", gap: 12,
                      padding: "10px 12px", border: "none",
                      background: "transparent", cursor: "pointer",
                      textAlign: "left", alignItems: "center",
                      transition: "background 0.15s",
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = `${COLORS.primary}10`)}
                    onMouseOut={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {item.thumbnail && (
                      <img src={item.thumbnail} alt={item.title}
                        style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 2 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{item.channel}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected song + clip picker */}
            {songSelected && (
              <div style={{
                background: COLORS.inputBg, borderRadius: 16,
                border: `1px solid ${COLORS.border}`, padding: 14,
                marginBottom: 16,
              }}>
                {/* Selected song header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  {songSelected.thumbnail && (
                    <img src={songSelected.thumbnail} alt={songSelected.title}
                      style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{songSelected.title}</div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{songSelected.channel}</div>
                  </div>
                  <button
                    onClick={() => { setSongSelected(null); setSongResults([]); setSongQuery(""); }}
                    style={{
                      border: `1px solid ${COLORS.border}`, background: "transparent",
                      borderRadius: 8, padding: "5px 10px", fontSize: 12,
                      cursor: "pointer", color: COLORS.textSecondary,
                    }}
                  >
                    Change
                  </button>
                </div>

                {/* Start time scrubber */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>
                      Clip start: {formatTime(startTime)}
                    </span>
                    <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
                      Plays: {formatTime(startTime)} – {formatTime(startTime + clipDuration)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={maxStartTime}
                    value={startTime}
                    onChange={e => setStartTime(Number(e.target.value))}
                    style={{ width: "100%", accentColor: COLORS.primary, cursor: "pointer" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>
                    <span>0:00</span>
                    <span>Drag to choose clip</span>
                    <span>{formatTime(maxStartTime)}</span>
                  </div>
                </div>

                {/* YouTube preview */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>
                    Preview clip ({clipDuration}s)
                  </div>
                  <div style={{ position: "relative", paddingTop: "40%", borderRadius: 12, overflow: "hidden" }}>
                    <iframe
                      key={`${songSelected.id}-${startTime}-${clipDuration}`}
                      title="Clip preview"
                      src={youtubeClipSrc}
                      style={{
                        position: "absolute", top: 0, left: 0,
                        width: "100%", height: "100%", border: "none",
                      }}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  </div>
                  <p style={{ fontSize: 11, color: COLORS.textSecondary, margin: "6px 0 0 0" }}>
                    ☝️ Drag the slider above to preview different parts
                  </p>
                </div>
              </div>
            )}

            {/* Trip info */}
            <div style={{
              background: `${COLORS.primary}0D`, borderRadius: 12,
              padding: "10px 14px", marginBottom: 18, fontSize: 13,
              color: COLORS.textSecondary, display: "flex", gap: 6, alignItems: "center",
            }}>
              <span>📍</span>
              <span>
                {steps.length} location{steps.length !== 1 ? "s" : ""} from <strong style={{ color: COLORS.text }}>{trip.title}</strong>
              </span>
            </div>

            {storyError && (
              <div style={{
                color: COLORS.error, fontSize: 13, marginBottom: 14,
                background: `${COLORS.error}15`, padding: "10px 14px",
                borderRadius: 10, border: `1px solid ${COLORS.error}40`,
              }}>
                {storyError}
              </div>
            )}

            {/* Create button */}
            <button
              onClick={handleCreateReel}
              disabled={creating || steps.length === 0}
              style={{
                width: "100%", padding: "14px 0",
                borderRadius: 14, border: "none",
                background: creating || steps.length === 0
                  ? COLORS.border
                  : `linear-gradient(135deg, ${COLORS.secondary} 0%, #0ea5e9 100%)`,
                color: "white", fontWeight: 700, fontSize: 15,
                cursor: creating || steps.length === 0 ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                boxShadow: creating ? "none" : "0 8px 24px rgba(14, 165, 233, 0.3)",
              }}
            >
              {creating ? "Creating reel..." : steps.length === 0 ? "Add locations first" : "🎬 Create Reel"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── PREVIEW STEP ──────────────────────────────────────────────────────────
  if (modalStep === "preview") {
    return (
      <div
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 2000,
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: COLORS.surface,
            borderRadius: 28,
            width: 460,
            maxWidth: "94vw",
            boxShadow: "0 32px 64px rgba(0,0,0,0.25)",
            overflow: "hidden",
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Success header */}
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.secondary}22, #0ea5e920)`,
            padding: "32px 28px 24px 28px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎬</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, margin: "0 0 6px 0" }}>
              Reel Ready!
            </h2>
            <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: 0 }}>
              {steps.length} slides · {clipDuration}s
              {songSelected ? ` · ${songSelected.title}` : " · No soundtrack"}
            </p>
          </div>

          <div style={{ padding: "24px 28px 28px 28px" }}>
            {/* Play button */}
            <button
              onClick={startPlaying}
              style={{
                width: "100%", padding: "14px 0",
                borderRadius: 14, border: "none",
                background: `linear-gradient(135deg, ${COLORS.secondary} 0%, #0ea5e9 100%)`,
                color: "white", fontWeight: 700, fontSize: 16,
                cursor: "pointer", marginBottom: 12,
                boxShadow: "0 8px 24px rgba(14, 165, 233, 0.3)",
                transition: "all 0.2s",
              }}
              onMouseOver={e => (e.currentTarget.style.opacity = "0.9")}
              onMouseOut={e => (e.currentTarget.style.opacity = "1")}
            >
              ▶ Play Reel
            </button>

            {/* Share & Download row */}
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <button
                onClick={handleCopyLink}
                disabled={!shareLink}
                style={{
                  flex: 1, padding: "12px 0",
                  borderRadius: 14, border: `1.5px solid ${COLORS.border}`,
                  background: "transparent", color: COLORS.text,
                  fontWeight: 600, fontSize: 14, cursor: "pointer",
                  transition: "all 0.2s",
                  opacity: shareLink ? 1 : 0.4,
                }}
                onMouseOver={e => (e.currentTarget.style.background = `${COLORS.primary}0A`)}
                onMouseOut={e => (e.currentTarget.style.background = "transparent")}
              >
                {copied ? "✓ Copied!" : "🔗 Copy Link"}
              </button>
              <button
                onClick={handleNativeShare}
                disabled={!shareLink}
                style={{
                  flex: 1, padding: "12px 0",
                  borderRadius: 14, border: `1.5px solid ${COLORS.primary}`,
                  background: `${COLORS.primary}10`, color: COLORS.primary,
                  fontWeight: 600, fontSize: 14, cursor: "pointer",
                  transition: "all 0.2s",
                  opacity: shareLink ? 1 : 0.4,
                }}
                onMouseOver={e => (e.currentTarget.style.background = `${COLORS.primary}20`)}
                onMouseOut={e => (e.currentTarget.style.background = `${COLORS.primary}10`)}
              >
                ↗ Share
              </button>
            </div>

            {shareLink && (
              <div style={{
                background: COLORS.inputBg, borderRadius: 10,
                padding: "10px 12px", fontSize: 11,
                color: COLORS.textSecondary, wordBreak: "break-all",
                border: `1px solid ${COLORS.border}`,
                marginBottom: 12,
              }}>
                {shareLink}
              </div>
            )}

            <button
              onClick={() => setModalStep("configure")}
              style={{
                width: "100%", padding: "11px 0",
                borderRadius: 12, border: `1px solid ${COLORS.border}`,
                background: "transparent", color: COLORS.textSecondary,
                fontWeight: 500, fontSize: 13, cursor: "pointer",
              }}
            >
              ← Back to settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── PLAYING STEP ──────────────────────────────────────────────────────────
  const currentStep = steps[currentSlide] || steps[steps.length - 1] || null;
  const progress = numSlides > 0 ? (currentSlide / numSlides) * 100 : 0;

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "#000",
        display: "flex", flexDirection: "column",
        zIndex: 3000,
      }}
      ref={reelContainerRef}
    >
      {/* Progress bars */}
      <div style={{
        position: "absolute", top: 12, left: 12, right: 12,
        display: "flex", gap: 4, zIndex: 10,
      }}>
        {steps.map((_, idx) => (
          <div key={idx} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: "rgba(255,255,255,0.35)",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              background: "white",
              width: idx < currentSlide
                ? "100%"
                : idx === currentSlide && isPlaying
                  ? "100%"
                  : "0%",
              transition: idx === currentSlide && isPlaying
                ? `width ${slideDurationMs}ms linear`
                : "none",
            }} />
          </div>
        ))}
      </div>

      {/* Close & share buttons */}
      <div style={{
        position: "absolute", top: 28, right: 16,
        display: "flex", gap: 8, zIndex: 10,
      }}>
        <button
          onClick={() => {
            setModalStep("preview");
            setIsPlaying(false);
          }}
          style={{
            background: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(10px)",
            border: "none", borderRadius: 20,
            padding: "8px 14px", color: "white",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          ↗ Share
        </button>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(10px)",
            border: "none", borderRadius: 20,
            width: 36, height: 36, color: "white",
            fontSize: 20, cursor: "pointer", lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Trip title */}
      <div style={{
        position: "absolute", top: 28, left: 16, zIndex: 10,
      }}>
        <div style={{
          color: "white", fontWeight: 700, fontSize: 15,
          textShadow: "0 1px 4px rgba(0,0,0,0.5)",
        }}>
          {trip.title}
        </div>
        {songSelected && (
          <div style={{
            color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <span>♪</span>
            <span>{songSelected.title}</span>
          </div>
        )}
      </div>

      {/* Main slide */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        {currentStep?.image_url ? (
          <img
            key={currentSlide}
            src={currentStep.image_url}
            alt={currentStep.location_name || ""}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              animation: "kenBurns 4s ease-in-out forwards",
            }}
          />
        ) : (
          <div
            key={currentSlide}
            style={{
              width: "100%", height: "100%",
              background: `linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "fadeSlide 0.5s ease-out",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>📍</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "white", letterSpacing: "-0.5px" }}>
                {currentStep?.location_name || trip.title}
              </div>
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.75) 100%)",
          pointerEvents: "none",
        }} />

        {/* Location label */}
        {currentStep && (
          <div style={{
            position: "absolute", bottom: 32, left: 20, right: 20,
            animation: "slideUp 0.4s ease-out",
          }}>
            <div style={{
              fontSize: 22, fontWeight: 700, color: "white",
              textShadow: "0 2px 8px rgba(0,0,0,0.6)",
              marginBottom: 4,
            }}>
              {currentStep.location_name || currentStep.note || "Memory"}
            </div>
            {currentStep.note && currentStep.location_name && (
              <div style={{
                fontSize: 14, color: "rgba(255,255,255,0.8)",
                textShadow: "0 1px 4px rgba(0,0,0,0.5)",
              }}>
                {currentStep.note}
              </div>
            )}
            {currentStep.timestamp && (
              <div style={{
                fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4,
              }}>
                {new Date(currentStep.timestamp).toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric",
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* YouTube audio player (small, at bottom) */}
      {songSelected && isPlaying && (
        <div style={{
          position: "absolute", bottom: -200, left: 0,
          width: 1, height: 1, overflow: "hidden",
          pointerEvents: "none", opacity: 0,
        }}>
          <iframe
            key={`reel-audio-${isPlaying}`}
            title="Reel audio"
            src={youtubeReelSrc}
            allow="autoplay; encrypted-media"
            style={{ width: 1, height: 1 }}
          />
        </div>
      )}

      {/* Finished overlay */}
      {reelFinished && (
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.85)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 16, zIndex: 20,
          animation: "fadeIn 0.5s ease-out",
        }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 16, right: 16,
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(10px)",
              border: "none", borderRadius: "50%",
              width: 36, height: 36, color: "white",
              fontSize: 20, cursor: "pointer", lineHeight: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >×</button>
          <div style={{ fontSize: 56 }}>✨</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "white" }}>
            {trip.title}
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
            {steps.length} memories · {clipDuration}s
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              onClick={startPlaying}
              style={{
                padding: "12px 24px", borderRadius: 24,
                background: "white", color: "#000",
                border: "none", fontWeight: 700, fontSize: 15,
                cursor: "pointer",
              }}
            >
              ↺ Replay
            </button>
            <button
              onClick={handleCopyLink}
              disabled={!shareLink}
              style={{
                padding: "12px 24px", borderRadius: 24,
                background: "rgba(255,255,255,0.15)", color: "white",
                border: "1.5px solid rgba(255,255,255,0.4)",
                fontWeight: 600, fontSize: 15, cursor: "pointer",
                opacity: shareLink ? 1 : 0.4,
              }}
            >
              {copied ? "✓ Copied!" : "🔗 Share Link"}
            </button>
            <button
              onClick={handleNativeShare}
              disabled={!shareLink}
              style={{
                padding: "12px 24px", borderRadius: 24,
                background: "rgba(14,165,233,0.8)", color: "white",
                border: "none", fontWeight: 600, fontSize: 15,
                cursor: "pointer",
                opacity: shareLink ? 1 : 0.4,
              }}
            >
              ↗ Share
            </button>
          </div>
        </div>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes kenBurns {
          from { transform: scale(1.08) translateX(10px); }
          to   { transform: scale(1) translateX(0px); }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
