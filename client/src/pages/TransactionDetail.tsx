import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useParams, Link } from "wouter";
import { Loader2, ArrowLeft, Package, CheckCircle, Truck, Clock } from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const { loading: authLoading, isAuthenticated, user } = useAuth();
  const transactionId = parseInt(id || '0');
  
  const { data, isLoading, refetch } = trpc.transaction.getById.useQuery({ id: transactionId }, { enabled: transactionId > 0 && isAuthenticated });
  const confirmDelivery = trpc.transaction.confirmDelivery.useMutation({
    onSuccess: () => { toast.success("Delivery confirmed!"); refetch(); }
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) window.location.href = getLoginUrl();
  }, [authLoading, isAuthenticated]);

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex flex-col"><Navbar /><div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>;
  }

  if (!data) {
    return <div className="min-h-screen flex flex-col"><Navbar /><div className="flex-1 flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-semibold mb-2">Transaction not found</h2><Button asChild><Link href="/transactions">My Transactions</Link></Button></div></div></div>;
  }

  const { transaction, artwork } = data;
  const isBuyer = user?.id === transaction.buyerId;
  const formatPrice = (price: string | number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(typeof price === 'string' ? parseFloat(price) : price);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-700';
      case 'pending': case 'payment_pending': return 'bg-amber-500/10 text-amber-700';
      case 'shipped': case 'processing': return 'bg-blue-500/10 text-blue-700';
      case 'cancelled': case 'refunded': return 'bg-red-500/10 text-red-700';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const steps = [
    { key: 'pending', label: 'Order Placed', icon: Package, done: true },
    { key: 'processing', label: 'Processing', icon: Clock, done: ['processing', 'shipped', 'delivered', 'completed'].includes(transaction.status || '') },
    { key: 'shipped', label: 'Shipped', icon: Truck, done: ['shipped', 'delivered', 'completed'].includes(transaction.status || '') },
    { key: 'completed', label: 'Completed', icon: CheckCircle, done: transaction.status === 'completed' }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container max-w-3xl">
          <Button variant="ghost" size="sm" asChild className="mb-4 gap-2"><Link href="/transactions"><ArrowLeft className="h-4 w-4" />Back to Transactions</Link></Button>
          
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-serif font-bold">Transaction #{transaction.id}</h1>
            <Badge className={getStatusColor(transaction.status)}>{(transaction.status || 'pending').replace('_', ' ')}</Badge>
          </div>

          {/* Progress */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between">
                {steps.map((step, i) => (
                  <div key={step.key} className="flex flex-col items-center flex-1">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${step.done ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className={`text-xs mt-2 ${step.done ? 'font-medium' : 'text-muted-foreground'}`}>{step.label}</span>
                    {i < steps.length - 1 && <div className={`h-0.5 w-full mt-5 absolute ${step.done ? 'bg-green-500' : 'bg-muted'}`} style={{ display: 'none' }} />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Artwork */}
          <Card className="mb-6">
            <CardHeader><CardTitle>Artwork</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted">
                  <img src={artwork?.primaryImageUrl || '/placeholder.jpg'} alt={artwork?.title || 'Artwork'} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-semibold">{artwork?.title || 'Artwork'}</h3>
                  <p className="text-sm text-muted-foreground">{artwork?.artistName}</p>
                  <Button size="sm" variant="link" className="p-0 h-auto" asChild><Link href={`/artwork/${artwork?.id}`}>View Details</Link></Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card className="mb-6">
            <CardHeader><CardTitle>Payment Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span>Artwork Price</span><span>{formatPrice(transaction.amount)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Platform Fee</span><span>{formatPrice(transaction.platformFee || 0)}</span></div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold"><span>Total</span><span>{formatPrice(parseFloat(transaction.amount) + parseFloat(transaction.platformFee || '0'))}</span></div>
            </CardContent>
          </Card>

          {/* Actions */}
          {isBuyer && (transaction.status === 'processing' || transaction.deliveryStatus === 'shipped') && transaction.status !== 'completed' && (
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-4">Once you receive the artwork, confirm delivery to release payment to the seller.</p>
                <Button onClick={() => confirmDelivery.mutate({ transactionId })} disabled={confirmDelivery.isPending}>
                  {confirmDelivery.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Confirm Delivery
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
