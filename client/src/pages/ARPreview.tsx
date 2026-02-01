import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { useParams, Link } from "wouter";
import { Loader2, ArrowLeft, Camera, RotateCcw, ZoomIn, ZoomOut, Move, Download, X, AlertCircle, HelpCircle } from "lucide-react";
import { toast } from "sonner";

export default function ARPreview() {
  const { id } = useParams<{ id: string }>();
  const artworkId = parseInt(id || '0');
  
  const { data, isLoading } = trpc.artwork.getById.useQuery({ id: artworkId }, { enabled: artworkId > 0 });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [artworkPosition, setArtworkPosition] = useState({ x: 50, y: 50 });
  const [artworkScale, setArtworkScale] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Check if camera is supported
  const isCameraSupported = typeof navigator !== 'undefined' && 
    navigator.mediaDevices && 
    typeof navigator.mediaDevices.getUserMedia === 'function';

  // Check if we're on HTTPS (required for camera access)
  const isSecureContext = typeof window !== 'undefined' && 
    (window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost');

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraLoading(false);
  }, []);

  const startCamera = async () => {
    // Pre-flight checks
    if (!isCameraSupported) {
      setCameraError("Camera API is not supported in this browser. Please try a modern browser like Chrome, Firefox, or Safari.");
      toast.error("Camera not supported");
      setShowTroubleshooting(true);
      return;
    }

    if (!isSecureContext) {
      setCameraError("Camera access requires a secure connection (HTTPS). Please access this page via HTTPS.");
      toast.error("Secure connection required");
      setShowTroubleshooting(true);
      return;
    }

    setCameraLoading(true);
    setCameraError(null);
    setShowTroubleshooting(false);

    // Check if we can enumerate devices first
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log(`Found ${videoDevices.length} video devices`);
      
      if (videoDevices.length === 0) {
        setCameraError("No camera detected on your device.");
        setCameraLoading(false);
        toast.error("No camera found");
        setShowTroubleshooting(true);
        return;
      }
    } catch (enumError) {
      console.warn("Could not enumerate devices:", enumError);
      // Continue anyway, getUserMedia might still work
    }

    try {
      // First, try to get the back camera (environment facing)
      let stream: MediaStream;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 }, 
            height: { ideal: 720 } 
          },
          audio: false
        });
      } catch (envError) {
        // If back camera fails, try any camera
        console.log("Back camera not available, trying any camera...");
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 } 
          },
          audio: false
        });
      }

      // Store the stream reference for cleanup
      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        
        // Wait for video to be ready - set up listeners BEFORE setting srcObject
        const videoReadyPromise = new Promise<void>((resolve, reject) => {
          const handleLoadedMetadata = () => {
            console.log("Video metadata loaded");
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            resolve();
          };
          
          const handleError = (e: Event) => {
            console.error("Video error event:", e);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            reject(new Error("Video failed to load"));
          };
          
          video.addEventListener('loadedmetadata', handleLoadedMetadata);
          video.addEventListener('error', handleError);
          
          // Check if video is already ready (handles race condition)
          if (video.readyState >= 1) {
            console.log("Video already ready");
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            resolve();
            return;
          }
          
          // Timeout after 10 seconds
          setTimeout(() => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            reject(new Error("Camera initialization timeout"));
          }, 10000);
        });

        // Now set the stream
        video.srcObject = stream;
        
        // Wait for video to be ready
        await videoReadyPromise;

        // Try to play the video
        try {
          await video.play();
          console.log("Video playing successfully");
        } catch (playError) {
          console.warn("Autoplay failed, user interaction may be required:", playError);
          // Video might still work with user interaction
        }

        setCameraActive(true);
        setCameraError(null);
        toast.success("Camera started successfully");
      }
    } catch (err: unknown) {
      console.error("Camera error:", err);
      
      // Clean up any partial stream
      stopCamera();
      
      // Provide specific error messages
      let errorMessage = "Unable to access camera.";
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = "Camera permission denied.";
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = "No camera found.";
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage = "Camera is in use by another application.";
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = "Camera doesn't support the required settings.";
        } else if (err.name === 'SecurityError') {
          errorMessage = "Camera access blocked due to security restrictions.";
        } else if (err.message) {
          errorMessage = err.message;
        }
      }
      
      setCameraError(errorMessage);
      setShowTroubleshooting(true);
      toast.error("Camera access failed");
    } finally {
      setCameraLoading(false);
    }
  };

  const captureImage = () => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check if video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error("Video not ready. Please wait a moment and try again.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Draw artwork overlay
    if (data?.artwork) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const scale = artworkScale / 100;
        const width = canvas.width * scale;
        const height = (width / img.width) * img.height;
        const x = (artworkPosition.x / 100) * canvas.width - width / 2;
        const y = (artworkPosition.y / 100) * canvas.height - height / 2;
        
        // Add shadow
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        ctx.drawImage(img, x, y, width, height);
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));
        toast.success("Image captured!");
      };
      img.onerror = () => {
        toast.error("Failed to load artwork image for capture");
      };
      img.src = data.artwork.primaryImageUrl;
    }
  };

  const downloadImage = () => {
    if (!capturedImage) return;
    const link = document.createElement('a');
    link.download = `artmatch-ar-preview-${artworkId}.jpg`;
    link.href = capturedImage;
    link.click();
    toast.success("Image saved!");
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setArtworkPosition({ x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    setArtworkPosition({ x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!data?.artwork) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Artwork not found</h2>
            <Button asChild>
              <Link href="/discover">Browse Artworks</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { artwork } = data;

  const TroubleshootingGuide = () => (
    <Card className="mt-4 bg-blue-50 border-blue-200">
      <CardContent className="p-4 space-y-3 text-sm">
        <div className="flex items-start gap-2">
          <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Troubleshooting Camera Issues</h4>
            
            <div className="space-y-2 text-blue-800">
              <div>
                <p className="font-medium">If camera permission was denied:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Click the camera/lock icon in your browser's address bar</li>
                  <li>Select "Allow" for camera access</li>
                  <li>Refresh the page and try again</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium">On mobile devices:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Go to Settings → Browser App → Permissions</li>
                  <li>Enable Camera permission</li>
                  <li>Return to this page and try again</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium">If no camera is detected:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Ensure your device has a working camera</li>
                  <li>Close other apps that might be using the camera</li>
                  <li>Try a different browser (Chrome, Firefox, Safari)</li>
                  <li>Check if camera works in other apps first</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <div className="container py-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="text-white gap-2">
          <Link href={`/artwork/${artworkId}`}>
            <ArrowLeft className="h-4 w-4" />Back
          </Link>
        </Button>
        <h1 className="text-white font-semibold">AR Preview</h1>
        <div className="w-20" />
      </div>

      {/* Captured Image View */}
      {capturedImage && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="p-4 flex justify-between items-center">
            <Button variant="ghost" size="sm" className="text-white" onClick={() => setCapturedImage(null)}>
              <X className="h-5 w-5" />
            </Button>
            <Button variant="secondary" onClick={downloadImage}>
              <Download className="h-4 w-4 mr-2" />Save
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={capturedImage} alt="Captured" className="max-w-full max-h-full object-contain rounded-lg" />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {!cameraActive ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="max-w-md text-center">
              <div className="w-32 h-32 rounded-2xl overflow-hidden mx-auto mb-6 shadow-2xl">
                <img src={artwork.primaryImageUrl} alt={artwork.title} className="w-full h-full object-cover" />
              </div>
              <h2 className="text-white text-xl font-semibold mb-2">{artwork.title}</h2>
              <p className="text-gray-400 mb-6">See how this artwork looks in your space using your camera</p>
              
              {cameraError && (
                <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mb-4 flex items-start gap-3 text-left">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">{cameraError}</p>
                    <button 
                      onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                      className="text-sm underline hover:no-underline"
                    >
                      {showTroubleshooting ? 'Hide' : 'Show'} troubleshooting steps
                    </button>
                  </div>
                </div>
              )}

              {showTroubleshooting && <TroubleshootingGuide />}

              {!isCameraSupported && (
                <div className="bg-yellow-500/20 text-yellow-300 p-4 rounded-lg mb-4 text-sm">
                  Your browser doesn't support camera access. Please try using Chrome, Firefox, or Safari.
                </div>
              )}

              {!isSecureContext && (
                <div className="bg-yellow-500/20 text-yellow-300 p-4 rounded-lg mb-4 text-sm">
                  Camera access requires a secure connection (HTTPS).
                </div>
              )}
              
              <Button 
                size="lg" 
                onClick={startCamera} 
                className="gap-2"
                disabled={cameraLoading || !isCameraSupported || !isSecureContext}
              >
                {cameraLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Starting Camera...
                  </>
                ) : (
                  <>
                    <Camera className="h-5 w-5" />
                    Start Camera
                  </>
                )}
              </Button>
              
              <p className="text-gray-500 text-sm mt-4">
                Point your camera at a wall and position the artwork
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 relative">
            {/* Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Artwork Overlay */}
            <div 
              className="absolute inset-0 cursor-move touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${artworkPosition.x}%`,
                  top: `${artworkPosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${artworkScale}%`,
                }}
              >
                <img 
                  src={artwork.primaryImageUrl} 
                  alt={artwork.title}
                  className="w-full h-auto shadow-2xl"
                  style={{
                    filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))'
                  }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="max-w-md mx-auto space-y-4">
                <div className="flex items-center gap-4 text-white">
                  <ZoomOut className="h-5 w-5 flex-shrink-0" />
                  <Slider
                    value={[artworkScale]}
                    onValueChange={([value]) => setArtworkScale(value)}
                    min={10}
                    max={80}
                    step={1}
                    className="flex-1"
                  />
                  <ZoomIn className="h-5 w-5 flex-shrink-0" />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => {
                      setArtworkPosition({ x: 50, y: 50 });
                      setArtworkScale(30);
                    }}
                    className="flex-1 gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                  <Button
                    size="lg"
                    onClick={captureImage}
                    className="flex-1 gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Capture
                  </Button>
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={stopCamera}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
