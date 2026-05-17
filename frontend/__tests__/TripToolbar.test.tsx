import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

const { mockGetToken, mockShareTrip } = vi.hoisted(() => ({
  mockGetToken: vi.fn(() => "fake-token"),
  mockShareTrip: vi.fn(),
}));

vi.mock("@/lib/theme", () => ({
  useColors: () => ({
    primary: "#5B6CF0", primaryDark: "#7C3AED", secondary: "#06B6D4",
    background: "#F2F2F7", surface: "#fff", surfaceElevated: "#fff",
    text: "#1C1C1E", textSecondary: "#6E6E73", border: "#D1D1D6",
    headerBg: "rgba(255,255,255,0.85)", success: "#34C759",
  }),
}));

vi.mock("@/lib/api", () => ({
  api: { shareTrip: mockShareTrip, revokeShareLink: vi.fn(), updateTrip: vi.fn() },
  session: { getToken: mockGetToken },
}));

import { TripToolbar } from "@/components/TripToolbar";
import type { Trip } from "@/lib/types";

const baseTrip: Trip = {
  id: "trip-1",
  title: "Japan 2024",
  start_date: "2024-03-01",
  steps: [{ id: "s1", trip_id: "trip-1", lat: 35.6, lng: 139.7, timestamp: "2024-03-01T00:00:00Z" }],
  total_days_travelled: 7,
};

const defaultProps = {
  trips: [baseTrip],
  currentTrip: baseTrip,
  onSelectTrip: vi.fn(),
  onCreateTrip: vi.fn(),
};

describe("TripToolbar", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the current trip title", () => {
    render(<TripToolbar {...defaultProps} />);
    // Title appears in header and in the trip <select>, so check at least one exists
    expect(screen.getAllByText("Japan 2024").length).toBeGreaterThanOrEqual(1);
  });

  it("renders step count", () => {
    render(<TripToolbar {...defaultProps} />);
    expect(screen.getByText(/1 location/)).toBeInTheDocument();
  });

  it("renders day count", () => {
    render(<TripToolbar {...defaultProps} />);
    expect(screen.getByText(/7 day/)).toBeInTheDocument();
  });

  it("shows trip action buttons when a trip is selected", () => {
    render(<TripToolbar {...defaultProps} />);
    expect(screen.getByText("Share")).toBeInTheDocument();
    expect(screen.getByText("Export")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });

  it("shows 'No Trip Selected' when currentTrip is null", () => {
    render(<TripToolbar {...defaultProps} currentTrip={null} />);
    expect(screen.getByText("No Trip Selected")).toBeInTheDocument();
  });

  it("hides trip action buttons when no trip is selected", () => {
    render(<TripToolbar {...defaultProps} currentTrip={null} />);
    expect(screen.queryByText("Share")).not.toBeInTheDocument();
    expect(screen.queryByText("Export")).not.toBeInTheDocument();
  });

  it("calls api.shareTrip when Share button is clicked", async () => {
    mockShareTrip.mockResolvedValue({ share_token: "abc123" });
    const user = userEvent.setup();
    render(<TripToolbar {...defaultProps} />);
    await user.click(screen.getByText("Share"));
    expect(mockShareTrip).toHaveBeenCalledWith("fake-token", "trip-1");
  });

  it("shows Delete button only when onDeleteTrip is provided", () => {
    const { rerender } = render(<TripToolbar {...defaultProps} />);
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();

    rerender(<TripToolbar {...defaultProps} onDeleteTrip={vi.fn()} />);
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });
});
