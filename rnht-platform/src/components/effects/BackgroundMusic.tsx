"use client";

import { useState, useRef, useEffect } from "react";
import { Music2, VolumeX } from "lucide-react";

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // Persist the user's intent across remounts & navigations. Once they've
  // explicitly muted, the auto-play-on-click helper must not re-start audio.
  const userMutedRef = useRef<boolean>(
    typeof window !== "undefined" && window.sessionStorage?.getItem("rnht-music-muted") === "1"
  );
  const hasAutoPlayedRef = useRef(false);

  // Auto-play after first user interaction — only if they never muted.
  useEffect(() => {
    function handleFirstInteraction(e: Event) {
      // Ignore clicks on the mute button itself so mute→click-propagation
      // doesn't immediately re-trigger play. Document targets (jsdom) have no
      // .closest(); guard so tests and real DOM behave the same.
      const target = e.target;
      if (target instanceof Element && target.closest("[data-bg-music-btn]")) return;

      if (hasAutoPlayedRef.current || userMutedRef.current) return;
      hasAutoPlayedRef.current = true;

      if (audioRef.current) {
        audioRef.current.volume = 0.15;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }

    document.addEventListener("click", handleFirstInteraction);
    document.addEventListener("touchstart", handleFirstInteraction);
    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      userMutedRef.current = true;
      hasAutoPlayedRef.current = true;
      try { window.sessionStorage?.setItem("rnht-music-muted", "1"); } catch {}
    } else {
      userMutedRef.current = false;
      try { window.sessionStorage?.removeItem("rnht-music-muted"); } catch {}
      audioRef.current.volume = 0.15;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  return (
    <>
      <audio ref={audioRef} src="/devotional-music.mp3" loop preload="auto" />
      <button
        data-bg-music-btn
        onClick={toggleMusic}
        className="fixed right-4 z-50 flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: isPlaying
            ? "linear-gradient(135deg, #C5973E 0%, #E8C34A 50%, #C5973E 100%)"
            : "rgba(0,0,0,0.5)",
          bottom: "calc(1rem + env(safe-area-inset-bottom))",
        }}
        aria-label={isPlaying ? "Mute background music" : "Play background music"}
        title={isPlaying ? "Mute music" : "Play devotional music"}
      >
        {isPlaying ? (
          <Music2 className="h-5 w-5 text-white" />
        ) : (
          <VolumeX className="h-5 w-5 text-white/60" />
        )}
      </button>
    </>
  );
}
