import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrustBadge, { TrustScore, ProvenanceTimeline } from "@/components/TrustBadge";
import { Link, useParams, useLocation } from "wouter";
import { 
  Heart, 
  Share2, 
  Eye, 
  ShieldCheck, 
  MapPin,
  Calendar,
  Ruler,
  Palette,
  Award,
  Star,
  ArrowLeft,
  Loader2,
  Smartphone
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function ArtworkDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const artworkId = parseInt(id || '0');

  const { data, isLoading, refetch } = trpc.artwork.getById.useQuery(
    { id: artworkId },
    { enabled: artworkId > 0 }
  );

  const addFavorite = trpc.favorites.add.useMutation({
    onSuccess: () => {
      toast.success("Added to favorites");
      refetch();
    }
  });

  const removeFavorite = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      toast.success("Removed from favorites");
      refetch();
    }
  });

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (data?.isFavorited) {
      await removeFavorite.mutateAsync({ artworkId });
    } else {
      await addFavorite.mutateAsync({ artworkId });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: data?.artwork?.title,
        url: window.location.href
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const handleBuy = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    navigate(`/checkout/${artworkId}`);
  };

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

  if (!data?.artwork) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Artwork not found</h2>
            <Button asChild>
              <Link href="/discover">Browse Artworks</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { artwork, seller, reviews, endorsements, provenance, isFavorited } = data;
  
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

  const avgRating = artwork.averageRating 
    ? parseFloat(artwork.averageRating.toString()) 
    : 0;

  const isOwner = user?.id === artwork.sellerId;
  const canPurchase = artwork.status === 'active' && !isOwner;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="container py-4">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link href="/discover">
              <ArrowLeft className="h-4 w-4" />
              Back to Discover
            </Link>
          </Button>
        </div>

        <div className="container pb-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Section */}
            <div className="space-y-4">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
                <img
                  src={artwork.primaryImageUrl}
                  alt={artwork.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Trust badges overlay */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {artwork.verificationStatus === 'verified' && (
                    <TrustBadge type="verified" />
                  )}
                  {artwork.verificationStatus === 'pending' && (
                    <TrustBadge type="pending" />
                  )}
                  {confidenceScore && confidenceScore >= 70 && (
                    <TrustBadge type="confidence" value={confidenceScore} />
                  )}
                </div>
              </div>

              {/* AR Preview Button */}
              <Button 
                variant="outline" 
                className="w-full gap-2"
                asChild
              >
                <Link href={`/ar-preview/${artwork.id}`}>
                  <Smartphone className="h-4 w-4" />
                  Preview in Your Space (AR)
                </Link>
              </Button>
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              {/* Title & Artist */}
              <div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">
                  {artwork.title}
                </h1>
                <Link 
                  href={`/profile/${artwork.sellerId}`}
                  className="text-lg text-muted-foreground hover:text-primary transition-colors"
                >
                  by {artwork.artistName}
                </Link>
              </div>

              {/* Price & Actions */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl font-bold">{formatPrice(artwork.price)}</span>
                  {artwork.aiSuggestedPrice && (
                    <p className="text-sm text-muted-foreground mt-1">
                      AI suggested: {formatPrice(artwork.aiSuggestedPrice)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleFavorite}
                    className={isFavorited ? "text-red-500" : ""}
                  >
                    <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleShare}>
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Buy Button */}
              {canPurchase ? (
                <Button size="lg" className="w-full" onClick={handleBuy}>
                  Purchase Now
                </Button>
              ) : artwork.status === 'sold' ? (
                <Button size="lg" className="w-full" disabled>
                  Sold
                </Button>
              ) : artwork.status === 'reserved' ? (
                <Button size="lg" className="w-full" disabled>
                  Reserved
                </Button>
              ) : isOwner ? (
                <Button size="lg" variant="outline" className="w-full" asChild>
                  <Link href={`/edit-listing/${artwork.id}`}>Edit Listing</Link>
                </Button>
              ) : null}

              <Separator />

              {/* Artwork Details */}
              <div className="grid grid-cols-2 gap-4">
                {artwork.medium && (
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{artwork.medium}</span>
                  </div>
                )}
                {artwork.dimensions && (
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{artwork.dimensions}</span>
                  </div>
                )}
                {artwork.yearCreated && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{artwork.yearCreated}</span>
                  </div>
                )}
                {artwork.style && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{artwork.style}</Badge>
                  </div>
                )}
              </div>

              {/* Description */}
              {artwork.description && (
                <div>
                  <h3 className="font-semibold mb-2">About this artwork</h3>
                  <p className="text-muted-foreground">{artwork.description}</p>
                </div>
              )}

              {/* Seller Info */}
              {seller && (
                <Card>
                  <CardContent className="p-4">
                    <Link href={`/profile/${seller.id}`} className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={seller.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {seller.name?.charAt(0) || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{seller.name || 'Seller'}</span>
                          {seller.isVerifiedSeller && (
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {seller.totalSales && seller.totalSales > 0 && (
                            <span>{seller.totalSales} sales</span>
                          )}
                          {seller.averageRating && parseFloat(seller.averageRating.toString()) > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                              {parseFloat(seller.averageRating.toString()).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Trust Dashboard Tabs */}
          <div className="mt-12">
            <Tabs defaultValue="trust" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="trust">Trust Dashboard</TabsTrigger>
                <TabsTrigger value="provenance">Provenance</TabsTrigger>
                <TabsTrigger value="reviews">Reviews ({reviews?.length || 0})</TabsTrigger>
                <TabsTrigger value="endorsements">Expert Endorsements</TabsTrigger>
              </TabsList>

              <TabsContent value="trust" className="mt-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* AI Confidence */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">AI Confidence Score</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                      {confidenceScore ? (
                        <div className="text-center">
                          <TrustScore score={confidenceScore} size="lg" />
                          <p className="text-sm text-muted-foreground mt-4">
                            Based on market analysis and artwork verification
                          </p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Not yet analyzed</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Verification Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Verification Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        {artwork.verificationStatus === 'verified' ? (
                          <>
                            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                              <ShieldCheck className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-green-600">Verified</p>
                              <p className="text-sm text-muted-foreground">
                                Authenticity confirmed
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                              <Eye className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-amber-600">Pending</p>
                              <p className="text-sm text-muted-foreground">
                                Under review
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Community Rating */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Community Rating</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {avgRating > 0 ? (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-5 w-5 ${
                                  star <= avgRating
                                    ? "fill-amber-500 text-amber-500"
                                    : "text-muted"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold">{avgRating.toFixed(1)}</span>
                          <span className="text-muted-foreground">
                            ({artwork.totalReviews} reviews)
                          </span>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No reviews yet</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="provenance" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    {provenance && provenance.length > 0 ? (
                      <ProvenanceTimeline events={provenance} />
                    ) : (
                      <div className="text-center py-8">
                        <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No provenance history recorded yet
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    {reviews && reviews.length > 0 ? (
                      <div className="space-y-6">
                        {reviews.map(({ review, reviewer }) => (
                          <div key={review.id} className="border-b last:border-0 pb-6 last:pb-0">
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
                                    <TrustBadge type="purchase" />
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
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No reviews yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="endorsements" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    {endorsements && endorsements.length > 0 ? (
                      <div className="space-y-6">
                        {endorsements.map((endorsement) => (
                          <div key={endorsement.id} className="border-b last:border-0 pb-6 last:pb-0">
                            <div className="flex items-start gap-4">
                              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                                <Award className="h-6 w-6 text-accent-foreground" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{endorsement.expertName}</span>
                                  {endorsement.authenticityConfirmed && (
                                    <Badge className="bg-green-500/10 text-green-700">
                                      Authenticity Confirmed
                                    </Badge>
                                  )}
                                </div>
                                {endorsement.expertTitle && (
                                  <p className="text-sm text-muted-foreground">
                                    {endorsement.expertTitle}
                                  </p>
                                )}
                                <p className="mt-2">{endorsement.endorsementText}</p>
                                {endorsement.expertCredentials && (
                                  <p className="text-sm text-muted-foreground mt-2">
                                    Credentials: {endorsement.expertCredentials}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No expert endorsements yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
