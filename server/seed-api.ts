/**
 * Seed script that works through the API routes
 * This creates test data by calling the existing tRPC endpoints
 */

import { drizzle } from "drizzle-orm/mysql2";
import { 
  users, artworks, provenanceHistory 
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Sample artwork images from public sources (Unsplash)
const sampleImages = [
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800",
  "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=800",
  "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=800",
  "https://images.unsplash.com/photo-1549887534-1541e9326642?w=800",
  "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800",
  "https://images.unsplash.com/photo-1582201942988-13e60e4556ee?w=800",
  "https://images.unsplash.com/photo-1579541814924-49fef17c5be5?w=800",
  "https://images.unsplash.com/photo-1574182245530-967d9b3831af?w=800",
  "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=800",
  "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800",
  "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=800",
  "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=800"
];

const seedUsers = [
  {
    openId: "seed-user-1",
    name: "Elena Martinez",
    email: "elena@example.com",
    role: "user" as const,
    userType: "both" as const,
    bio: "Contemporary artist specializing in abstract expressionism. Based in Barcelona.",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    location: "Barcelona, Spain",
    isVerifiedSeller: true,
    galleryName: "Martinez Gallery"
  },
  {
    openId: "seed-user-2",
    name: "James Chen",
    email: "james@example.com",
    role: "user" as const,
    userType: "seller" as const,
    bio: "Traditional oil painter with 20 years of experience. Focused on landscapes and portraits.",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    location: "San Francisco, CA",
    isVerifiedSeller: true,
    galleryName: "Chen Fine Arts"
  },
  {
    openId: "seed-user-3",
    name: "Sophie Laurent",
    email: "sophie@example.com",
    role: "user" as const,
    userType: "both" as const,
    bio: "Digital artist and sculptor exploring the intersection of technology and traditional art.",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
    location: "Paris, France",
    isVerifiedSeller: true,
    galleryName: "Laurent Studio"
  }
];

const seedArtworks = [
  {
    title: "Ethereal Dreams",
    description: "A mesmerizing abstract piece that captures the essence of dreams and subconscious thoughts. Created using mixed media techniques including acrylic and gold leaf.",
    artistName: "Elena Martinez",
    artistBio: "Contemporary artist specializing in abstract expressionism.",
    medium: "Mixed Media",
    style: "Abstract",
    dimensions: "48 x 36 inches",
    yearCreated: 2024,
    price: "4500.00",
    primaryImageUrl: sampleImages[0],
    verificationStatus: "verified" as const,
    aiConfidenceScore: "92.50",
    status: "active" as const,
    viewCount: 234,
    favoriteCount: 45
  },
  {
    title: "Urban Solitude",
    description: "A contemplative cityscape capturing the quiet moments in a bustling metropolis. Oil on canvas with rich textures and muted tones.",
    artistName: "James Chen",
    artistBio: "Traditional oil painter with 20 years of experience.",
    medium: "Oil on Canvas",
    style: "Contemporary",
    dimensions: "36 x 48 inches",
    yearCreated: 2023,
    price: "6800.00",
    primaryImageUrl: sampleImages[1],
    verificationStatus: "verified" as const,
    aiConfidenceScore: "88.75",
    status: "active" as const,
    viewCount: 189,
    favoriteCount: 32
  },
  {
    title: "Chromatic Harmony",
    description: "An explosion of color and form that celebrates the joy of pure visual expression. Acrylic on stretched canvas.",
    artistName: "Sophie Laurent",
    artistBio: "Digital artist and sculptor exploring technology and traditional art.",
    medium: "Acrylic",
    style: "Abstract",
    dimensions: "40 x 40 inches",
    yearCreated: 2024,
    price: "3200.00",
    primaryImageUrl: sampleImages[2],
    verificationStatus: "verified" as const,
    aiConfidenceScore: "95.00",
    status: "active" as const,
    viewCount: 312,
    favoriteCount: 67
  },
  {
    title: "Whispers of Nature",
    description: "A delicate watercolor capturing the subtle beauty of a forest at dawn. Part of the 'Nature's Voice' series.",
    artistName: "Elena Martinez",
    artistBio: "Contemporary artist specializing in abstract expressionism.",
    medium: "Watercolor",
    style: "Impressionist",
    dimensions: "24 x 18 inches",
    yearCreated: 2023,
    price: "1800.00",
    primaryImageUrl: sampleImages[3],
    verificationStatus: "verified" as const,
    aiConfidenceScore: "89.25",
    status: "active" as const,
    viewCount: 156,
    favoriteCount: 28
  },
  {
    title: "Digital Renaissance",
    description: "A stunning digital artwork that reimagines classical Renaissance themes through a modern lens. Printed on archival paper.",
    artistName: "Sophie Laurent",
    artistBio: "Digital artist and sculptor exploring technology and traditional art.",
    medium: "Digital Print",
    style: "Contemporary",
    dimensions: "30 x 40 inches",
    yearCreated: 2024,
    price: "2500.00",
    primaryImageUrl: sampleImages[4],
    verificationStatus: "pending" as const,
    aiConfidenceScore: "78.50",
    status: "active" as const,
    viewCount: 98,
    favoriteCount: 15
  },
  {
    title: "Ocean's Memory",
    description: "A large-scale seascape capturing the power and tranquility of the ocean. Created with palette knife technique.",
    artistName: "James Chen",
    artistBio: "Traditional oil painter with 20 years of experience.",
    medium: "Oil on Canvas",
    style: "Realism",
    dimensions: "60 x 40 inches",
    yearCreated: 2022,
    price: "12000.00",
    primaryImageUrl: sampleImages[5],
    verificationStatus: "verified" as const,
    aiConfidenceScore: "96.75",
    status: "active" as const,
    viewCount: 445,
    favoriteCount: 89
  },
  {
    title: "Geometric Dreams",
    description: "A bold geometric composition exploring the relationship between form and color. Acrylic on wood panel.",
    artistName: "Elena Martinez",
    artistBio: "Contemporary artist specializing in abstract expressionism.",
    medium: "Acrylic",
    style: "Geometric",
    dimensions: "36 x 36 inches",
    yearCreated: 2024,
    price: "3800.00",
    primaryImageUrl: sampleImages[6],
    verificationStatus: "verified" as const,
    aiConfidenceScore: "91.00",
    status: "active" as const,
    viewCount: 201,
    favoriteCount: 41
  },
  {
    title: "Portrait of Silence",
    description: "An intimate portrait study exploring themes of introspection and solitude. Charcoal and pastel on paper.",
    artistName: "James Chen",
    artistBio: "Traditional oil painter with 20 years of experience.",
    medium: "Charcoal & Pastel",
    style: "Figurative",
    dimensions: "24 x 30 inches",
    yearCreated: 2023,
    price: "4200.00",
    primaryImageUrl: sampleImages[7],
    verificationStatus: "verified" as const,
    aiConfidenceScore: "87.50",
    status: "active" as const,
    viewCount: 178,
    favoriteCount: 36
  },
  {
    title: "Neon Nights",
    description: "A vibrant exploration of urban nightlife through bold colors and dynamic composition. Mixed media on canvas.",
    artistName: "Sophie Laurent",
    artistBio: "Digital artist and sculptor exploring technology and traditional art.",
    medium: "Mixed Media",
    style: "Pop Art",
    dimensions: "48 x 36 inches",
    yearCreated: 2024,
    price: "5500.00",
    primaryImageUrl: sampleImages[8],
    verificationStatus: "verified" as const,
    aiConfidenceScore: "93.25",
    status: "active" as const,
    viewCount: 267,
    favoriteCount: 52
  },
  {
    title: "Autumn Reflections",
    description: "A serene landscape capturing the golden hues of autumn reflected in a still pond. Oil on linen.",
    artistName: "James Chen",
    artistBio: "Traditional oil painter with 20 years of experience.",
    medium: "Oil on Linen",
    style: "Impressionist",
    dimensions: "40 x 30 inches",
    yearCreated: 2023,
    price: "7500.00",
    primaryImageUrl: sampleImages[9],
    verificationStatus: "verified" as const,
    aiConfidenceScore: "94.50",
    status: "active" as const,
    viewCount: 389,
    favoriteCount: 74
  },
  {
    title: "Cosmic Dance",
    description: "An abstract interpretation of celestial bodies in motion. Acrylic with metallic accents on canvas.",
    artistName: "Elena Martinez",
    artistBio: "Contemporary artist specializing in abstract expressionism.",
    medium: "Acrylic",
    style: "Abstract",
    dimensions: "48 x 48 inches",
    yearCreated: 2024,
    price: "5800.00",
    primaryImageUrl: sampleImages[10],
    verificationStatus: "pending" as const,
    aiConfidenceScore: "85.00",
    status: "active" as const,
    viewCount: 145,
    favoriteCount: 23
  },
  {
    title: "The Last Light",
    description: "A dramatic sunset scene over mountain peaks. Created en plein air during an expedition to the Alps.",
    artistName: "James Chen",
    artistBio: "Traditional oil painter with 20 years of experience.",
    medium: "Oil on Canvas",
    style: "Realism",
    dimensions: "36 x 24 inches",
    yearCreated: 2022,
    price: "8500.00",
    primaryImageUrl: sampleImages[11],
    verificationStatus: "verified" as const,
    aiConfidenceScore: "97.25",
    status: "active" as const,
    viewCount: 512,
    favoriteCount: 98
  }
];

// Export seed data for use in routes
export const SEED_USERS = seedUsers;
export const SEED_ARTWORKS = seedArtworks;

export async function seedDatabase(databaseUrl: string) {
  console.log("Starting database seed...");
  const db = drizzle(databaseUrl);

  try {
    // Insert users
    const userMap = new Map<string, number>();
    
    for (const userData of seedUsers) {
      // Check if user already exists
      const existing = await db.select().from(users).where(eq(users.openId, userData.openId)).limit(1);
      
      if (existing.length > 0) {
        userMap.set(userData.name, existing[0].id);
        console.log(`User ${userData.name} already exists with ID ${existing[0].id}`);
      } else {
        const result = await db.insert(users).values({
          ...userData,
          lastSignedIn: new Date()
        });
        const userId = result[0].insertId;
        userMap.set(userData.name, userId);
        console.log(`Created user ${userData.name} with ID ${userId}`);
      }
    }

    // Insert artworks
    for (const artworkData of seedArtworks) {
      const sellerId = userMap.get(artworkData.artistName);
      if (!sellerId) {
        console.log(`Skipping artwork ${artworkData.title}: seller not found`);
        continue;
      }

      const result = await db.insert(artworks).values({
        ...artworkData,
        sellerId,
        additionalImages: JSON.stringify([])
      });
      const artworkId = result[0].insertId;
      console.log(`Created artwork "${artworkData.title}" with ID ${artworkId}`);

      // Add provenance history for verified artworks
      if (artworkData.verificationStatus === "verified") {
        await db.insert(provenanceHistory).values({
          artworkId,
          eventType: "creation",
          eventDate: new Date(artworkData.yearCreated, 0, 1),
          description: `Created by ${artworkData.artistName}`,
          location: seedUsers.find(u => u.name === artworkData.artistName)?.location || "Unknown"
        });

        await db.insert(provenanceHistory).values({
          artworkId,
          eventType: "authentication",
          eventDate: new Date(),
          description: "Verified by ArtMatch AI authentication system",
          verifiedBy: "ArtMatch AI"
        });
      }
    }

    console.log("Seed completed successfully!");
    return { success: true };
  } catch (error) {
    console.error("Seed error:", error);
    throw error;
  }
}
