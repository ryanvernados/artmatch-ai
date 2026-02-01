import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/AppLayout";
import { Link, useLocation } from "wouter";
import { Loader2, Users, Package, DollarSign, ShieldCheck, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function AdminDashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery(undefined, { enabled: isAuthenticated && user?.role === 'admin' });
  const { data: pendingArtworks, isLoading: artworksLoading, refetch: refetchArtworks } = trpc.admin.getPendingVerifications.useQuery(undefined, { enabled: isAuthenticated && user?.role === 'admin' });
  
  const verifyArtwork = trpc.admin.verifyArtwork.useMutation({
    onSuccess: () => { toast.success("Artwork verified"); refetchArtworks(); }
  });
  

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    } else if (!authLoading && user?.role !== 'admin') {
      navigate('/');
      toast.error("Admin access required");
    }
  }, [authLoading, isAuthenticated, user]);

  if (authLoading || statsLoading) {
    return <AppLayout><div className="flex-1 flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;
  }

  if (user?.role !== 'admin') return null;

  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage platform operations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div>
                <div><div className="text-2xl font-bold">{stats?.users?.totalUsers || 0}</div><div className="text-xs text-muted-foreground">Total Users</div></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center"><Package className="h-5 w-5 text-accent-foreground" /></div>
                <div><div className="text-2xl font-bold">{stats?.artworks?.totalArtworks || 0}</div><div className="text-xs text-muted-foreground">Artworks</div></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-green-600" /></div>
                <div><div className="text-2xl font-bold">{formatPrice(parseFloat(stats?.transactions?.totalVolume || '0'))}</div><div className="text-xs text-muted-foreground">Total Volume</div></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><Clock className="h-5 w-5 text-amber-600" /></div>
                <div><div className="text-2xl font-bold">{pendingArtworks?.length || 0}</div><div className="text-xs text-muted-foreground">Pending</div></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="verifications">
          <TabsList>
            <TabsTrigger value="verifications" className="gap-2"><ShieldCheck className="h-4 w-4" />Pending Verifications</TabsTrigger>
          </TabsList>

          <TabsContent value="verifications" className="mt-6">
            {artworksLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : pendingArtworks && pendingArtworks.length > 0 ? (
              <div className="grid gap-4">
                {pendingArtworks.map((item: any) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img src={item.primaryImageUrl} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold">{item.title}</h3>
                              <p className="text-sm text-muted-foreground">{item.artistName}</p>
                              <p className="text-sm">{formatPrice(parseFloat(item.price))}</p>
                            </div>
                            <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" onClick={() => verifyArtwork.mutate({ artworkId: item.id, status: 'verified' })} disabled={verifyArtwork.isPending}>
                              <CheckCircle className="h-3 w-3 mr-1" />Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => verifyArtwork.mutate({ artworkId: item.id, status: 'rejected' })} disabled={verifyArtwork.isPending}>
                              <AlertCircle className="h-3 w-3 mr-1" />Reject
                            </Button>
                            <Button size="sm" variant="ghost" asChild><Link href={`/artwork/${item.id}`}>View</Link></Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-xl">
                <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground">No pending verifications</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
