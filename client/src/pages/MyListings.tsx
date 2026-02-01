import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { Loader2, Plus, Edit, Eye, Palette } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function MyListings() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: artworks, isLoading } = trpc.artwork.getMyListings.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) window.location.href = getLoginUrl();
  }, [authLoading, isAuthenticated]);

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex flex-col"><Navbar /><div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>;
  }

  const formatPrice = (price: string | number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(typeof price === 'string' ? parseFloat(price) : price);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-700';
      case 'sold': return 'bg-blue-500/10 text-blue-700';
      case 'reserved': return 'bg-amber-500/10 text-amber-700';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div><h1 className="text-3xl font-serif font-bold">My Listings</h1><p className="text-muted-foreground mt-1">Manage your artwork listings</p></div>
            <Button asChild><Link href="/create-listing"><Plus className="h-4 w-4 mr-2" />New Listing</Link></Button>
          </div>

          {artworks && artworks.length > 0 ? (
            <div className="grid gap-4">
              {artworks.map((artwork) => (
                <Card key={artwork.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img src={artwork.primaryImageUrl} alt={artwork.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold truncate">{artwork.title}</h3>
                            <p className="text-sm text-muted-foreground">{artwork.artistName}</p>
                          </div>
                          <Badge className={getStatusColor(artwork.status || 'draft')}>{artwork.status || 'draft'}</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="font-semibold">{formatPrice(artwork.price)}</span>
                          <span className="text-sm text-muted-foreground"><Eye className="h-3 w-3 inline mr-1" />{artwork.viewCount || 0} views</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" asChild><Link href={`/edit-listing/${artwork.id}`}><Edit className="h-3 w-3 mr-1" />Edit</Link></Button>
                          <Button size="sm" variant="ghost" asChild><Link href={`/artwork/${artwork.id}`}>View</Link></Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/30 rounded-xl">
              <Palette className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No listings yet</h3>
              <p className="text-muted-foreground mb-6">Start selling your artwork on ArtMatch AI</p>
              <Button asChild><Link href="/create-listing">Create Your First Listing</Link></Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
