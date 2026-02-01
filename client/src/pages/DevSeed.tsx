import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Loader2, Database, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function DevSeed() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const seedMutation = trpc.admin.seedDatabase.useMutation({
    onSuccess: (data) => {
      setResult({ success: true, message: data.message || "Database seeded successfully!" });
      toast.success("Database seeded successfully!");
    },
    onError: (error) => {
      setResult({ success: false, message: error.message });
      toast.error(`Seed failed: ${error.message}`);
    },
    onSettled: () => {
      setIsSeeding(false);
    }
  });

  const handleSeed = () => {
    setIsSeeding(true);
    setResult(null);
    seedMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-6 w-6" />
                Development Seed Tool
              </CardTitle>
              <CardDescription>
                Populate the database with sample artworks, users, and related data for testing purposes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium mb-1">Development Only</p>
                    <p>This tool is intended for development and testing purposes. It will create sample users and artworks in the database.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Seed Data Includes:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>3 sample seller accounts (Elena Martinez, James Chen, Sophie Laurent)</li>
                  <li>12 sample artworks with various styles and mediums</li>
                  <li>Provenance history for verified artworks</li>
                  <li>Sample images from Unsplash</li>
                </ul>
              </div>

              <Button 
                onClick={handleSeed} 
                disabled={isSeeding}
                className="w-full"
                size="lg"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Seeding Database...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Seed Database
                  </>
                )}
              </Button>

              {result && (
                <div className={`rounded-lg p-4 ${
                  result.success 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className={`text-sm ${
                      result.success 
                        ? 'text-green-800 dark:text-green-200' 
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                      <p className="font-medium mb-1">
                        {result.success ? 'Success' : 'Error'}
                      </p>
                      <p>{result.message}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
