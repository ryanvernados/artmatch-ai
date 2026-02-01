import { eq, desc, and, like, gte, lte, sql, or, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  artworks, InsertArtwork, Artwork,
  transactions, InsertTransaction,
  reviews, InsertReview,
  endorsements,
  favorites,
  browsingHistory,
  pricingAnalysis,
  provenanceHistory
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER QUERIES ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = (user as any)[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      (values as any)[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user by email: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function updateUserTasteProfile(userId: number, tasteProfile: object) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ tasteProfile }).where(eq(users.id, userId));
}

// ============ ARTWORK QUERIES ============

export async function createArtwork(artwork: InsertArtwork) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(artworks).values(artwork);
  return result[0].insertId;
}

export async function getArtworkById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(artworks).where(eq(artworks.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getArtworkWithSeller(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      artwork: artworks,
      seller: users
    })
    .from(artworks)
    .leftJoin(users, eq(artworks.sellerId, users.id))
    .where(eq(artworks.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateArtwork(id: number, data: Partial<InsertArtwork>) {
  const db = await getDb();
  if (!db) return;
  await db.update(artworks).set(data).where(eq(artworks.id, id));
}

export async function deleteArtwork(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(artworks).where(eq(artworks.id, id));
}

export async function listArtworks(filters: {
  status?: string;
  style?: string;
  medium?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: number;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (filters.status) {
    conditions.push(eq(artworks.status, filters.status as any));
  }
  if (filters.style) {
    conditions.push(eq(artworks.style, filters.style));
  }
  if (filters.medium) {
    conditions.push(eq(artworks.medium, filters.medium));
  }
  if (filters.minPrice !== undefined) {
    conditions.push(gte(artworks.price, filters.minPrice.toString()));
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(lte(artworks.price, filters.maxPrice.toString()));
  }
  if (filters.sellerId) {
    conditions.push(eq(artworks.sellerId, filters.sellerId));
  }
  if (filters.search) {
    conditions.push(
      or(
        like(artworks.title, `%${filters.search}%`),
        like(artworks.artistName, `%${filters.search}%`),
        like(artworks.description, `%${filters.search}%`)
      )
    );
  }

  let orderByClause;
  switch (filters.orderBy) {
    case 'price_asc':
      orderByClause = artworks.price;
      break;
    case 'price_desc':
      orderByClause = desc(artworks.price);
      break;
    case 'popular':
      orderByClause = desc(artworks.viewCount);
      break;
    default:
      orderByClause = desc(artworks.createdAt);
  }

  const query = db
    .select()
    .from(artworks)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderByClause)
    .limit(filters.limit || 20)
    .offset(filters.offset || 0);

  return await query;
}

export async function getSellerArtworks(sellerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(artworks).where(eq(artworks.sellerId, sellerId)).orderBy(desc(artworks.createdAt));
}

export async function incrementArtworkView(artworkId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(artworks).set({ viewCount: sql`${artworks.viewCount} + 1` }).where(eq(artworks.id, artworkId));
}

// ============ TRANSACTION QUERIES ============

export async function createTransaction(transaction: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(transactions).values(transaction);
  return result[0].insertId;
}

export async function getTransactionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateTransaction(id: number, data: Partial<InsertTransaction>) {
  const db = await getDb();
  if (!db) return;
  await db.update(transactions).set(data).where(eq(transactions.id, id));
}

export async function getUserTransactions(userId: number, role: 'buyer' | 'seller') {
  const db = await getDb();
  if (!db) return [];
  const condition = role === 'buyer' ? eq(transactions.buyerId, userId) : eq(transactions.sellerId, userId);
  const txList = await db.select().from(transactions).where(condition).orderBy(desc(transactions.createdAt));
  
  // Fetch artwork data for each transaction
  const result = await Promise.all(txList.map(async (tx) => {
    const artwork = await db.select().from(artworks).where(eq(artworks.id, tx.artworkId)).limit(1);
    return { ...tx, artwork: artwork[0] || null };
  }));
  
  return result;
}

// ============ REVIEW QUERIES ============

export async function createReview(review: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reviews).values(review);
  
  // Update artwork rating if artworkId provided
  if (review.artworkId) {
    await updateArtworkRating(review.artworkId);
  }
  // Update seller rating if sellerId provided
  if (review.sellerId) {
    await updateSellerRating(review.sellerId);
  }
  
  return result[0].insertId;
}

export async function getArtworkReviews(artworkId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      review: reviews,
      reviewer: users
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.reviewerId, users.id))
    .where(eq(reviews.artworkId, artworkId))
    .orderBy(desc(reviews.createdAt));
}

export async function getSellerReviews(sellerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      review: reviews,
      reviewer: users
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.reviewerId, users.id))
    .where(eq(reviews.sellerId, sellerId))
    .orderBy(desc(reviews.createdAt));
}

