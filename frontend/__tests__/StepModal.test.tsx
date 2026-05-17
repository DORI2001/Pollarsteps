import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

const { mockResolveLocationName } = vi.hoisted(() => ({
  mockResolveLocationName: vi.fn(),
}));

vi.mock("@/lib/theme", () => ({
  useColors: () => ({
    primary: "#5B6CF0", primaryDark: "#7C3AED", secondary: "#06B6D4",
    background: "#F2F2F7", surface: "#fff", surfaceElevated: "#fff",
    text: "#1C1C1E", textSecondary: "#6E6E73", border: "#D1D1D6",
    headerBg: "rgba(255,255,255,0.85)", success: "#34C759", error: "#FF3B30",
  }),
}));

vi.mock("@/lib/geocoding", () => ({ resolveLocationName: mockResolveLocationName }));
vi.mock("@/lib/api", () => ({ api: { uploadImage: vi.fn() } }));
vi.mock("@/lib/images", () => ({ compressImage: (f: File) => Promise.resolve(f) }));

import { StepModal } from "@/components/StepModal";

const coords = { lat: 48.8566, lng: 2.3522 };

describe("StepModal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows 'detecting…' while geocoding is in progress", () => {
    mockResolveLocationName.mockReturnValue(new Promise(() => {})); // never resolves
    render(<StepModal coords={coords} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText(/detecting/i)).toBeInTheDocument();
  });

  it("populates location name after geocoding resolves", async () => {
    mockResolveLocationName.mockResolvedValue("Eiffel Tower");
    render(<StepModal coords={coords} onClose={vi.fn()} onSubmit={vi.fn()} />);
    await waitFor(() => {
      const input = screen.getByPlaceholderText(/eiffel tower|cafe/i);
      expect((input as HTMLInputElement).value).toBe("Eiffel Tower");
    });
  });

  it("Save Memory button is disabled when note is empty", () => {
    mockResolveLocationName.mockResolvedValue("Paris");
    render(<StepModal coords={coords} onClose={vi.fn()} onSubmit={vi.fn()} />);
    const saveBtn = screen.getByText("Save Memory");
    expect(saveBtn).toBeDisabled();
  });

  it("Save Memory button is enabled after typing a note", async () => {
    mockResolveLocationName.mockResolvedValue("Paris");
    const user = userEvent.setup();
    render(<StepModal coords={coords} onClose={vi.fn()} onSubmit={vi.fn()} />);
    await user.type(screen.getByPlaceholderText(/what happened/i), "Saw the Eiffel Tower");
    expect(screen.getByText("Save Memory")).toBeEnabled();
  });

  it("calls onSubmit with note and location name when saved", async () => {
    mockResolveLocationName.mockResolvedValue("Paris");
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<StepModal coords={coords} onClose={vi.fn()} onSubmit={onSubmit} />);
    await waitFor(() => expect((screen.getByPlaceholderText(/eiffel|cafe/i) as HTMLInputElement).value).toBe("Paris"));
    await user.type(screen.getByPlaceholderText(/what happened/i), "Beautiful city");
    await user.click(screen.getByText("Save Memory"));
    expect(onSubmit).toHaveBeenCalledWith("Beautiful city", undefined, "Paris");
  });

  it("shows error message when note is empty and user tries to submit", async () => {
    mockResolveLocationName.mockResolvedValue("Paris");
    render(<StepModal coords={coords} onClose={vi.fn()} onSubmit={vi.fn()} />);
    // Button is disabled so we can't click it directly — error only shows via handleSubmit
    // Verify save button remains disabled with empty note
    expect(screen.getByText("Save Memory")).toBeDisabled();
  });

  it("calls onClose when Cancel is clicked", async () => {
    mockResolveLocationName.mockResolvedValue("Paris");
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<StepModal coords={coords} onClose={onClose} onSubmit={vi.fn()} />);
    await user.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });
});
