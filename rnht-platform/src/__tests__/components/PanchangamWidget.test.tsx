import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PanchangamWidget } from "@/components/panchangam/PanchangamWidget";

// Mock lucide-react
vi.mock("lucide-react", () => ({
  Sun: (props: any) => <svg data-testid="sun-icon" {...props} />,
  Moon: (props: any) => <svg data-testid="moon-icon" {...props} />,
  AlertTriangle: (props: any) => <svg data-testid="alert-icon" {...props} />,
  Star: (props: any) => <svg data-testid="star-icon" {...props} />,
  Clock: (props: any) => <svg data-testid="clock-icon" {...props} />,
}));

const mockPanchangam = {
  date: "2026-03-12",
  location: "Austin, TX",
  sunrise: "6:45 AM",
  sunset: "6:30 PM",
  tithi: { name: "Shukla Dashami", start: "6:00 AM", end: "8:00 AM", paksha: "Shukla" },
  nakshatra: { name: "Pushya", start: "7:00 AM", end: "9:00 AM" },
  yoga: { name: "Siddhi", start: "5:00 AM", end: "7:00 AM" },
  karana: { name: "Bava", start: "6:00 AM", end: "8:00 AM" },
  rahu_kalam: { start: "3:00 PM", end: "4:30 PM", warning: true },
  yama_gandam: { start: "9:00 AM", end: "10:30 AM" },
  gulika_kalam: { start: "12:00 PM", end: "1:30 PM" },
  muhurtham: { name: "Abhijit", start: "11:45 AM", end: "12:30 PM" },
  festival: null as { name: string; description: string } | null,
  vaara: "Thursday",
  masa: "Phalguna",
  samvatsara: "Shobhakrit",
};

const mockPanchangamWithFestival = {
  ...mockPanchangam,
  festival: {
    name: "Maha Shivaratri",
    description: "The great night of Lord Shiva",
  },
};

describe("PanchangamWidget", () => {
  describe("Full (non-compact) view", () => {
    it("renders the heading 'Daily Panchangam'", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} />);
      expect(screen.getByText("Daily Panchangam")).toBeInTheDocument();
    });

    it("displays vaara, masa, and samvatsara", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} />);
      // The vaara/masa/samvatsara metadata line. After the RN-096 a11y change,
      // a separate human-readable formatted-date line ("Thursday, March 12,
      // 2026") also contains the weekday, so /Thursday/ alone matches two
      // elements. Scope to the panchangam line that carries all three values.
      expect(
        screen.getByText(/Thursday \| Phalguna Masa \| Shobhakrit Samvatsara/)
      ).toBeInTheDocument();
    });

    it("displays location", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} />);
      expect(screen.getByText("Austin, TX")).toBeInTheDocument();
    });

    it("displays sunrise and sunset", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} />);
      expect(screen.getByText("6:45 AM / 6:30 PM")).toBeInTheDocument();
    });

    it("displays tithi with paksha", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} />);
      expect(screen.getByText("Shukla Shukla Dashami")).toBeInTheDocument();
    });

    it("displays nakshatra name and timing", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} />);
      expect(screen.getByText("Pushya")).toBeInTheDocument();
      expect(screen.getByText("7:00 AM - 9:00 AM")).toBeInTheDocument();
    });

    it("displays yoga name", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} />);
      expect(screen.getByText("Siddhi")).toBeInTheDocument();
    });

    it("displays karana name", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} />);
      expect(screen.getByText("Bava")).toBeInTheDocument();
    });

    it("displays rahu kalam timing", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} />);
      expect(screen.getByText("3:00 PM - 4:30 PM")).toBeInTheDocument();
    });

    it("displays yama gandam timing", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} />);
      expect(screen.getByText("9:00 AM - 10:30 AM")).toBeInTheDocument();
    });

    it("displays gulika kalam timing", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} />);
      expect(screen.getByText("12:00 PM - 1:30 PM")).toBeInTheDocument();
    });

    it("does NOT render Abhijit Muhurtham in the expanded view", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} />);
      expect(
        screen.queryByText("Abhijit Muhurtham")
      ).not.toBeInTheDocument();
      // The timing string that used to anchor it is also absent.
      expect(
        screen.queryByText("11:45 AM - 12:30 PM")
      ).not.toBeInTheDocument();
    });

    it("displays all remaining section labels", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} />);
      expect(screen.getByText("Sunrise / Sunset")).toBeInTheDocument();
      expect(screen.getByText("Tithi")).toBeInTheDocument();
      expect(screen.getByText("Nakshatra")).toBeInTheDocument();
      expect(screen.getByText("Yoga")).toBeInTheDocument();
      expect(screen.getByText("Karana")).toBeInTheDocument();
      expect(screen.getByText("Rahu Kalam")).toBeInTheDocument();
      expect(screen.getByText("Yama Gandam")).toBeInTheDocument();
      expect(screen.getByText("Gulika Kalam")).toBeInTheDocument();
    });

    it("does not show festival section when festival is null", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} />);
      expect(screen.queryByText("Festival:")).not.toBeInTheDocument();
    });

    it("shows festival when provided", () => {
      render(<PanchangamWidget panchangam={mockPanchangamWithFestival} />);
      expect(screen.getByText(/Maha Shivaratri/)).toBeInTheDocument();
      expect(screen.getByText("The great night of Lord Shiva")).toBeInTheDocument();
    });
  });

  describe("Compact view", () => {
    it("renders 'Daily Panchangam' heading", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} compact />);
      expect(screen.getByText("Daily Panchangam")).toBeInTheDocument();
    });

    it("displays vaara, masa, and samvatsara in compact format", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} compact />);
      expect(screen.getByText(/Thursday, Phalguna/)).toBeInTheDocument();
      expect(screen.getByText(/Shobhakrit/)).toBeInTheDocument();
    });

    it("shows tithi with paksha in compact view", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} compact />);
      expect(screen.getByText(/Shukla/)).toBeInTheDocument();
      expect(screen.getByText(/Shukla Dashami/)).toBeInTheDocument();
    });

    it("shows nakshatra in compact view", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} compact />);
      expect(screen.getByText(/Pushya/)).toBeInTheDocument();
    });

    it("shows rahu kalam in compact view", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} compact />);
      expect(screen.getByText(/3:00 PM/)).toBeInTheDocument();
      expect(screen.getByText(/4:30 PM/)).toBeInTheDocument();
    });

    it("shows muhurtham in compact view", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} compact />);
      expect(screen.getByText(/11:45 AM/)).toBeInTheDocument();
      expect(screen.getByText(/12:30 PM/)).toBeInTheDocument();
    });

    it("does not show sunrise/sunset in compact mode", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} compact />);
      expect(screen.queryByText("Sunrise / Sunset")).not.toBeInTheDocument();
    });

    it("does not show location in compact mode", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} compact />);
      expect(screen.queryByText("Austin, TX")).not.toBeInTheDocument();
    });

    it("shows festival in compact view when provided", () => {
      render(<PanchangamWidget panchangam={mockPanchangamWithFestival} compact />);
      expect(screen.getByText(/Maha Shivaratri/)).toBeInTheDocument();
      expect(screen.getByText("The great night of Lord Shiva")).toBeInTheDocument();
    });

    it("does not show festival in compact view when null", () => {
      render(<PanchangamWidget panchangam={mockPanchangam} compact />);
      expect(screen.queryByText("Festival:")).not.toBeInTheDocument();
    });
  });
});
