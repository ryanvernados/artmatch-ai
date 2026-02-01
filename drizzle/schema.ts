import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

// User table with role-based access
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  userType: mysqlEnum("userType", ["buyer", "seller", "both"]).default("buyer").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  location: varchar("location", { length: 255 }),
  website: varchar("website", { length: 500 }),
  // Taste profile for AI recommendations
  tasteProfile: json("tasteProfile"),
  // Seller-specific fields
  isVerifiedSeller: boolean("isVerifiedSeller").default(false),
  galleryName: varchar("galleryName", { length: 255 }),
  // Reputation metrics
  totalSales: int("totalSales").default(0),
  totalPurchases: int("totalPurchases").default(0),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("0.00"),
  totalReviews: int("totalReviews").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// Artworks table
export const artworks = mysqlTable("artworks", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  artistName: varchar("artistName", { length: 255 }).notNull(),
  artistBio: text("artistBio"),
  // Artwork details
  medium: varchar("medium", { length: 100 }),
  style: varchar("style", { length: 100 }),
  dimensions: varchar("dimensions", { length: 100 }),
  yearCreated: int("yearCreated"),
  // Pricing
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  aiSuggestedPrice: decimal("aiSuggestedPrice", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  // Images stored in S3
  primaryImageUrl: text("primaryImageUrl").notNull(),
  additionalImages: json("additionalImages"),
  arPreviewUrl: text("arPreviewUrl"),
  // Trust & Verification
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "verified", "rejected"]).default("pending"),
  aiConfidenceScore: decimal("aiConfidenceScore", { precision: 5, scale: 2 }),
  provenanceData: json("provenanceData"),
  // Marketplace status
  status: mysqlEnum("status", ["draft", "active", "sold", "reserved", "archived"]).default("draft"),
  // Metrics
  viewCount: int("viewCount").default(0),
  favoriteCount: int("favoriteCount").default(0),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("0.00"),
  totalReviews: int("totalReviews").default(0),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Provenance history for artworks
export const provenanceHistory = mysqlTable("provenanceHistory", {
  id: int("id").autoincrement().primaryKey(),
  artworkId: int("artworkId").notNull(),
  eventType: mysqlEnum("eventType", ["creation", "exhibition", "sale", "authentication", "restoration", "transfer"]).notNull(),
  eventDate: timestamp("eventDate"),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  verifiedBy: varchar("verifiedBy", { length: 255 }),
  documentUrl: text("documentUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Transactions table
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  artworkId: int("artworkId").notNull(),
  buyerId: int("buyerId").notNull(),
  sellerId: int("sellerId").notNull(),
  // Pricing
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  platformFee: decimal("platformFee", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  // Stripe integration
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeTransferId: varchar("stripeTransferId", { length: 255 }),
  // Escrow status
  escrowStatus: mysqlEnum("escrowStatus", ["pending", "held", "released", "refunded", "disputed"]).default("pending"),
  // Transaction status
  status: mysqlEnum("status", ["pending", "processing", "completed", "cancelled", "refunded"]).default("pending"),
  // Delivery
  shippingAddress: json("shippingAddress"),
  deliveryStatus: mysqlEnum("deliveryStatus", ["pending", "shipped", "in_transit", "delivered", "confirmed"]),
  deliveryConfirmedAt: timestamp("deliveryConfirmedAt"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

// Reviews table
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  artworkId: int("artworkId"),
  sellerId: int("sellerId"),
  reviewerId: int("reviewerId").notNull(),
  transactionId: int("transactionId"),
  rating: int("rating").notNull(),
  title: varchar("title", { length: 255 }),
  content: text("content"),
  isVerifiedPurchase: boolean("isVerifiedPurchase").default(false),
  helpfulCount: int("helpfulCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Expert endorsements
export const endorsements = mysqlTable("endorsements", {
  id: int("id").autoincrement().primaryKey(),
  artworkId: int("artworkId").notNull(),
  expertId: int("expertId").notNull(),
  expertName: varchar("expertName", { length: 255 }).notNull(),
  expertTitle: varchar("expertTitle", { length: 255 }),
  expertCredentials: text("expertCredentials"),
  endorsementText: text("endorsementText").notNull(),
  authenticityConfirmed: boolean("authenticityConfirmed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// User favorites/wishlist
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  artworkId: int("artworkId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Browsing history for AI recommendations
export const browsingHistory = mysqlTable("browsingHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  artworkId: int("artworkId").notNull(),
  viewDuration: int("viewDuration"),
  interactionType: mysqlEnum("interactionType", ["view", "click", "favorite", "share", "inquiry"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// AI pricing analysis logs
export const pricingAnalysis = mysqlTable("pricingAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  artworkId: int("artworkId").notNull(),
  suggestedPrice: decimal("suggestedPrice", { precision: 12, scale: 2 }).notNull(),
  confidenceScore: decimal("confidenceScore", { precision: 5, scale: 2 }),
  analysisData: json("analysisData"),
  marketComparables: json("marketComparables"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Artwork = typeof artworks.$inferSelect;
export type InsertArtwork = typeof artworks.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
export type Endorsement = typeof endorsements.$inferSelect;
export type ProvenanceHistory = typeof provenanceHistory.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type BrowsingHistory = typeof browsingHistory.$inferSelect;
export type PricingAnalysis = typeof pricingAnalysis.$inferSelect;
