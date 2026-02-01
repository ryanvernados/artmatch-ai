import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppLayout from "@/components/AppLayout";
import { useLocation } from "wouter";
import { 
  Loader2, 
  Upload, 
  Sparkles, 
  ArrowRight,
  ImagePlus,
  X
} from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

const STYLES = [
  "Contemporary", "Abstract", "Impressionist", "Modern", "Classical",
  "Minimalist", "Pop Art", "Surrealist", "Expressionist", "Realist"
];

const MEDIUMS = [
  "Oil Painting", "Acrylic", "Watercolor", "Digital Art", "Photography",
  "Sculpture", "Mixed Media", "Print", "Drawing", "Collage"
];

export default function CreateListing() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    artistName: '',
    artistBio: '',
    medium: '',
    style: '',
    dimensions: '',
    yearCreated: '',
    price: ''
  });

  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pricingSuggestion, setPricingSuggestion] = useState<any>(null);

  const createArtwork = trpc.artwork.create.useMutation({
    onSuccess: (data) => {
      toast.success("Artwork listed successfully!");
      navigate(`/artwork/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create listing");
    }
  });

  const getPricing = trpc.artwork.getPricingSuggestion.useMutation({
    onSuccess: (data) => {
      setPricingSuggestion(data);
      toast.success("AI pricing analysis complete!");
    },
    onError: () => {
      toast.error("Failed to get pricing suggestion");
    }
  });

  const uploadImage = trpc.artwork.uploadImage.useMutation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (user?.name && !formData.artistName) {
      setFormData(prev => ({ ...prev, artistName: user.name || '' }));
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await uploadImage.mutateAsync({
          base64,
          filename: file.name,
          contentType: file.type
        });
        setImageUrl(result.url);
        toast.success("Image uploaded successfully");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleGetPricing = async () => {
    if (!formData.title || !formData.artistName) {
      toast.error("Please fill in title and artist name first");
      return;
    }

    await getPricing.mutateAsync({
      title: formData.title,
      artistName: formData.artistName,
      medium: formData.medium || undefined,
      style: formData.style || undefined,
      dimensions: formData.dimensions || undefined,
      yearCreated: formData.yearCreated ? parseInt(formData.yearCreated) : undefined,
      description: formData.description || undefined
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageUrl) {
      toast.error("Please upload an image");
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    await createArtwork.mutateAsync({
      title: formData.title,
      description: formData.description || undefined,
      artistName: formData.artistName,
      artistBio: formData.artistBio || undefined,
      medium: formData.medium || undefined,
      style: formData.style || undefined,
      dimensions: formData.dimensions || undefined,
      yearCreated: formData.yearCreated ? parseInt(formData.yearCreated) : undefined,
      price: parseFloat(formData.price),
      primaryImageUrl: imageUrl
    });
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="flex-1 py-8">
        <div className="container max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold">List Your Artwork</h1>
            <p className="text-muted-foreground mt-1">
              Create a listing with AI-powered pricing suggestions
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left Column - Image Upload */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Artwork Image</CardTitle>
                    <CardDescription>
                      Upload a high-quality image of your artwork
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {imageUrl ? (
                      <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-muted">
                        <img
                          src={imageUrl}
                          alt="Artwork preview"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => setImageUrl('')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center aspect-[4/5] rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                        {uploading ? (
                          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <ImagePlus className="h-12 w-12 text-muted-foreground mb-4" />
                            <span className="text-muted-foreground">
                              Click to upload image
                            </span>
                            <span className="text-xs text-muted-foreground mt-1">
                              Max 10MB, JPG/PNG
                            </span>
                          </>
                        )}
                      </label>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Details */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Artwork Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Artwork title"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="artistName">Artist Name *</Label>
                      <Input
                        id="artistName"
                        value={formData.artistName}
                        onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                        placeholder="Artist name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe your artwork..."
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="style">Style</Label>
                        <Select
                          value={formData.style}
                          onValueChange={(v) => setFormData({ ...formData, style: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                          <SelectContent>
                            {STYLES.map(style => (
                              <SelectItem key={style} value={style.toLowerCase()}>
                                {style}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="medium">Medium</Label>
                        <Select
                          value={formData.medium}
                          onValueChange={(v) => setFormData({ ...formData, medium: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select medium" />
                          </SelectTrigger>
                          <SelectContent>
                            {MEDIUMS.map(medium => (
                              <SelectItem key={medium} value={medium.toLowerCase()}>
                                {medium}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dimensions">Dimensions</Label>
                        <Input
                          id="dimensions"
                          value={formData.dimensions}
                          onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                          placeholder="e.g., 24 x 36 inches"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="yearCreated">Year Created</Label>
                        <Input
                          id="yearCreated"
                          type="number"
                          value={formData.yearCreated}
                          onChange={(e) => setFormData({ ...formData, yearCreated: e.target.value })}
                          placeholder="e.g., 2024"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing</CardTitle>
                    <CardDescription>
                      Set your price or get an AI-powered suggestion
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={handleGetPricing}
                      disabled={getPricing.isPending}
                    >
                      {getPricing.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Get AI Pricing Suggestion
                    </Button>

                    {pricingSuggestion && (
                      <div className="p-4 bg-primary/5 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Suggested Price</span>
                          <span className="text-xl font-bold text-primary">
                            ${pricingSuggestion.suggestedPrice.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Price Range</span>
                          <span>
                            ${pricingSuggestion.priceRange.low.toLocaleString()} - 
                            ${pricingSuggestion.priceRange.high.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">AI Confidence</span>
                          <span className="font-medium">{pricingSuggestion.confidenceScore}%</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {pricingSuggestion.marketAnalysis}
                        </p>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setFormData({ 
                            ...formData, 
                            price: pricingSuggestion.suggestedPrice.toString() 
                          })}
                        >
                          Use Suggested Price
                        </Button>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="price">Your Price (USD) *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          id="price"
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="0.00"
                          className="pl-8"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full gap-2"
                  disabled={createArtwork.isPending || !imageUrl}
                >
                  {createArtwork.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Create Listing
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </AppLayout>
  );
}
