import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { BackgroundMusic } from "@/components/effects/BackgroundMusic";

vi.mock("lucide-react", () => ({
  Music2: (props: any) => <svg data-testid="music-icon" {...props} />,
  VolumeX: (props: any) => <svg data-testid="volume-x-icon" {...props} />,
}));

describe("BackgroundMusic", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  it("renders the audio element with the devotional track", () => {
    const { container } = render(<BackgroundMusic />);
    const audio = container.querySelector("audio");
    expect(audio).toBeInTheDocument();
    expect(audio).toHaveAttribute("src", "/devotional-music.mp3");
    expect(audio).toHaveAttribute("loop");
  });

  it("starts in the muted state", () => {
    render(<BackgroundMusic />);
    const button = screen.getByRole("button", { name: "Play background music" });
    expect(button).toHaveAttribute("title", "Play devotional music");
    expect(screen.getByTestId("volume-x-icon")).toBeInTheDocument();
  });

  it("plays on click and updates the button state", async () => {
    const { container } = render(<BackgroundMusic />);
    const button = screen.getByRole("button");
    const audio = container.querySelector("audio") as HTMLAudioElement;

    await act(async () => {
      fireEvent.click(button);
      await Promise.resolve();
      vi.runAllTimers();
    });

    expect(audio.play).toHaveBeenCalled();
    expect(audio.volume).toBe(0.15);
    expect(screen.getByRole("button", { name: "Mute background music" })).toBeInTheDocument();
    expect(screen.getByTestId("music-icon")).toBeInTheDocument();
  });

  it("pauses on second click", async () => {
    const { container } = render(<BackgroundMusic />);
    const button = screen.getByRole("button");
    const audio = container.querySelector("audio") as HTMLAudioElement;

    await act(async () => {
      fireEvent.click(button);
      await Promise.resolve();
      vi.runAllTimers();
    });

    await act(async () => {
      fireEvent.click(button);
      await Promise.resolve();
      vi.runAllTimers();
    });

    expect(audio.pause).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Play background music" })).toBeInTheDocument();
  });

  it("attempts autoplay on first document interaction", async () => {
    const { container } = render(<BackgroundMusic />);
    const audio = container.querySelector("audio") as HTMLAudioElement;

    await act(async () => {
      fireEvent.click(document);
      await Promise.resolve();
      vi.runAllTimers();
    });

    expect(audio.play).toHaveBeenCalled();
  });

  it("does not autoplay again after the user mutes music", async () => {
    const { container } = render(<BackgroundMusic />);
    const button = screen.getByRole("button");
    const audio = container.querySelector("audio") as HTMLAudioElement;

    await act(async () => {
      fireEvent.click(button);
      await Promise.resolve();
      vi.runAllTimers();
    });

    await act(async () => {
      fireEvent.click(button);
      await Promise.resolve();
      vi.runAllTimers();
    });

    vi.clearAllMocks();

    await act(async () => {
      fireEvent.click(document);
      await Promise.resolve();
      vi.runAllTimers();
    });

    expect(audio.play).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Play background music" })).toBeInTheDocument();
  });

  it("respects a persisted muted preference across reloads", async () => {
    window.localStorage.setItem("rnht-background-music", "muted");
    const { container } = render(<BackgroundMusic />);
    const audio = container.querySelector("audio") as HTMLAudioElement;

    await act(async () => {
      fireEvent.click(document);
      await Promise.resolve();
      vi.runAllTimers();
    });

    expect(audio.play).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Play background music" })).toBeInTheDocument();
  });

  it("keeps the floating control pinned to the bottom-right corner", () => {
    render(<BackgroundMusic />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("fixed", "right-4", "z-50");
  });
});
