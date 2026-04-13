import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildGetRequest, buildPostRequest } from "./helpers";

const mockGetClientIP = vi.fn();
const mockRateLimit = vi.fn();
const mockRateLimitResponse = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  getClientIP: (...args: unknown[]) => mockGetClientIP(...args),
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  rateLimitResponse: (...args: unknown[]) => mockRateLimitResponse(...args),
  RATE_LIMITS: {
    AI: { limit: 10, windowMs: 60000 },
  },
}));

vi.mock("@/lib/sentry-utils", () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

const ROUTES = [
  {
    path: "/api/ai/advisor",
    importPath: "@/app/api/ai/advisor/route",
  },
  {
    path: "/api/ai/outcome",
    importPath: "@/app/api/ai/outcome/route",
  },
  {
    path: "/api/ai/protocols",
    importPath: "@/app/api/ai/protocols/route",
  },
  {
    path: "/api/ai/quiz",
    importPath: "@/app/api/ai/quiz/route",
  },
  {
    path: "/api/ai/skin-analysis",
    importPath: "@/app/api/ai/skin-analysis/route",
  },
] as const;

describe("AI stub routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetClientIP.mockReturnValue("127.0.0.1");
    mockRateLimit.mockReturnValue({ allowed: true, resetIn: 0 });
    mockRateLimitResponse.mockImplementation((resetIn: number) =>
      new Response(JSON.stringify({ error: "Rate limited", resetIn }), { status: 429 }),
    );
  });

  for (const route of ROUTES) {
    describe(route.path, () => {
      it("GET should return 501 when allowed", async () => {
        const mod = await import(route.importPath);
        const response = await mod.GET(buildGetRequest(route.path) as any);
        const data = await response.json();

        expect(response.status).toBe(501);
        expect(data.status).toBe("not_implemented");
      });

      it("POST should return 501 when allowed", async () => {
        const mod = await import(route.importPath);
        const response = await mod.POST(buildPostRequest(route.path, {}) as any);
        const data = await response.json();

        expect(response.status).toBe(501);
        expect(data.status).toBe("not_implemented");
      });

      it("GET should return 429 when rate limited", async () => {
        const mod = await import(route.importPath);
        mockRateLimit.mockReturnValueOnce({ allowed: false, resetIn: 12 });
        const response = await mod.GET(
          buildGetRequest(route.path, { t: String(Date.now()) }) as any,
        );
        const data = await response.json();

        expect(response.status).toBe(429);
        expect(data.error).toBe("Rate limited");
      });
    });
  }
});
