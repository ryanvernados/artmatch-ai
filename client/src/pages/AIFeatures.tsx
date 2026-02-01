import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import ArtworkCard from "@/components/ArtworkCard";
import { Link } from "wouter";
import { Loader2, Brain, Sparkles, Heart, Palette, BookOpen, TrendingUp, Smile, Frown, Sun, Moon, Compass, Flame } from "lucide-react";
import { Streamdown } from "streamdown";

const MOODS = [
  { value: 'calm', label: 'Calm & Peaceful', icon: Moon, color: 'bg-blue-500/10 text-blue-700' },
  { value: 'energetic', label: 'Energetic & Bold', icon: Flame, color: 'bg-orange-500/10 text-orange-700' },
  { value: 'contemplative', label: 'Contemplative', icon: Brain, color: 'bg-purple-500/10 text-purple-700' },
  { value: 'joyful', label: 'Joyful & Uplifting', icon: Sun, color: 'bg-yellow-500/10 text-yellow-700' },
  { value: 'melancholic', label: 'Melancholic', icon: Frown, color: 'bg-gray-500/10 text-gray-700' },
  { value: 'inspired', label: 'Inspired & Creative', icon: Sparkles, color: 'bg-pink-500/10 text-pink-700' },
  { value: 'romantic', label: 'Romantic', icon: Heart, color: 'bg-red-500/10 text-red-700' },
  { value: 'adventurous', label: 'Adventurous', icon: Compass, color: 'bg-green-500/10 text-green-700' }
] as const;

export default function AIFeatures() {
  const [selectedMood, setSelectedMood] = useState<typeof MOODS[number]['value']>('calm');
  
  const { data: moodData, isLoading: moodLoading } = trpc.ai.getMoodRecommendations.useQuery(
    { mood: selectedMood, limit: 8 },
    { enabled: !!selectedMood }
  );

  const { data: artworks } = trpc.artwork.list.useQuery({ limit: 6 });

  return (
    <DashboardLayout>
      <main className="flex-1 py-8">
        <div className="container">
          {/* Hero */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary"><Brain className="h-3 w-3 mr-1" />AI-Powered Features</Badge>
            <h1 className="text-4xl font-serif font-bold mb-4">Experience Art with AI</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover art through the lens of artificial intelligence. Get personalized recommendations, 
              expert critiques, and explore new perspectives on every artwork.
            </p>
          </div>

          <Tabs defaultValue="mood" className="space-y-8">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4">
              <TabsTrigger value="mood" className="gap-2"><Heart className="h-4 w-4" />Mood Match</TabsTrigger>
              <TabsTrigger value="critic" className="gap-2"><BookOpen className="h-4 w-4" />AI Critic</TabsTrigger>
              <TabsTrigger value="style" className="gap-2"><Palette className="h-4 w-4" />Style Lab</TabsTrigger>
              <TabsTrigger value="tour" className="gap-2"><Compass className="h-4 w-4" />Gallery Tour</TabsTrigger>
            </TabsList>

            {/* Mood-Based Recommendations */}
            <TabsContent value="mood" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>How are you feeling today?</CardTitle>
                  <CardDescription>Select your current mood and we'll recommend art that resonates with you</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {MOODS.map((mood) => (
                      <button
                        key={mood.value}
                        onClick={() => setSelectedMood(mood.value)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedMood === mood.value 
                            ? 'border-primary bg-primary/5' 
                            : 'border-transparent bg-muted/50 hover:bg-muted'
                        }`}
                      >
                        <mood.icon className={`h-6 w-6 mx-auto mb-2 ${selectedMood === mood.value ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium">{mood.label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {moodLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : moodData?.recommendations && moodData.recommendations.length > 0 ? (
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    Art for your <span className="text-primary">{selectedMood}</span> mood
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {moodData.recommendations.map((artwork) => (
                      <ArtworkCard key={artwork.id} artwork={artwork} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No artworks found for this mood. Try another!
                </div>
              )}
            </TabsContent>

            {/* AI Art Critic */}
            <TabsContent value="critic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Art Critic</CardTitle>
                  <CardDescription>Get expert-level analysis of any artwork from our AI critic</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Select an artwork to receive detailed analysis including professional critique, 
                    historical context, technical assessment, emotional impact, and investment potential.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {artworks?.slice(0, 6).map((artwork) => (
                      <Link key={artwork.id} href={`/artwork/${artwork.id}?tab=analysis`}>
                        <div className="group cursor-pointer">
                          <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                            <img src={artwork.primaryImageUrl} alt={artwork.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          </div>
                          <p className="text-sm font-medium truncate">{artwork.title}</p>
                          <p className="text-xs text-muted-foreground">{artwork.artistName}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <BookOpen className="h-10 w-10 text-primary mb-4" />
                    <h3 className="font-semibold mb-2">Professional Critique</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive detailed analysis of composition, technique, and artistic merit from our AI art critic.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <TrendingUp className="h-10 w-10 text-green-600 mb-4" />
                    <h3 className="font-semibold mb-2">Investment Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Get insights on market potential, artist trajectory, and long-term value assessment.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Style Lab */}
            <TabsContent value="style" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Style Transfer Lab</CardTitle>
                  <CardDescription>Imagine artworks reimagined in different artistic styles</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Ever wondered what a landscape would look like in Van Gogh's style? Or a portrait 
                    reimagined as Pop Art? Our AI can describe these transformations in vivid detail.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {['Van Gogh', 'Picasso', 'Monet', 'Warhol', 'Banksy', 'Klimt', 'Dali', 'Basquiat'].map((style) => (
                      <Badge key={style} variant="outline" className="cursor-pointer hover:bg-primary/10">
                        {style}
                      </Badge>
                    ))}
                  </div>
                  <Button asChild><Link href="/discover">Explore Artworks to Transform</Link></Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Comparative Analysis</CardTitle>
                  <CardDescription>See how artworks compare to famous masterpieces</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Our AI identifies influences, similarities, and unique qualities by comparing 
                    artworks to renowned pieces throughout art history.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Virtual Gallery Tour */}
            <TabsContent value="tour" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI-Guided Gallery Tours</CardTitle>
                  <CardDescription>Experience personalized virtual tours with AI narration</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Create your own curated collection and let our AI guide you through a personalized 
                    tour with engaging narratives, fun facts, and insightful connections between artworks.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-6 text-center">
                    <Compass className="h-12 w-12 mx-auto text-primary mb-4" />
                    <h3 className="font-semibold mb-2">Start Your Tour</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add artworks to your favorites, then generate a personalized tour
                    </p>
                    <Button asChild><Link href="/favorites">View My Collection</Link></Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">5-30</div>
                    <div className="text-sm text-muted-foreground">Minutes per tour</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">∞</div>
                    <div className="text-sm text-muted-foreground">Unique narratives</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">AI</div>
                    <div className="text-sm text-muted-foreground">Expert guide</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </DashboardLayout>
  );
}
