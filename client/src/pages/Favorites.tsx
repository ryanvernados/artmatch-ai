import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import ArtworkCard from "@/components/ArtworkCard";
import { Link } from "wouter";
import { Loader2, Heart } from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function Favorites() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data: favorites, isLoading } = trpc.favorites.list.useQuery(undefined, { enabled: isAuthenticated });
  const removeFavorite = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      toast.success("Removed from favorites");
      utils.favorites.list.invalidate();
    }
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) window.location.href = getLoginUrl();
  }, [authLoading, isAuthenticated]);

  if (authLoading || isLoading) {
    return <DashboardLayout><div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  return (
    <AppLayout>
      <main className="flex-1 py-8">
        <div className="container">
          <div className="mb-8"><h1 className="text-3xl font-serif font-bold">My Favorites</h1><p className="text-muted-foreground mt-1">Artworks you've saved</p></div>
          {favorites && favorites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map(({ artwork }) => (
                <ArtworkCard key={artwork.id} artwork={artwork} isFavorited={true} onFavorite={(id) => removeFavorite.mutate({ artworkId: id })} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/30 rounded-xl">
              <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
              <p className="text-muted-foreground mb-6">Start exploring and save artworks you love</p>
              <Button asChild><Link href="/discover">Discover Artworks</Link></Button>
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
