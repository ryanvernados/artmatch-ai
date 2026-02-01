import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import ArtworkCard from "@/components/ArtworkCard";
import { 
  LayoutDashboard,
  Palette,
  Heart,
  ShoppingCart,
  TrendingUp,
  Eye,
  DollarSign,
  Plus,
  ArrowRight,
  Package,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Home,
  Search,
  Bell,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Palette, label: "My Artworks", path: "/my-listings" },
  { icon: Heart, label: "Favorites", path: "/favorites" },
  { icon: ShoppingCart, label: "Transactions", path: "/transactions" },
  { icon: Search, label: "Discover", path: "/discover" },
  { icon: Sparkles, label: "AI Features", path: "/ai-features" },
];

export default function Dashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch dashboard data
  const { data: artworks, isLoading: artworksLoading } = trpc.artwork.list.useQuery({
    status: 'active',
    limit: 12,
    orderBy: 'newest'
  });

  const { data: myListings } = trpc.artwork.getMyListings.useQuery(undefined, {
    enabled: isAuthenticated
  });

  const { data: favorites } = trpc.favorites.list.useQuery(undefined, {
    enabled: isAuthenticated
  });

  const { data: transactions } = trpc.transaction.getMyTransactions.useQuery(
    { role: 'buyer' },
    { enabled: isAuthenticated }
  );

  const toggleFavorite = trpc.favorites.add.useMutation();

  const handleFavorite = async (artworkId: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    await toggleFavorite.mutateAsync({ artworkId });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to ArtMatch AI</CardTitle>
            <CardDescription>Sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" size="lg" asChild>
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <a href="/dev-login">Dev Login (Development)</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    { 
      label: "Total Artworks", 
      value: myListings?.length || 0, 
      icon: Palette, 
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    { 
      label: "Favorites", 
      value: favorites?.length || 0, 
      icon: Heart, 
      color: "text-red-500",
      bgColor: "bg-red-100"
    },
    { 
      label: "Transactions", 
      value: transactions?.length || 0, 
      icon: ShoppingCart, 
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    { 
      label: "Total Views", 
      value: myListings?.reduce((acc, item) => acc + (item.viewCount || 0), 0) || 0, 
      icon: Eye, 
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
  ];

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r transition-all duration-300",
        sidebarOpen ? "w-64" : "w-20",
        "hidden lg:flex"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            {sidebarOpen && (
              <span className="font-serif text-xl font-semibold">ArtMatch</span>
            )}
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-3">
            {sidebarItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-11",
                    !sidebarOpen && "justify-center px-0"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Button>
              </Link>
            ))}
          </nav>
        </ScrollArea>

        {/* User Section */}
        <div className="border-t p-4">
          <div className={cn(
            "flex items-center gap-3",
            !sidebarOpen && "justify-center"
          )}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href="/my-profile">
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-background border-b flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-serif text-lg font-semibold">ArtMatch</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-background pt-16">
          <nav className="p-4 space-y-2">
            {sidebarItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            ))}
            <div className="pt-4 border-t mt-4">
              <div className="flex items-center gap-3 p-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user?.name || "User"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Button variant="destructive" className="w-full mt-2" onClick={() => logout()}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        sidebarOpen ? "lg:ml-64" : "lg:ml-20",
        "pt-16 lg:pt-0"
      )}>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold">Welcome back, {user?.name?.split(' ')[0] || 'Artist'}!</h1>
              <p className="text-muted-foreground mt-1">Here's what's happening with your art today.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/discover">
                  <Search className="h-4 w-4 mr-2" />
                  Discover
                </Link>
              </Button>
              <Button asChild>
                <Link href="/create-listing">
                  <Plus className="h-4 w-4 mr-2" />
                  List Artwork
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                      <stat.icon className={cn("h-6 w-6", stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="discover" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="discover">Discover</TabsTrigger>
              <TabsTrigger value="my-art">My Art</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* Discover Tab */}
            <TabsContent value="discover" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Latest Artworks</h2>
                  <p className="text-sm text-muted-foreground">Discover new pieces from our community</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/discover">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>

              {artworksLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-[4/5] rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : artworks && artworks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {artworks.map((artwork) => (
                    <ArtworkCard
                      key={artwork.id}
                      artwork={artwork}
                      onFavorite={handleFavorite}
                    />
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No artworks yet</h3>
                  <p className="text-muted-foreground mb-4">Be the first to list your artwork!</p>
                  <Button asChild>
                    <Link href="/create-listing">List Your Art</Link>
                  </Button>
                </Card>
              )}
            </TabsContent>

            {/* My Art Tab */}
            <TabsContent value="my-art" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">My Artworks</h2>
                  <p className="text-sm text-muted-foreground">Manage your listed artworks</p>
                </div>
                <Button asChild>
                  <Link href="/create-listing">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Link>
                </Button>
              </div>

              {myListings && myListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {myListings.map((artwork) => (
                    <ArtworkCard
                      key={artwork.id}
                      artwork={artwork}
                      onFavorite={handleFavorite}
                      showEditButton
                    />
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No artworks listed</h3>
                  <p className="text-muted-foreground mb-4">Start selling by listing your first artwork</p>
                  <Button asChild>
                    <Link href="/create-listing">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Listing
                    </Link>
                  </Button>
                </Card>
              )}
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Saved Artworks</h2>
                  <p className="text-sm text-muted-foreground">Your favorite pieces</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/favorites">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>

              {favorites && favorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {favorites.slice(0, 8).map((fav: any) => (
                    <ArtworkCard
                      key={fav.artwork.id}
                      artwork={fav.artwork}
                      onFavorite={handleFavorite}
                      isFavorited
                    />
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
                  <p className="text-muted-foreground mb-4">Start exploring and save artworks you love</p>
                  <Button asChild>
                    <Link href="/discover">Discover Artworks</Link>
                  </Button>
                </Card>
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Recent Activity</h2>
                <p className="text-sm text-muted-foreground">Your transaction history</p>
              </div>

              {transactions && transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((tx: any) => (
                    <Card key={tx.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                            {tx.artwork?.primaryImageUrl && (
                              <img 
                                src={tx.artwork.primaryImageUrl} 
                                alt={tx.artwork.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{tx.artwork?.title || 'Artwork'}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${parseFloat(tx.amount).toLocaleString()}</p>
                            <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                              {tx.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                  <p className="text-muted-foreground mb-4">Your purchase and sale history will appear here</p>
                  <Button asChild>
                    <Link href="/discover">Start Shopping</Link>
                  </Button>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/create-listing'}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium">List Artwork</h3>
                  <p className="text-sm text-muted-foreground">Sell your art</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/ai-features'}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium">AI Features</h3>
                  <p className="text-sm text-muted-foreground">Get AI insights</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/my-profile'}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <Settings className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium">Settings</h3>
                  <p className="text-sm text-muted-foreground">Edit profile</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/discover'}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mx-auto mb-3">
                    <Search className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="font-medium">Discover</h3>
                  <p className="text-sm text-muted-foreground">Browse art</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
