import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// Admin procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

// Artwork router
const artworkRouter = router({
  list: publicProcedure
    .input(z.object({
      status: z.string().optional(),
      style: z.string().optional(),
      medium: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      search: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
      orderBy: z.enum(['newest', 'price_asc', 'price_desc', 'popular']).optional()
    }).optional())
    .query(async ({ input }) => {
      return await db.listArtworks({ ...input, status: input?.status || 'active' });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const result = await db.getArtworkWithSeller(input.id);
      if (!result) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Artwork not found' });
      }
      
      // Increment view count
      await db.incrementArtworkView(input.id);
      
      // Record browsing history if user is logged in
      if (ctx.user) {
        await db.recordBrowsingHistory(ctx.user.id, input.id, 'view');
      }
      
      // Get additional data
      const [reviews, endorsements, provenance] = await Promise.all([
        db.getArtworkReviews(input.id),
        db.getArtworkEndorsements(input.id),
        db.getArtworkProvenance(input.id)
      ]);
      
      let isFavorited = false;
      if (ctx.user) {
        isFavorited = await db.isArtworkFavorited(ctx.user.id, input.id);
      }
      
      return {
        ...result,
        reviews,
        endorsements,
        provenance,
        isFavorited
      };
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      artistName: z.string().min(1),
      artistBio: z.string().optional(),
      medium: z.string().optional(),
      style: z.string().optional(),
      dimensions: z.string().optional(),
      yearCreated: z.number().optional(),
      price: z.number().positive(),
      primaryImageUrl: z.string().url(),
      additionalImages: z.array(z.string()).optional(),
      arPreviewUrl: z.string().optional(),
      provenanceData: z.any().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      // Update user to seller if not already
      if (ctx.user.userType === 'buyer') {
        await db.updateUserProfile(ctx.user.id, { userType: 'both' });
      }
      
      const artworkId = await db.createArtwork({
        ...input,
        sellerId: ctx.user.id,
        price: input.price.toString(),
        status: 'draft',
        additionalImages: input.additionalImages ? JSON.stringify(input.additionalImages) : null
      });
      
      return { id: artworkId };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      artistName: z.string().optional(),
      artistBio: z.string().optional(),
      medium: z.string().optional(),
      style: z.string().optional(),
      dimensions: z.string().optional(),
      yearCreated: z.number().optional(),
      price: z.number().positive().optional(),
      primaryImageUrl: z.string().url().optional(),
      additionalImages: z.array(z.string()).optional(),
      arPreviewUrl: z.string().optional(),
      status: z.enum(['draft', 'active', 'archived']).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const artwork = await db.getArtworkById(input.id);
      if (!artwork) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      if (artwork.sellerId !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      const { id, ...updateData } = input;
      await db.updateArtwork(id, {
        ...updateData,
        price: updateData.price?.toString(),
        additionalImages: updateData.additionalImages ? JSON.stringify(updateData.additionalImages) : undefined
      });
      
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const artwork = await db.getArtworkById(input.id);
      if (!artwork) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      if (artwork.sellerId !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      await db.deleteArtwork(input.id);
      return { success: true };
    }),

  getMyListings: protectedProcedure.query(async ({ ctx }) => {
    return await db.getSellerArtworks(ctx.user.id);
  }),

  // AI-powered pricing suggestion
  getPricingSuggestion: protectedProcedure
    .input(z.object({
      title: z.string(),
      artistName: z.string(),
      medium: z.string().optional(),
      style: z.string().optional(),
      dimensions: z.string().optional(),
      yearCreated: z.number().optional(),
      description: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const prompt = `You are an expert art appraiser and market analyst. Based on the following artwork details, provide a pricing suggestion and market analysis.

Artwork Details:
- Title: ${input.title}
- Artist: ${input.artistName}
- Medium: ${input.medium || 'Not specified'}
- Style: ${input.style || 'Not specified'}
- Dimensions: ${input.dimensions || 'Not specified'}
- Year Created: ${input.yearCreated || 'Not specified'}
- Description: ${input.description || 'Not provided'}

Provide your analysis in the following JSON format:
{
  "suggestedPrice": <number in USD>,
  "priceRange": { "low": <number>, "high": <number> },
  "confidenceScore": <number 0-100>,
  "marketAnalysis": "<brief market analysis>",
  "comparableWorks": ["<comparable work 1>", "<comparable work 2>"],
  "pricingFactors": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "recommendation": "<brief recommendation for the seller>"
}`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert art appraiser. Always respond with valid JSON." },
            { role: "user", content: prompt }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "pricing_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  suggestedPrice: { type: "number" },
                  priceRange: {
                    type: "object",
                    properties: {
                      low: { type: "number" },
                      high: { type: "number" }
                    },
                    required: ["low", "high"],
                    additionalProperties: false
                  },
                  confidenceScore: { type: "number" },
                  marketAnalysis: { type: "string" },
                  comparableWorks: { type: "array", items: { type: "string" } },
                  pricingFactors: { type: "array", items: { type: "string" } },
                  recommendation: { type: "string" }
                },
                required: ["suggestedPrice", "priceRange", "confidenceScore", "marketAnalysis", "comparableWorks", "pricingFactors", "recommendation"],
                additionalProperties: false
              }
            }
          }
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') throw new Error("No response from LLM");
        
        return JSON.parse(content);
      } catch (error) {
        console.error("Pricing suggestion error:", error);
        // Return a fallback response
        return {
          suggestedPrice: 1000,
          priceRange: { low: 500, high: 2000 },
          confidenceScore: 50,
          marketAnalysis: "Unable to perform detailed analysis. Please consult with an art expert for accurate pricing.",
          comparableWorks: [],
          pricingFactors: ["Artist reputation", "Medium", "Size", "Condition"],
          recommendation: "Consider getting a professional appraisal for accurate pricing."
        };
      }
    }),

  // Upload image
  uploadImage: protectedProcedure
    .input(z.object({
      base64: z.string(),
      filename: z.string(),
      contentType: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.base64, 'base64');
      const fileKey = `artworks/${ctx.user.id}/${nanoid()}-${input.filename}`;
      const { url } = await storagePut(fileKey, buffer, input.contentType);
      return { url, key: fileKey };
    })
});

