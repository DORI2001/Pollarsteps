import { useState, useEffect, useRef } from "react";

interface ReelPlayback {
  currentSlide: number;
  isPlaying: boolean;
  reelFinished: boolean;
  startPlaying: () => void;
  reset: () => void;
}

export function useReelPlayback(numSlides: number, slideDurationMs: number): ReelPlayback {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reelFinished, setReelFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentSlide >= numSlides) {
      setIsPlaying(false);
      setReelFinished(true);
      return;
    }
    timerRef.current = setTimeout(() => {
      setCurrentSlide((prev) => prev + 1);
    }, slideDurationMs);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentSlide, slideDurationMs, numSlides]);

  const startPlaying = () => {
    setCurrentSlide(0);
    setReelFinished(false);
    setIsPlaying(true);
  };

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentSlide(0);
    setIsPlaying(false);
    setReelFinished(false);
  };

  return { currentSlide, isPlaying, reelFinished, startPlaying, reset };
}
