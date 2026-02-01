import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import ArtworkDetail from "./pages/ArtworkDetail";
import Profile from "./pages/Profile";
import MyProfile from "./pages/MyProfile";
import CreateListing from "./pages/CreateListing";
import EditListing from "./pages/EditListing";
import MyListings from "./pages/MyListings";
import Favorites from "./pages/Favorites";
import Checkout from "./pages/Checkout";
import Transactions from "./pages/Transactions";
import TransactionDetail from "./pages/TransactionDetail";
import ARPreview from "./pages/ARPreview";
import AdminDashboard from "./pages/AdminDashboard";
import AIFeatures from "./pages/AIFeatures";
import DevSeed from "./pages/DevSeed";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/discover" component={Discover} />
      <Route path="/artwork/:id" component={ArtworkDetail} />
      <Route path="/profile/:id" component={Profile} />
      <Route path="/ar-preview/:id" component={ARPreview} />
      <Route path="/ai-features" component={AIFeatures} />
      
      {/* Protected Routes */}
      <Route path="/my-profile" component={MyProfile} />
      <Route path="/create-listing" component={CreateListing} />
      <Route path="/edit-listing/:id" component={EditListing} />
      <Route path="/my-listings" component={MyListings} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/checkout/:artworkId" component={Checkout} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/transaction/:id" component={TransactionDetail} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboard} />
      
      {/* Development Routes */}
      <Route path="/dev/seed" component={DevSeed} />
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