// User profile router
const profileRouter = router({
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const user = await db.getUserById(input.id);
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      const [artworks, reviews] = await Promise.all([
        db.getSellerArtworks(input.id),
        db.getSellerReviews(input.id)
      ]);
      
      return {
        user: {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          location: user.location,
          website: user.website,
          userType: user.userType,
          isVerifiedSeller: user.isVerifiedSeller,
          galleryName: user.galleryName,
          totalSales: user.totalSales,
          totalPurchases: user.totalPurchases,
          averageRating: user.averageRating,
          totalReviews: user.totalReviews,
          createdAt: user.createdAt
        },
        artworks: artworks.filter(a => a.status === 'active'),
        reviews
      };
    }),

  updateMyProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      bio: z.string().optional(),
      location: z.string().optional(),
      website: z.string().optional(),
      avatarUrl: z.string().optional(),
      galleryName: z.string().optional(),
      userType: z.enum(['buyer', 'seller', 'both']).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      await db.updateUserProfile(ctx.user.id, input);
      return { success: true };
    }),

  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  })
});

// Favorites router
const favoritesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.getUserFavorites(ctx.user.id);
  }),

  add: protectedProcedure
    .input(z.object({ artworkId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await db.addFavorite(ctx.user.id, input.artworkId);
      await db.recordBrowsingHistory(ctx.user.id, input.artworkId, 'favorite');
      return { success: true };
    }),

  remove: protectedProcedure
    .input(z.object({ artworkId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await db.removeFavorite(ctx.user.id, input.artworkId);
      return { success: true };
    })
});

