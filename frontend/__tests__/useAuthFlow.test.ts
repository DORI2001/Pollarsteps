import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const { mockApi, mockSession, mockPush } = vi.hoisted(() => ({
  mockApi: {
    login: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn(),
  },
  mockSession: { setTokens: vi.fn(), setUser: vi.fn() },
  mockPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock("@/lib/api", () => ({ api: mockApi, session: mockSession }));

import { useAuthFlow } from "@/hooks/useAuthFlow";

describe("useAuthFlow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("login calls api.login, stores tokens and user, then navigates to /", async () => {
    mockApi.login.mockResolvedValue({ access_token: "tok", refresh_token: "ref" });
    mockApi.getCurrentUser.mockResolvedValue({ id: "1", email: "a@b.com" });

    const { result } = renderHook(() => useAuthFlow());
    await result.current.login("user@x.com", "pass");

    expect(mockApi.login).toHaveBeenCalledWith("user@x.com", "pass");
    expect(mockSession.setTokens).toHaveBeenCalledWith("tok", "ref");
    expect(mockApi.getCurrentUser).toHaveBeenCalledWith("tok");
    expect(mockSession.setUser).toHaveBeenCalledWith({ id: "1", email: "a@b.com" });
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("register calls api.register, stores tokens and user, then navigates to /", async () => {
    mockApi.register.mockResolvedValue({ access_token: "tok2", refresh_token: "ref2" });
    mockApi.getCurrentUser.mockResolvedValue({ id: "2", email: "b@c.com" });

    const { result } = renderHook(() => useAuthFlow());
    await result.current.register("b@c.com", "pass", "buser");

    expect(mockApi.register).toHaveBeenCalledWith("b@c.com", "pass", "buser");
    expect(mockSession.setTokens).toHaveBeenCalledWith("tok2", "ref2");
    expect(mockSession.setUser).toHaveBeenCalledWith({ id: "2", email: "b@c.com" });
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("login re-throws when api.login rejects", async () => {
    mockApi.login.mockRejectedValue(new Error("Bad credentials"));
    const { result } = renderHook(() => useAuthFlow());
    await expect(result.current.login("x", "wrong")).rejects.toThrow("Bad credentials");
  });
});
