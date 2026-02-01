import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { Loader2, Receipt, ArrowRight } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Transactions() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { data: buyerTx, isLoading: buyerLoading } = trpc.transaction.getMyTransactions.useQuery({ role: 'buyer' }, { enabled: isAuthenticated });
  const { data: sellerTx, isLoading: sellerLoading } = trpc.transaction.getMyTransactions.useQuery({ role: 'seller' }, { enabled: isAuthenticated });
  const transactions = [...(buyerTx || []).map(t => ({ ...t, role: 'buyer' as const })), ...(sellerTx || []).map(t => ({ ...t, role: 'seller' as const }))];
  const isLoading = buyerLoading || sellerLoading;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) window.location.href = getLoginUrl();
  }, [authLoading, isAuthenticated]);

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex flex-col"><Navbar /><div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>;
  }

  const formatPrice = (price: string | number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(typeof price === 'string' ? parseFloat(price) : price);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-700';
      case 'pending': case 'payment_pending': return 'bg-amber-500/10 text-amber-700';
      case 'shipped': return 'bg-blue-500/10 text-blue-700';
      case 'cancelled': case 'refunded': return 'bg-red-500/10 text-red-700';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container">
          <div className="mb-8"><h1 className="text-3xl font-serif font-bold">My Transactions</h1><p className="text-muted-foreground mt-1">Track your purchases and sales</p></div>
          {transactions && transactions.length > 0 ? (
            <div className="grid gap-4">
              {transactions.map((tx) => (
                <Card key={tx.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img src={tx.artwork?.primaryImageUrl || '/placeholder.jpg'} alt={tx.artwork?.title || 'Artwork'} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold truncate">{tx.artwork?.title || 'Artwork'}</h3>
                            <p className="text-sm text-muted-foreground">{tx.role === 'buyer' ? 'Purchased' : 'Sold'} • {new Date(tx.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Badge className={getStatusColor(tx.status || 'pending')}>{(tx.status || 'pending').replace('_', ' ')}</Badge>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-semibold">{formatPrice(tx.amount)}</span>
                          <Button size="sm" variant="ghost" asChild><Link href={`/transaction/${tx.id}`}>Details<ArrowRight className="h-3 w-3 ml-1" /></Link></Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/30 rounded-xl">
              <Receipt className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No transactions yet</h3>
              <p className="text-muted-foreground mb-6">Your purchase and sale history will appear here</p>
              <Button asChild><Link href="/discover">Discover Artworks</Link></Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
