import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db functions
vi.mock("./db", () => ({
  listArtworks: vi.fn().mockResolvedValue([
    {
      id: 1,
      title: "Test Artwork",
      artistName: "Test Artist",
      price: "1000.00",
      status: "active",
      primaryImageUrl: "https://example.com/image.jpg",
      style: "contemporary",
      medium: "oil painting",
      verificationStatus: "verified",
      aiConfidenceScore: "85.00"
    }
  ]),
  getArtworkWithSeller: vi.fn().mockResolvedValue({
    artwork: {
      id: 1,
      title: "Test Artwork",
      artistName: "Test Artist",
      price: "1000.00",
      status: "active",
      primaryImageUrl: "https://example.com/image.jpg",
      sellerId: 2
    },
    seller: {
      id: 2,
      name: "Test Seller",
      isVerifiedSeller: true
    }
  }),
  incrementArtworkView: vi.fn().mockResolvedValue(undefined),
  recordBrowsingHistory: vi.fn().mockResolvedValue(undefined),
  getArtworkReviews: vi.fn().mockResolvedValue([]),
  getArtworkEndorsements: vi.fn().mockResolvedValue([]),
  getArtworkProvenance: vi.fn().mockResolvedValue([]),
  isArtworkFavorited: vi.fn().mockResolvedValue(false),
  getUserFavorites: vi.fn().mockResolvedValue([]),
  addFavorite: vi.fn().mockResolvedValue(1),
  removeFavorite: vi.fn().mockResolvedValue(undefined),
  getMarketplaceStats: vi.fn().mockResolvedValue({
    artworks: { totalArtworks: 10, totalValue: "50000.00", avgPrice: "5000.00" },
    users: { totalUsers: 100, totalSellers: 20 },
    transactions: { totalTransactions: 50, totalVolume: "100000.00" }
  })
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"]
  };
}

function createAuthContext(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date()
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"]
  };
}

describe("artwork.list", () => {
  it("returns list of artworks for public users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.artwork.list({});
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Test Artwork");
    expect(result[0].status).toBe("active");
  });

  it("filters artworks by style", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.artwork.list({ style: "contemporary" });
    
    expect(result).toBeDefined();
  });
});

describe("artwork.getById", () => {
  it("returns artwork with seller info", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.artwork.getById({ id: 1 });
    
    expect(result.artwork.title).toBe("Test Artwork");
    expect(result.seller.name).toBe("Test Seller");
    expect(result.isFavorited).toBe(false);
  });
});

describe("favorites", () => {
  it("allows authenticated users to add favorites", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.favorites.add({ artworkId: 1 });
    
    expect(result.success).toBe(true);
  });

  it("allows authenticated users to remove favorites", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.favorites.remove({ artworkId: 1 });
    
    expect(result.success).toBe(true);
  });

  it("returns user favorites list", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.favorites.list();
    
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("admin.getStats", () => {
  it("returns marketplace stats for admin users", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.admin.getStats();
    
    expect(result?.artworks.totalArtworks).toBe(10);
    expect(result?.users.totalUsers).toBe(100);
    expect(result?.transactions.totalTransactions).toBe(50);
  });

  it("rejects non-admin users", async () => {
    const ctx = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);
    
    await expect(caller.admin.getStats()).rejects.toThrow("Admin access required");
  });
});
