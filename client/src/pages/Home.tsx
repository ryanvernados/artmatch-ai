import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArtworkCard from "@/components/ArtworkCard";
import { 
  Sparkles, 
  ShieldCheck, 
  Eye, 
  TrendingUp, 
  ArrowRight,
  Palette,
  Users,
  Award
} from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  
  const { data: featuredArtworks, isLoading } = trpc.artwork.list.useQuery({
    status: 'active',
    limit: 8,
    orderBy: 'popular'
  });

  const toggleFavorite = trpc.favorites.add.useMutation();
  const removeFavorite = trpc.favorites.remove.useMutation();

  const handleFavorite = async (artworkId: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    // Simple toggle - in production, track state properly
    await toggleFavorite.mutateAsync({ artworkId });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted">
        <div className="absolute inset-0 pattern-dots opacity-30" />
        <div className="container relative py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                AI-Powered Art Discovery
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight">
                Discover Art You'll{" "}
                <span className="text-gradient">Love & Trust</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg">
                The marketplace where AI meets authenticity. Find verified artworks, 
                preview them in your space with AR, and buy with confidence through 
                our trust-first platform.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link href="/discover">
                    Explore Artworks
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                {!isAuthenticated && (
                  <Button size="lg" variant="outline" asChild>
                    <a href={getLoginUrl()}>Start Selling</a>
                  </Button>
                )}
                {isAuthenticated && (
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/create-listing">List Your Art</Link>
                  </Button>
                )}
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  Verified Artworks
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-5 w-5 text-primary" />
                  AR Preview
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  AI Pricing
                </div>
              </div>
            </div>

            {/* Hero Image Grid */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden shadow-2xl">
                    <img 
                      src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=500&fit=crop" 
                      alt="Featured artwork"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 overflow-hidden shadow-xl">
                    <img 
                      src="https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=300&h=300&fit=crop" 
                      alt="Featured artwork"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-muted to-primary/10 overflow-hidden shadow-xl">
                    <img 
                      src="https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=300&h=300&fit=crop" 
                      alt="Featured artwork"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-primary/10 to-muted overflow-hidden shadow-2xl">
                    <img 
                      src="https://images.unsplash.com/photo-1549887534-1541e9326642?w=400&h=500&fit=crop" 
                      alt="Featured artwork"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              How ArtMatch AI Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform makes discovering, verifying, and purchasing art 
              easier and more trustworthy than ever before.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Discovery</h3>
              <p className="text-muted-foreground">
                Our AI learns your taste and recommends artworks that match your style, 
                budget, and space preferences.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AR Preview</h3>
              <p className="text-muted-foreground">
                Visualize any artwork in your own space using augmented reality 
                before making a purchase decision.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Trust & Verification</h3>
              <p className="text-muted-foreground">
                Every artwork comes with AI confidence scores, provenance trails, 
                and community ratings for complete transparency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Artworks */}
      <section className="py-20">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-serif font-bold">Featured Artworks</h2>
              <p className="text-muted-foreground mt-1">
                Discover trending pieces from verified sellers
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/discover">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : featuredArtworks && featuredArtworks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredArtworks.map((artwork) => (
                <ArtworkCard
                  key={artwork.id}
                  artwork={artwork}
                  onFavorite={handleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-xl">
              <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No artworks yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to list your artwork on ArtMatch AI
              </p>
              <Button asChild>
                <Link href="/create-listing">List Your Art</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">10K+</div>
              <div className="text-primary-foreground/70">Artworks Listed</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">5K+</div>
              <div className="text-primary-foreground/70">Verified Artists</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">98%</div>
              <div className="text-primary-foreground/70">Trust Score</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">$2M+</div>
              <div className="text-primary-foreground/70">Art Traded</div>
            </div>
          </div>
        </div>
      </section>

      {/* For Sellers CTA */}
      <section className="py-20">
        <div className="container">
          <div className="bg-gradient-to-br from-muted to-muted/50 rounded-3xl p-8 md:p-12 lg:p-16">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
                  Ready to Sell Your Art?
                </h2>
                <p className="text-muted-foreground text-lg mb-6">
                  Join thousands of artists and galleries using AI-powered pricing 
                  suggestions and reaching the right collectors.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                    </div>
                    <span>AI-powered pricing suggestions</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Reach verified collectors worldwide</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Award className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Build trust with provenance verification</span>
                  </li>
                </ul>
                <Button size="lg" asChild>
                  {isAuthenticated ? (
                    <Link href="/create-listing">
                      Start Listing
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  ) : (
                    <a href={getLoginUrl()}>
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  )}
                </Button>
              </div>
              <div className="hidden lg:block">
                <img 
                  src="https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&h=400&fit=crop"
                  alt="Artist studio"
                  className="rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
