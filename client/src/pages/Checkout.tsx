import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { TrustScore } from "@/components/TrustBadge";
import { useParams, useLocation, Link } from "wouter";
import { Loader2, ShieldCheck, Lock, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const artworkId = parseInt(id || '0');
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);

  const { data, isLoading } = trpc.artwork.getById.useQuery({ id: artworkId }, { enabled: artworkId > 0 });
  const createTransaction = trpc.transaction.create.useMutation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) window.location.href = getLoginUrl();
  }, [authLoading, isAuthenticated]);

  const formatPrice = (price: string | number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(typeof price === 'string' ? parseFloat(price) : price);

  const handleCheckout = async () => {
    if (!data?.artwork) return;
    setProcessing(true);
    try {
      const result = await createTransaction.mutateAsync({
        artworkId,
        shippingAddress: {
          name: user?.name || 'Customer',
          street: '123 Demo Street',
          city: 'Demo City',
          state: 'DC',
          postalCode: '12345',
          country: 'USA'
        }
      });
      setCompleted(true);
      toast.success("Purchase successful!");
    } catch (error: any) {
      toast.error(error.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex flex-col"><Navbar /><div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>;
  }

  if (!data?.artwork || data.artwork.status !== 'active') {
    return <div className="min-h-screen flex flex-col"><Navbar /><div className="flex-1 flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-semibold mb-2">Artwork not available</h2><Button asChild><Link href="/discover">Browse Artworks</Link></Button></div></div></div>;
  }

  if (completed) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="text-center max-w-md">
            <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">Purchase Complete!</h1>
            <p className="text-muted-foreground mb-6">Your purchase of "{data.artwork.title}" has been confirmed. The seller will be notified and you'll receive shipping details soon.</p>
            <div className="flex gap-4 justify-center">
              <Button asChild><Link href="/transactions">View Transaction</Link></Button>
              <Button variant="outline" asChild><Link href="/discover">Continue Browsing</Link></Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { artwork, seller } = data;
  const platformFee = parseFloat(artwork.price.toString()) * 0.05;
  const total = parseFloat(artwork.price.toString()) + platformFee;
  const confidenceScore = artwork.aiConfidenceScore ? parseFloat(artwork.aiConfidenceScore.toString()) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container max-w-4xl">
          <Button variant="ghost" size="sm" asChild className="mb-4 gap-2"><Link href={`/artwork/${artworkId}`}><ArrowLeft className="h-4 w-4" />Back to Artwork</Link></Button>
          <h1 className="text-3xl font-serif font-bold mb-8">Secure Checkout</h1>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted"><img src={artwork.primaryImageUrl} alt={artwork.title} className="w-full h-full object-cover" /></div>
                    <div>
                      <h3 className="font-semibold">{artwork.title}</h3>
                      <p className="text-sm text-muted-foreground">{artwork.artistName}</p>
                      {artwork.verificationStatus === 'verified' && <div className="flex items-center gap-1 text-green-600 text-sm mt-1"><ShieldCheck className="h-3 w-3" />Verified</div>}
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Artwork Price</span><span>{formatPrice(artwork.price)}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Platform Fee (5%)</span><span>{formatPrice(platformFee)}</span></div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold text-lg"><span>Total</span><span>{formatPrice(total)}</span></div>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Signals */}
              <Card>
                <CardHeader><CardTitle>Trust & Verification</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    {confidenceScore && <TrustScore score={confidenceScore} size="sm" />}
                    <div>
                      <p className="font-medium">AI Confidence: {confidenceScore || 'N/A'}%</p>
                      <p className="text-sm text-muted-foreground">Based on market analysis</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4 text-green-600" /><span>Seller verified with {seller?.totalSales || 0} successful sales</span></div>
                  <div className="flex items-center gap-2 text-sm"><Lock className="h-4 w-4 text-primary" /><span>Secure escrow payment protection</span></div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Payment (Mock) */}
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-4 w-4" />Payment Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-amber-500/10 rounded-lg text-sm text-amber-800">
                    <strong>Demo Mode:</strong> This is a mock payment for demonstration. No real charges will be made.
                  </div>
                  <div className="space-y-2"><Label>Card Number</Label><Input placeholder="4242 4242 4242 4242" disabled /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Expiry</Label><Input placeholder="MM/YY" disabled /></div>
                    <div className="space-y-2"><Label>CVC</Label><Input placeholder="123" disabled /></div>
                  </div>
                  <Button className="w-full" size="lg" onClick={handleCheckout} disabled={processing}>
                    {processing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing...</> : `Pay ${formatPrice(total)}`}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">Your payment is protected by our secure escrow system</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