// Reviews router
const reviewsRouter = router({
  create: protectedProcedure
    .input(z.object({
      artworkId: z.number().optional(),
      sellerId: z.number().optional(),
      transactionId: z.number().optional(),
      rating: z.number().min(1).max(5),
      title: z.string().optional(),
      content: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      if (!input.artworkId && !input.sellerId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Must provide artworkId or sellerId' });
      }
      
      // Check if verified purchase
      let isVerifiedPurchase = false;
      if (input.transactionId) {
        const transaction = await db.getTransactionById(input.transactionId);
        if (transaction && transaction.buyerId === ctx.user.id && transaction.status === 'completed') {
          isVerifiedPurchase = true;
        }
      }
      
      const reviewId = await db.createReview({
        ...input,
        reviewerId: ctx.user.id,
        isVerifiedPurchase
      });
      
      return { id: reviewId };
    }),

  getForArtwork: publicProcedure
    .input(z.object({ artworkId: z.number() }))
    .query(async ({ input }) => {
      return await db.getArtworkReviews(input.artworkId);
    }),

  getForSeller: publicProcedure
    .input(z.object({ sellerId: z.number() }))
    .query(async ({ input }) => {
      return await db.getSellerReviews(input.sellerId);
    })
});

// Transaction router
const transactionRouter = router({
  create: protectedProcedure
    .input(z.object({
      artworkId: z.number(),
      shippingAddress: z.object({
        name: z.string(),
        street: z.string(),
        city: z.string(),
        state: z.string(),
        postalCode: z.string(),
        country: z.string()
      })
    }))
    .mutation(async ({ input, ctx }) => {
      const artwork = await db.getArtworkById(input.artworkId);
      if (!artwork) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Artwork not found' });
      }
      if (artwork.status !== 'active') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Artwork is not available for purchase' });
      }
      if (artwork.sellerId === ctx.user.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot purchase your own artwork' });
      }
      
      // Calculate platform fee (5%)
      const amount = parseFloat(artwork.price);
      const platformFee = amount * 0.05;
      
      // Create transaction
      const transactionId = await db.createTransaction({
        artworkId: input.artworkId,
        buyerId: ctx.user.id,
        sellerId: artwork.sellerId,
        amount: amount.toString(),
        platformFee: platformFee.toString(),
        shippingAddress: JSON.stringify(input.shippingAddress),
        status: 'pending',
        escrowStatus: 'pending'
      });
      
      // Reserve artwork
      await db.updateArtwork(input.artworkId, { status: 'reserved' });
      
      return { 
        transactionId,
        amount,
        platformFee
      };
    }),

  // Mock payment processing (replace with Stripe later)
  processPayment: protectedProcedure
    .input(z.object({
      transactionId: z.number(),
      paymentMethod: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const transaction = await db.getTransactionById(input.transactionId);
      if (!transaction) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      if (transaction.buyerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      // Mock payment success
      await db.updateTransaction(input.transactionId, {
        status: 'processing',
        escrowStatus: 'held',
        stripePaymentIntentId: `mock_pi_${nanoid()}`
      });
      
      return { success: true, status: 'processing' };
    }),

  confirmDelivery: protectedProcedure
    .input(z.object({ transactionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const transaction = await db.getTransactionById(input.transactionId);
      if (!transaction) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      if (transaction.buyerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      await db.updateTransaction(input.transactionId, {
        deliveryStatus: 'confirmed',
        deliveryConfirmedAt: new Date(),
        escrowStatus: 'released',
        status: 'completed',
        completedAt: new Date()
      });
      
      // Mark artwork as sold
      await db.updateArtwork(transaction.artworkId, { status: 'sold' });
      
      // Update user stats
      const buyer = await db.getUserById(transaction.buyerId);
      const seller = await db.getUserById(transaction.sellerId);
      if (buyer) {
        await db.updateUserProfile(transaction.buyerId, { 
          totalPurchases: (buyer.totalPurchases || 0) + 1 
        });
      }
      if (seller) {
        await db.updateUserProfile(transaction.sellerId, { 
          totalSales: (seller.totalSales || 0) + 1 
        });
      }
      
      return { success: true };
    }),

  getMyTransactions: protectedProcedure
    .input(z.object({ role: z.enum(['buyer', 'seller']) }))
    .query(async ({ input, ctx }) => {
      return await db.getUserTransactions(ctx.user.id, input.role);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const transaction = await db.getTransactionById(input.id);
      if (!transaction) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      if (transaction.buyerId !== ctx.user.id && transaction.sellerId !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      const artwork = await db.getArtworkById(transaction.artworkId);
      return { transaction, artwork };
    })
});

// AI Recommendations router
const recommendationsRouter = router({
  getPersonalized: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input, ctx }) => {
      // Get user's browsing history and favorites
      const [history, favorites] = await Promise.all([
        db.getUserBrowsingHistory(ctx.user.id, 20),
        db.getUserFavorites(ctx.user.id)
      ]);
      
      // Extract styles and mediums from history
      const viewedStyles = new Set<string>();
      const viewedMediums = new Set<string>();
      
      history.forEach(h => {
        if (h.artwork.style) viewedStyles.add(h.artwork.style);
        if (h.artwork.medium) viewedMediums.add(h.artwork.medium);
      });
      
      favorites.forEach(f => {
        if (f.artwork.style) viewedStyles.add(f.artwork.style);
        if (f.artwork.medium) viewedMediums.add(f.artwork.medium);
      });
      
      // Get artworks matching user preferences
      const recommendations = await db.listArtworks({
        status: 'active',
        limit: input?.limit || 12,
        orderBy: 'popular'
      });
      
      // Sort by relevance (simple scoring based on style/medium match)
      const scored = recommendations.map(artwork => {
        let score = 0;
        if (artwork.style && viewedStyles.has(artwork.style)) score += 2;
        if (artwork.medium && viewedMediums.has(artwork.medium)) score += 1;
        return { artwork, score };
      });
      
      scored.sort((a, b) => b.score - a.score);
      
      return scored.map(s => s.artwork);
    }),

  getStyleMatch: publicProcedure
    .input(z.object({
      imageUrl: z.string().url(),
      limit: z.number().optional()
    }))
    .mutation(async ({ input }) => {
      // Use LLM to analyze image style
      try {
        const response = await invokeLLM({
          messages: [
            { 
              role: "system", 
              content: "You are an art style analyst. Analyze the image and identify its artistic style, medium, and mood. Respond with JSON." 
            },
            { 
              role: "user", 
              content: [
                { type: "text", text: "Analyze this artwork and identify its style, medium, color palette, and mood." },
                { type: "image_url", image_url: { url: input.imageUrl } }
              ]
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "style_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  style: { type: "string" },
                  medium: { type: "string" },
                  colorPalette: { type: "array", items: { type: "string" } },
                  mood: { type: "string" },
                  similarStyles: { type: "array", items: { type: "string" } }
                },
                required: ["style", "medium", "colorPalette", "mood", "similarStyles"],
                additionalProperties: false
              }
            }
          }
        });

        const rawContent = response.choices[0]?.message?.content;
        const analysis = JSON.parse(typeof rawContent === 'string' ? rawContent : "{}");
        
        // Find matching artworks
        const matches = await db.listArtworks({
          status: 'active',
          style: analysis.style,
          limit: input.limit || 8
        });
        
        return { analysis, matches };
      } catch (error) {
        console.error("Style match error:", error);
        return { 
          analysis: null, 
          matches: await db.listArtworks({ status: 'active', limit: input.limit || 8 }) 
        };
      }
    })
});

