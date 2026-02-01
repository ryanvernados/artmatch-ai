import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Eye, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Artwork } from "../../../drizzle/schema";

interface ArtworkCardProps {
  artwork: Artwork;
  onFavorite?: (id: number) => void;
  isFavorited?: boolean;
  showActions?: boolean;
}

export default function ArtworkCard({ 
  artwork, 
  onFavorite, 
  isFavorited = false,
  showActions = true 
}: ArtworkCardProps) {
  const formatPrice = (price: string | number) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: artwork.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const confidenceScore = artwork.aiConfidenceScore 
    ? parseFloat(artwork.aiConfidenceScore.toString()) 
    : null;

  return (
    <Card className="art-card group overflow-hidden border-0 shadow-sm hover:shadow-xl">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <Link href={`/artwork/${artwork.id}`}>
          <img
            src={artwork.primaryImageUrl}
            alt={artwork.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        
        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {artwork.verificationStatus === 'verified' && (
            <Badge className="trust-badge-verified gap-1">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </Badge>
          )}
          {confidenceScore && confidenceScore >= 80 && (
            <Badge className="trust-badge-high-confidence gap-1">
              <Sparkles className="h-3 w-3" />
              {confidenceScore}% AI Confidence
            </Badge>
          )}
        </div>

        {/* Favorite button */}
        {showActions && onFavorite && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-3 right-3 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white",
              isFavorited && "text-red-500"
            )}
            onClick={(e) => {
              e.preventDefault();
              onFavorite(artwork.id);
            }}
          >
            <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
          </Button>
        )}

        {/* Quick view on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Link href={`/artwork/${artwork.id}`}>
            <Button variant="secondary" className="gap-2">
              <Eye className="h-4 w-4" />
              View Details
            </Button>
          </Link>
        </div>
      </div>

      <CardContent className="p-4">
        <Link href={`/artwork/${artwork.id}`}>
          <h3 className="font-serif text-lg font-semibold line-clamp-1 hover:text-primary transition-colors">
            {artwork.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground mt-1">{artwork.artistName}</p>
        
        <div className="flex items-center justify-between mt-3">
          <span className="font-semibold text-lg">{formatPrice(artwork.price)}</span>
          {artwork.style && (
            <Badge variant="secondary" className="text-xs">
              {artwork.style}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {artwork.viewCount || 0}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {artwork.favoriteCount || 0}
          </span>
          {artwork.averageRating && parseFloat(artwork.averageRating.toString()) > 0 && (
            <span className="flex items-center gap-1">
              ★ {parseFloat(artwork.averageRating.toString()).toFixed(1)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
