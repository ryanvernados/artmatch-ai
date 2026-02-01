import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArtworkCard from "@/components/ArtworkCard";
import { Link, useParams } from "wouter";
import { 
  ShieldCheck, 
  MapPin, 
  Globe, 
  Calendar,
  Star,
  Package,
  ArrowLeft,
  Loader2,
  Palette
} from "lucide-react";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id || '0');

  const { data, isLoading } = trpc.profile.get.useQuery(
    { id: userId },
    { enabled: userId > 0 }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!data?.user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Profile not found</h2>
            <Button asChild>
              <Link href="/discover">Browse Artworks</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { user, artworks, reviews } = data;
  const avgRating = user.averageRating ? parseFloat(user.averageRating.toString()) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Back button */}
        <div className="container py-4">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link href="/discover">
              <ArrowLeft className="h-4 w-4" />
              Back to Discover
            </Link>
          </Button>
        </div>

        {/* Profile Header */}
        <section className="bg-muted/30 border-b">
          <div className="container py-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {user.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-serif font-bold">
                    {user.galleryName || user.name || 'Collector'}
                  </h1>
                  {user.isVerifiedSeller && (
                    <Badge className="trust-badge-verified gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Verified Seller
                    </Badge>
                  )}
                  <Badge variant="secondary" className="capitalize">
                    {user.userType}
                  </Badge>
                </div>

                {user.bio && (
                  <p className="text-muted-foreground mt-2 max-w-2xl">{user.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                  {user.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {user.location}
                    </span>
                  )}
                  {user.website && (
                    <a 
                      href={user.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(user.createdAt).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{artworks?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Artworks</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{user.totalSales || 0}</div>
                  <div className="text-sm text-muted-foreground">Sales</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                    {avgRating > 0 ? (
                      <>
                        <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                        {avgRating.toFixed(1)}
                      </>
                    ) : (
                      '-'
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Rating</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{user.totalReviews || 0}</div>
                  <div className="text-sm text-muted-foreground">Reviews</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Content Tabs */}
        <section className="py-8">
          <div className="container">
            <Tabs defaultValue="artworks">
              <TabsList>
                <TabsTrigger value="artworks" className="gap-2">
                  <Package className="h-4 w-4" />
                  Artworks ({artworks?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="reviews" className="gap-2">
                  <Star className="h-4 w-4" />
                  Reviews ({reviews?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="artworks" className="mt-6">
                {artworks && artworks.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {artworks.map((artwork) => (
                      <ArtworkCard
                        key={artwork.id}
                        artwork={artwork}
                        showActions={false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-xl">
                    <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No artworks listed</h3>
                    <p className="text-muted-foreground">
                      This user hasn't listed any artworks yet
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                {reviews && reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map(({ review, reviewer }) => (
                      <Card key={review.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <Avatar>
                              <AvatarImage src={reviewer?.avatarUrl || undefined} />
                              <AvatarFallback>
                                {reviewer?.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                  {reviewer?.name || 'Anonymous'}
                                </span>
                                {review.isVerifiedPurchase && (
                                  <Badge variant="outline" className="text-xs">
                                    Verified Purchase
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= review.rating
                                        ? "fill-amber-500 text-amber-500"
                                        : "text-muted"
                                    }`}
                                  />
                                ))}
                                <span className="text-sm text-muted-foreground">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              {review.title && (
                                <h4 className="font-medium mt-2">{review.title}</h4>
                              )}
                              {review.content && (
                                <p className="text-muted-foreground mt-1">{review.content}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-xl">
                    <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                    <p className="text-muted-foreground">
                      This user hasn't received any reviews
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