// Provenance router
const provenanceRouter = router({
  addEvent: protectedProcedure
    .input(z.object({
      artworkId: z.number(),
      eventType: z.enum(['creation', 'exhibition', 'sale', 'authentication', 'restoration', 'transfer']),
      eventDate: z.date().optional(),
      description: z.string(),
      location: z.string().optional(),
      verifiedBy: z.string().optional(),
      documentUrl: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const artwork = await db.getArtworkById(input.artworkId);
      if (!artwork) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      if (artwork.sellerId !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      const eventId = await db.addProvenanceEvent(input);
      return { id: eventId };
    }),

  getHistory: publicProcedure
    .input(z.object({ artworkId: z.number() }))
    .query(async ({ input }) => {
      return await db.getArtworkProvenance(input.artworkId);
    })
});

// Admin router
const adminRouter = router({
  getStats: adminProcedure.query(async () => {
    return await db.getMarketplaceStats();
  }),

  getPendingVerifications: adminProcedure.query(async () => {
    return await db.getPendingVerifications();
  }),

  verifyArtwork: adminProcedure
    .input(z.object({
      artworkId: z.number(),
      status: z.enum(['verified', 'rejected']),
      confidenceScore: z.number().optional()
    }))
    .mutation(async ({ input }) => {
      await db.updateArtwork(input.artworkId, {
        verificationStatus: input.status,
        aiConfidenceScore: input.confidenceScore?.toString()
      });
      return { success: true };
    }),

  verifySeller: adminProcedure
    .input(z.object({
      userId: z.number(),
      verified: z.boolean()
    }))
    .mutation(async ({ input }) => {
      await db.updateUserProfile(input.userId, { isVerifiedSeller: input.verified });
      return { success: true };
    })
});

// Advanced AI Features router
const aiRouter = router({
  // AI Art Critic - Deep analysis mode
  analyzeArtwork: publicProcedure
    .input(z.object({
      artworkId: z.number(),
      analysisType: z.enum(['critique', 'historical', 'technical', 'emotional', 'investment'])
    }))
    .mutation(async ({ input }) => {
      const artwork = await db.getArtworkById(input.artworkId);
      if (!artwork) throw new TRPCError({ code: 'NOT_FOUND' });
      
      const prompts: Record<string, string> = {
        critique: `As an expert art critic, provide a detailed professional critique of this artwork. Analyze composition, technique, emotional impact, and artistic merit. Title: "${artwork.title}" by ${artwork.artistName}. Medium: ${artwork.medium}. Style: ${artwork.style}.`,
        historical: `As an art historian, analyze this artwork's historical context, influences, and place in art history. Compare to similar movements and artists. Title: "${artwork.title}" by ${artwork.artistName}. Style: ${artwork.style}. Year: ${artwork.yearCreated}.`,
        technical: `As a technical art expert, analyze the craftsmanship, techniques, materials, and execution quality of this artwork. Title: "${artwork.title}" by ${artwork.artistName}. Medium: ${artwork.medium}. Dimensions: ${artwork.dimensions}.`,
        emotional: `As an art therapist, analyze the emotional resonance, psychological impact, and therapeutic qualities of this artwork. What feelings does it evoke? Title: "${artwork.title}" by ${artwork.artistName}. Style: ${artwork.style}.`,
        investment: `As an art investment advisor, analyze the investment potential of this artwork. Consider artist trajectory, market trends, rarity, and long-term value. Title: "${artwork.title}" by ${artwork.artistName}. Price: $${artwork.price}. Style: ${artwork.style}.`
      };
      
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a world-renowned art expert with decades of experience. Provide insightful, nuanced analysis." },
            { role: "user", content: [
              { type: "text", text: prompts[input.analysisType] },
              { type: "image_url", image_url: { url: artwork.primaryImageUrl } }
            ]}
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "art_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "Brief overview" },
                  mainAnalysis: { type: "string", description: "Detailed analysis" },
                  keyPoints: { type: "array", items: { type: "string" } },
                  comparisons: { type: "array", items: { type: "string" } },
                  rating: { type: "number", description: "1-10 rating for this analysis type" },
                  recommendation: { type: "string" }
                },
                required: ["summary", "mainAnalysis", "keyPoints", "comparisons", "rating", "recommendation"],
                additionalProperties: false
              }
            }
          }
        });
        
        const content = response.choices[0]?.message?.content;
        return JSON.parse(typeof content === 'string' ? content : "{}");
      } catch (error) {
        console.error("AI analysis error:", error);
        return { summary: "Analysis unavailable", mainAnalysis: "Unable to generate analysis at this time.", keyPoints: [], comparisons: [], rating: 0, recommendation: "Please try again later." };
      }
    }),

  // Mood-based recommendations
  getMoodRecommendations: publicProcedure
    .input(z.object({
      mood: z.enum(['calm', 'energetic', 'contemplative', 'joyful', 'melancholic', 'inspired', 'romantic', 'adventurous']),
      limit: z.number().optional()
    }))
    .query(async ({ input }) => {
      const moodStyles: Record<string, string[]> = {
        calm: ['minimalist', 'impressionist', 'zen', 'landscape'],
        energetic: ['pop art', 'abstract', 'expressionist', 'street art'],
        contemplative: ['surrealist', 'abstract', 'conceptual', 'minimalist'],
        joyful: ['pop art', 'impressionist', 'folk art', 'colorful'],
        melancholic: ['romantic', 'expressionist', 'realist', 'dark'],
        inspired: ['contemporary', 'modern', 'avant-garde', 'conceptual'],
        romantic: ['impressionist', 'romantic', 'classical', 'portrait'],
        adventurous: ['surrealist', 'abstract', 'experimental', 'mixed media']
      };
      
      const preferredStyles = moodStyles[input.mood] || [];
      const artworks = await db.listArtworks({ status: 'active', limit: input.limit || 12 });
      
      // Score artworks by mood match
      const scored = artworks.map(a => {
        let score = 0;
        if (a.style && preferredStyles.some(s => a.style?.toLowerCase().includes(s))) score += 3;
        return { artwork: a, score };
      });
      
      scored.sort((a, b) => b.score - a.score);
      return { mood: input.mood, recommendations: scored.map(s => s.artwork) };
    }),

  // Style transfer preview - "What if" scenarios
  styleTransferPreview: publicProcedure
    .input(z.object({
      artworkId: z.number(),
      targetStyle: z.string()
    }))
    .mutation(async ({ input }) => {
      const artwork = await db.getArtworkById(input.artworkId);
      if (!artwork) throw new TRPCError({ code: 'NOT_FOUND' });
      
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an art style expert. Describe how an artwork would look if transformed to a different style." },
            { role: "user", content: [
              { type: "text", text: `Imagine this artwork "${artwork.title}" reimagined in the style of ${input.targetStyle}. Describe in vivid detail how it would look, what elements would change, and what would remain.` },
              { type: "image_url", image_url: { url: artwork.primaryImageUrl } }
            ]}
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "style_transfer",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  colorChanges: { type: "string" },
                  techniqueChanges: { type: "string" },
                  moodShift: { type: "string" },
                  famousInfluences: { type: "array", items: { type: "string" } }
                },
                required: ["description", "colorChanges", "techniqueChanges", "moodShift", "famousInfluences"],
                additionalProperties: false
              }
            }
          }
        });
        
        const content = response.choices[0]?.message?.content;
        return { originalStyle: artwork.style, targetStyle: input.targetStyle, ...JSON.parse(typeof content === 'string' ? content : "{}") };
      } catch (error) {
        return { originalStyle: artwork.style, targetStyle: input.targetStyle, description: "Style transfer preview unavailable", colorChanges: "", techniqueChanges: "", moodShift: "", famousInfluences: [] };
      }
    }),

  // Virtual Gallery Tour
  generateGalleryTour: publicProcedure
    .input(z.object({
      artworkIds: z.array(z.number()),
      theme: z.string().optional(),
      duration: z.enum(['short', 'medium', 'long']).optional()
    }))
    .mutation(async ({ input }) => {
      const artworks = await Promise.all(input.artworkIds.map(id => db.getArtworkById(id)));
      const validArtworks = artworks.filter(Boolean);
      
      if (validArtworks.length === 0) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No valid artworks' });
      
      const artworkList = validArtworks.map(a => `"${a!.title}" by ${a!.artistName} (${a!.style}, ${a!.medium})`).join('; ');
      
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an engaging museum guide creating personalized art tours. Be informative yet accessible." },
            { role: "user", content: `Create a ${input.duration || 'medium'} virtual gallery tour script for these artworks: ${artworkList}. ${input.theme ? `Theme: ${input.theme}` : 'Find a connecting theme.'}` }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "gallery_tour",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  tourTitle: { type: "string" },
                  introduction: { type: "string" },
                  stops: { type: "array", items: {
                    type: "object",
                    properties: {
                      artworkTitle: { type: "string" },
                      narrative: { type: "string" },
                      funFact: { type: "string" },
                      transitionToNext: { type: "string" }
                    },
                    required: ["artworkTitle", "narrative", "funFact", "transitionToNext"],
                    additionalProperties: false
                  }},
                  conclusion: { type: "string" },
                  suggestedQuestions: { type: "array", items: { type: "string" } }
                },
                required: ["tourTitle", "introduction", "stops", "conclusion", "suggestedQuestions"],
                additionalProperties: false
              }
            }
          }
        });
        
        const content = response.choices[0]?.message?.content;
        return JSON.parse(typeof content === 'string' ? content : "{}");
      } catch (error) {
        return { tourTitle: "Gallery Tour", introduction: "Welcome to your personalized tour.", stops: [], conclusion: "Thank you for joining us.", suggestedQuestions: [] };
      }
    }),

  // Comparative Analysis
  compareArtworks: publicProcedure
    .input(z.object({
      artworkId: z.number(),
      compareToFamous: z.boolean().optional()
    }))
    .mutation(async ({ input }) => {
      const artwork = await db.getArtworkById(input.artworkId);
      if (!artwork) throw new TRPCError({ code: 'NOT_FOUND' });
      
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an art historian specializing in comparative analysis." },
            { role: "user", content: [
              { type: "text", text: `Compare this artwork "${artwork.title}" by ${artwork.artistName} (${artwork.style}) to famous works in art history. Identify influences, similarities, and unique qualities.` },
              { type: "image_url", image_url: { url: artwork.primaryImageUrl } }
            ]}
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "comparative_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  similarFamousWorks: { type: "array", items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      artist: { type: "string" },
                      similarity: { type: "string" },
                      differentiator: { type: "string" }
                    },
                    required: ["title", "artist", "similarity", "differentiator"],
                    additionalProperties: false
                  }},
                  influences: { type: "array", items: { type: "string" } },
                  uniqueQualities: { type: "array", items: { type: "string" } },
                  artHistoricalContext: { type: "string" }
                },
                required: ["similarFamousWorks", "influences", "uniqueQualities", "artHistoricalContext"],
                additionalProperties: false
              }
            }
          }
        });
        
        const content = response.choices[0]?.message?.content;
        return JSON.parse(typeof content === 'string' ? content : "{}");
      } catch (error) {
        return { similarFamousWorks: [], influences: [], uniqueQualities: [], artHistoricalContext: "Analysis unavailable" };
      }
    })
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  artwork: artworkRouter,
  profile: profileRouter,
  favorites: favoritesRouter,
  reviews: reviewsRouter,
  transaction: transactionRouter,
  recommendations: recommendationsRouter,
  provenance: provenanceRouter,
  admin: adminRouter,
  ai: aiRouter
});

export type AppRouter = typeof appRouter;
