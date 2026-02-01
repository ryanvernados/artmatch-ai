import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useParams, useLocation, Link } from "wouter";
import { Loader2, Save, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

const STYLES = ["Contemporary", "Abstract", "Impressionist", "Modern", "Classical", "Minimalist", "Pop Art", "Surrealist", "Expressionist", "Realist"];
const MEDIUMS = ["Oil Painting", "Acrylic", "Watercolor", "Digital Art", "Photography", "Sculpture", "Mixed Media", "Print", "Drawing", "Collage"];

export default function EditListing() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const artworkId = parseInt(id || '0');

  const { data, isLoading } = trpc.artwork.getById.useQuery(
    { id: artworkId },
    { enabled: artworkId > 0 }
  );

  const [formData, setFormData] = useState({
    title: '', description: '', artistName: '', medium: '', style: '',
    dimensions: '', yearCreated: '', price: '', status: 'draft' as 'draft' | 'active' | 'archived'
  });

  const updateArtwork = trpc.artwork.update.useMutation({
    onSuccess: () => {
      toast.success("Listing updated successfully");
      navigate(`/artwork/${artworkId}`);
    },
    onError: (error) => toast.error(error.message)
  });

  const deleteArtwork = trpc.artwork.delete.useMutation({
    onSuccess: () => {
      toast.success("Listing deleted");
      navigate('/my-listings');
    },
    onError: (error) => toast.error(error.message)
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (data?.artwork) {
      const a = data.artwork;
      setFormData({
        title: a.title, description: a.description || '', artistName: a.artistName,
        medium: a.medium || '', style: a.style || '', dimensions: a.dimensions || '',
        yearCreated: a.yearCreated?.toString() || '', price: a.price?.toString() || '',
        status: a.status as any || 'draft'
      });
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateArtwork.mutateAsync({
      id: artworkId, ...formData,
      yearCreated: formData.yearCreated ? parseInt(formData.yearCreated) : undefined,
      price: parseFloat(formData.price)
    });
  };

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex flex-col"><Navbar /><div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>;
  }

  if (!data?.artwork || (user?.id !== data.artwork.sellerId && user?.role !== 'admin')) {
    return <div className="min-h-screen flex flex-col"><Navbar /><div className="flex-1 flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-semibold mb-2">Not authorized</h2><Button asChild><Link href="/my-listings">My Listings</Link></Button></div></div></div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container max-w-2xl">
          <Button variant="ghost" size="sm" asChild className="mb-4 gap-2"><Link href="/my-listings"><ArrowLeft className="h-4 w-4" />Back to My Listings</Link></Button>
          <h1 className="text-3xl font-serif font-bold mb-8">Edit Listing</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Artwork Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Artist Name</Label><Input value={formData.artistName} onChange={(e) => setFormData({ ...formData, artistName: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Style</Label><Select value={formData.style} onValueChange={(v) => setFormData({ ...formData, style: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{STYLES.map(s => <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Medium</Label><Select value={formData.medium} onValueChange={(v) => setFormData({ ...formData, medium: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{MEDIUMS.map(m => <SelectItem key={m} value={m.toLowerCase()}>{m}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Dimensions</Label><Input value={formData.dimensions} onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Year</Label><Input type="number" value={formData.yearCreated} onChange={(e) => setFormData({ ...formData, yearCreated: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Price (USD)</Label><Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></div>
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-4">
              <Button type="submit" disabled={updateArtwork.isPending} className="gap-2">{updateArtwork.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save Changes</Button>
              <Button type="button" variant="destructive" onClick={() => { if (confirm('Delete this listing?')) deleteArtwork.mutate({ id: artworkId }); }} className="gap-2"><Trash2 className="h-4 w-4" />Delete</Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
