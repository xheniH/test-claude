import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSession, getSession, deleteSession, verifySession } from "@/lib/auth";
import { NextRequest } from "next/server";

// Mock jose library
vi.mock("jose", () => {
  const mockSign = vi.fn().mockResolvedValue("mock-jwt-token");
  const mockSetExpirationTime = vi.fn().mockReturnThis();
  const mockSetIssuedAt = vi.fn().mockReturnThis();
  const mockSetProtectedHeader = vi.fn().mockReturnThis();

  return {
    SignJWT: vi.fn().mockImplementation(() => ({
      setProtectedHeader: mockSetProtectedHeader,
      setExpirationTime: mockSetExpirationTime,
      setIssuedAt: mockSetIssuedAt,
      sign: mockSign,
    })),
    jwtVerify: vi.fn(),
  };
});

// Mock next/headers
const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

describe("auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createSession", () => {
    it("creates a session with correct userId and email", async () => {
      const userId = "user-123";
      const email = "test@example.com";

      await createSession(userId, email);

      // Verify SignJWT was called with the session data
      const { SignJWT } = await import("jose");
      expect(SignJWT).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          email,
          expiresAt: expect.any(Date),
        })
      );
    });

    it("sets session expiration to 7 days from now", async () => {
      const userId = "user-123";
      const email = "test@example.com";
      const beforeCall = Date.now();

      await createSession(userId, email);

      const { SignJWT } = await import("jose");
      const callArgs = (SignJWT as any).mock.calls[0][0];
      const expiresAt = callArgs.expiresAt.getTime();
      const expectedExpiration = beforeCall + 7 * 24 * 60 * 60 * 1000;

      // Allow 1 second tolerance for test execution time
      expect(expiresAt).toBeGreaterThanOrEqual(expectedExpiration - 1000);
      expect(expiresAt).toBeLessThanOrEqual(expectedExpiration + 1000);
    });

    it("creates JWT with correct configuration", async () => {
      const userId = "user-123";
      const email = "test@example.com";

      await createSession(userId, email);

      const { SignJWT } = await import("jose");
      const mockInstance = (SignJWT as any).mock.results[0].value;

      // Verify JWT configuration methods were called
      expect(mockInstance.setProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
      expect(mockInstance.setExpirationTime).toHaveBeenCalledWith("7d");
      expect(mockInstance.setIssuedAt).toHaveBeenCalled();
      expect(mockInstance.sign).toHaveBeenCalled();
    });

    it("sets HTTP-only cookie with correct options", async () => {
      const userId = "user-123";
      const email = "test@example.com";
      const beforeCall = Date.now();

      await createSession(userId, email);

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "auth-token",
        "mock-jwt-token",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          expires: expect.any(Date),
        })
      );

      // Verify the expires date is approximately 7 days from now
      const cookieOptions = mockCookieStore.set.mock.calls[0][2];
      const expiresAt = cookieOptions.expires.getTime();
      const expectedExpiration = beforeCall + 7 * 24 * 60 * 60 * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(expectedExpiration - 1000);
      expect(expiresAt).toBeLessThanOrEqual(expectedExpiration + 1000);
    });

    it("sets secure flag in production environment", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const userId = "user-123";
      const email = "test@example.com";

      await createSession(userId, email);

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "auth-token",
        "mock-jwt-token",
        expect.objectContaining({
          secure: true,
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("does not set secure flag in development environment", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const userId = "user-123";
      const email = "test@example.com";

      await createSession(userId, email);

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "auth-token",
        "mock-jwt-token",
        expect.objectContaining({
          secure: false,
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("handles special characters in email", async () => {
      const userId = "user-123";
      const email = "test+special@example.com";

      await createSession(userId, email);

      const { SignJWT } = await import("jose");
      expect(SignJWT).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          email,
        })
      );
    });

    it("handles long userId", async () => {
      const userId = "a".repeat(100);
      const email = "test@example.com";

      await createSession(userId, email);

      const { SignJWT } = await import("jose");
      expect(SignJWT).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          email,
        })
      );
    });
  });
});
