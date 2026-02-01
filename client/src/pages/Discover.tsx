import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import ArtworkCard from "@/components/ArtworkCard";
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  Palette,
  Loader2
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

const STYLES = [
  "Contemporary",
  "Abstract",
  "Impressionist",
  "Modern",
  "Classical",
  "Minimalist",
  "Pop Art",
  "Surrealist",
  "Expressionist",
  "Realist"
];

const MEDIUMS = [
  "Oil Painting",
  "Acrylic",
  "Watercolor",
  "Digital Art",
  "Photography",
  "Sculpture",
  "Mixed Media",
  "Print",
  "Drawing",
  "Collage"
];

export default function Discover() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  
  // Parse URL params
  const urlParams = useMemo(() => new URLSearchParams(location.split('?')[1] || ''), [location]);
  
  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || '');
  const [selectedStyle, setSelectedStyle] = useState(urlParams.get('style') || '');
  const [selectedMedium, setSelectedMedium] = useState(urlParams.get('medium') || '');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'popular'>('newest');
  const [showFilters, setShowFilters] = useState(false);

  const { data: artworks, isLoading, refetch } = trpc.artwork.list.useQuery({
    status: 'active',
    search: searchQuery || undefined,
    style: selectedStyle || undefined,
    medium: selectedMedium || undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 100000 ? priceRange[1] : undefined,
    orderBy: sortBy,
    limit: 24
  });

  const toggleFavorite = trpc.favorites.add.useMutation({
    onSuccess: () => refetch()
  });

  const handleFavorite = async (artworkId: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    await toggleFavorite.mutateAsync({ artworkId });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStyle('');
    setSelectedMedium('');
    setPriceRange([0, 100000]);
    setSortBy('newest');
  };

  const hasActiveFilters = searchQuery || selectedStyle || selectedMedium || priceRange[0] > 0 || priceRange[1] < 100000;

  const formatPrice = (value: number) => {
    if (value >= 100000) return '$100K+';
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  return (
    <AppLayout>
      <main className="flex-1">
        {/* Header */}
        <section className="bg-muted/30 border-b">
          <div className="container py-8">
            <h1 className="text-3xl font-serif font-bold mb-2">Discover Artworks</h1>
            <p className="text-muted-foreground">
              Explore thousands of verified artworks from trusted sellers
            </p>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="border-b sticky top-16 bg-background z-40">
          <div className="container py-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search artworks, artists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex gap-2">
                <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Style" />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLES.map(style => (
                      <SelectItem key={style} value={style.toLowerCase()}>
                        {style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedMedium} onValueChange={setSelectedMedium}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Medium" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDIUMS.map(medium => (
                      <SelectItem key={medium} value={medium.toLowerCase()}>
                        {medium}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>

            {/* Extended Filters */}
            {showFilters && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">
                      Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={(v) => setPriceRange(v as [number, number])}
                      min={0}
                      max={100000}
                      step={1000}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-4">
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSearchQuery('')}
                    />
                  </Badge>
                )}
                {selectedStyle && (
                  <Badge variant="secondary" className="gap-1">
                    Style: {selectedStyle}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSelectedStyle('')}
                    />
                  </Badge>
                )}
                {selectedMedium && (
                  <Badge variant="secondary" className="gap-1">
                    Medium: {selectedMedium}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSelectedMedium('')}
                    />
                  </Badge>
                )}
                {(priceRange[0] > 0 || priceRange[1] < 100000) && (
                  <Badge variant="secondary" className="gap-1">
                    Price: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setPriceRange([0, 100000])}
                    />
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-muted-foreground"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Results */}
        <section className="py-8">
          <div className="container">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : artworks && artworks.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-6">
                  {artworks.length} artwork{artworks.length !== 1 ? 's' : ''} found
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {artworks.map((artwork) => (
                    <ArtworkCard
                      key={artwork.id}
                      artwork={artwork}
                      onFavorite={handleFavorite}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <Palette className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No artworks found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters or search terms
                </p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            )}
          </div>
        </section>
      </main>
    </AppLayout>
  );
}