async function updateArtworkRating(artworkId: number) {
  const db = await getDb();
  if (!db) return;
  
  const result = await db
    .select({
      avgRating: sql<string>`AVG(${reviews.rating})`,
      count: sql<number>`COUNT(*)`
    })
    .from(reviews)
    .where(eq(reviews.artworkId, artworkId));
  
  if (result[0]) {
    await db.update(artworks).set({
      averageRating: result[0].avgRating || "0.00",
      totalReviews: result[0].count
    }).where(eq(artworks.id, artworkId));
  }
}

async function updateSellerRating(sellerId: number) {
  const db = await getDb();
  if (!db) return;
  
  const result = await db
    .select({
      avgRating: sql<string>`AVG(${reviews.rating})`,
      count: sql<number>`COUNT(*)`
    })
    .from(reviews)
    .where(eq(reviews.sellerId, sellerId));
  
  if (result[0]) {
    await db.update(users).set({
      averageRating: result[0].avgRating || "0.00",
      totalReviews: result[0].count
    }).where(eq(users.id, sellerId));
  }
}

// ============ ENDORSEMENT QUERIES ============

export async function createEndorsement(endorsement: typeof endorsements.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(endorsements).values(endorsement);
  return result[0].insertId;
}

export async function getArtworkEndorsements(artworkId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(endorsements).where(eq(endorsements.artworkId, artworkId));
}

// ============ FAVORITE QUERIES ============

export async function addFavorite(userId: number, artworkId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if already favorited
  const existing = await db.select().from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.artworkId, artworkId)))
    .limit(1);
  
  if (existing.length > 0) return existing[0].id;
  
  const result = await db.insert(favorites).values({ userId, artworkId });
  await db.update(artworks).set({ favoriteCount: sql`${artworks.favoriteCount} + 1` }).where(eq(artworks.id, artworkId));
  return result[0].insertId;
}

export async function removeFavorite(userId: number, artworkId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.artworkId, artworkId)));
  await db.update(artworks).set({ favoriteCount: sql`${artworks.favoriteCount} - 1` }).where(eq(artworks.id, artworkId));
}

export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({ artwork: artworks })
    .from(favorites)
    .innerJoin(artworks, eq(favorites.artworkId, artworks.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));
}

export async function isArtworkFavorited(userId: number, artworkId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.artworkId, artworkId)))
    .limit(1);
  return result.length > 0;
}

// ============ BROWSING HISTORY QUERIES ============

export async function recordBrowsingHistory(userId: number, artworkId: number, interactionType: string, viewDuration?: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(browsingHistory).values({
    userId,
    artworkId,
    interactionType: interactionType as any,
    viewDuration
  });
}

export async function getUserBrowsingHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({ history: browsingHistory, artwork: artworks })
    .from(browsingHistory)
    .innerJoin(artworks, eq(browsingHistory.artworkId, artworks.id))
    .where(eq(browsingHistory.userId, userId))
    .orderBy(desc(browsingHistory.createdAt))
    .limit(limit);
}

// ============ PROVENANCE QUERIES ============

export async function addProvenanceEvent(event: typeof provenanceHistory.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(provenanceHistory).values(event);
  return result[0].insertId;
}

export async function getArtworkProvenance(artworkId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(provenanceHistory)
    .where(eq(provenanceHistory.artworkId, artworkId))
    .orderBy(desc(provenanceHistory.eventDate));
}

// ============ PRICING ANALYSIS QUERIES ============

export async function savePricingAnalysis(analysis: typeof pricingAnalysis.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(pricingAnalysis).values(analysis);
  return result[0].insertId;
}

export async function getLatestPricingAnalysis(artworkId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(pricingAnalysis)
    .where(eq(pricingAnalysis.artworkId, artworkId))
    .orderBy(desc(pricingAnalysis.createdAt))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ STATS QUERIES ============

export async function getMarketplaceStats() {
  const db = await getDb();
  if (!db) return null;
  
  const [artworkStats] = await db.select({
    totalArtworks: sql<number>`COUNT(*)`,
    totalValue: sql<string>`SUM(${artworks.price})`,
    avgPrice: sql<string>`AVG(${artworks.price})`
  }).from(artworks).where(eq(artworks.status, 'active'));
  
  const [userStats] = await db.select({
    totalUsers: sql<number>`COUNT(*)`,
    totalSellers: sql<number>`SUM(CASE WHEN ${users.userType} IN ('seller', 'both') THEN 1 ELSE 0 END)`
  }).from(users);
  
  const [transactionStats] = await db.select({
    totalTransactions: sql<number>`COUNT(*)`,
    totalVolume: sql<string>`SUM(${transactions.amount})`
  }).from(transactions).where(eq(transactions.status, 'completed'));
  
  return {
    artworks: artworkStats,
    users: userStats,
    transactions: transactionStats
  };
}


export async function getPendingVerifications() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(artworks)
    .where(eq(artworks.verificationStatus, 'pending'))
    .orderBy(desc(artworks.createdAt));
}
