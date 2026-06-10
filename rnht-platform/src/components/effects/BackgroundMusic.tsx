"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Music2, VolumeX } from "lucide-react";

const MUSIC_PREFERENCE_KEY = "rnht-background-music";
const TARGET_VOLUME = 0.15;
const FADE_DURATION_MS = 220;
const FADE_INTERVAL_MS = 20;

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeIntervalRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [, setUserMuted] = useState(false);

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

  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current !== null) {
        window.clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  const fadeAudio = useCallback((targetVolume: number, onComplete?: () => void) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (fadeIntervalRef.current !== null) {
      window.clearInterval(fadeIntervalRef.current);
    }

    const startVolume = audio.volume;
    const steps = Math.max(1, Math.round(FADE_DURATION_MS / FADE_INTERVAL_MS));
    const volumeStep = (targetVolume - startVolume) / steps;
    let currentStep = 0;

    fadeIntervalRef.current = window.setInterval(() => {
      currentStep += 1;
      const nextVolume =
        currentStep >= steps ? targetVolume : Math.max(0, Math.min(TARGET_VOLUME, audio.volume + volumeStep));

      audio.volume = nextVolume;

      if (currentStep >= steps) {
        if (fadeIntervalRef.current !== null) {
          window.clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        onComplete?.();
      }
    }, FADE_INTERVAL_MS);
  }, []);

  const startPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0;
    setIsPlaying(true);
    audio
      .play()
      .then(() => {
        fadeAudio(TARGET_VOLUME);
      })
      .catch(() => {
        audio.volume = TARGET_VOLUME;
        setIsPlaying(false);
      });
  }, [fadeAudio]);

  // Music is strictly opt-in: playback starts only from the explicit toggle
  // button below. (The old behavior — starting on the user's first tap
  // anywhere — surprised mobile users with audio in public settings.)

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      setIsPlaying(false);
      fadeAudio(0, () => {
        audio.pause();
        audio.volume = TARGET_VOLUME;
      });
      setUserMuted(true);
      window.localStorage.setItem(MUSIC_PREFERENCE_KEY, "muted");
    } else {
      setUserMuted(false);
      window.localStorage.setItem(MUSIC_PREFERENCE_KEY, "playing");
      startPlayback();
    }
  };

  return (
    <>
      {/* preload="none": don't force a multi-MB download on every page view —
          the file is fetched only when the user opts into music. */}
      <audio ref={audioRef} src="/devotional-music.mp3" loop preload="none" />
      <button
        onClick={toggleMusic}
        className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 sm:h-11 sm:w-11"
        style={{
          background: isPlaying
            ? "linear-gradient(135deg, #C5973E 0%, #E8C34A 50%, #C5973E 100%)"
            : "rgba(17,24,39,0.62)",
          backdropFilter: "blur(8px)",
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
