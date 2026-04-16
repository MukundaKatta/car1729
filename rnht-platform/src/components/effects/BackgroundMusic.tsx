"use client";

import { useState, useRef, useEffect } from "react";
import { Music2, VolumeX } from "lucide-react";

const MUSIC_PREFERENCE_KEY = "rnht-background-music";

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [userMuted, setUserMuted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const preference = window.localStorage.getItem(MUSIC_PREFERENCE_KEY);
    setUserMuted(preference === "muted");
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncPlayingState = () => {
      setIsPlaying(!audio.paused);
    };

    syncPlayingState();
    audio.addEventListener("play", syncPlayingState);
    audio.addEventListener("pause", syncPlayingState);
    audio.addEventListener("ended", syncPlayingState);

    return () => {
      audio.removeEventListener("play", syncPlayingState);
      audio.removeEventListener("pause", syncPlayingState);
      audio.removeEventListener("ended", syncPlayingState);
    };
  }, []);

  // Auto-play after first user interaction on the page
  useEffect(() => {
    function handleFirstInteraction() {
      if (!hasInteracted && !userMuted) {
        setHasInteracted(true);
        if (audioRef.current) {
          audioRef.current.volume = 0.15;
          audioRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch(() => {
            // Browser blocked autoplay — user can click the button
          });
        }
      }
    }

    document.addEventListener("click", handleFirstInteraction, { once: true });
    document.addEventListener("touchstart", handleFirstInteraction, { once: true });
    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [hasInteracted, userMuted]);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setHasInteracted(true);
    if (isPlaying) {
      audio.pause();
      setUserMuted(true);
      window.localStorage.setItem(MUSIC_PREFERENCE_KEY, "muted");
      setIsPlaying(false);
    } else {
      audio.volume = 0.15;
      audio.play().then(() => {
        setUserMuted(false);
        window.localStorage.setItem(MUSIC_PREFERENCE_KEY, "playing");
        setIsPlaying(true);
      }).catch(() => {});
    }
  };

  return (
    <>
      <audio ref={audioRef} src="/devotional-music.mp3" loop preload="auto" />
      <button
        onClick={toggleMusic}
        className="fixed bottom-4 right-4 z-50 flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: isPlaying
            ? "linear-gradient(135deg, #C5973E 0%, #E8C34A 50%, #C5973E 100%)"
            : "rgba(0,0,0,0.5)",
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
