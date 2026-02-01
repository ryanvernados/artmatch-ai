import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { useParams, Link } from "wouter";
import { Loader2, ArrowLeft, Camera, RotateCcw, ZoomIn, ZoomOut, Move, Download, X } from "lucide-react";
import { toast } from "sonner";

export default function ARPreview() {
  const { id } = useParams<{ id: string }>();
  const artworkId = parseInt(id || '0');
  
  const { data, isLoading } = trpc.artwork.getById.useQuery({ id: artworkId }, { enabled: artworkId > 0 });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [artworkPosition, setArtworkPosition] = useState({ x: 50, y: 50 });
  const [artworkScale, setArtworkScale] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setCameraError(null);
      }
    } catch (err) {
      setCameraError("Unable to access camera. Please grant camera permissions.");
      toast.error("Camera access denied");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureImage = () => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setArtworkPosition({ x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    setArtworkPosition({ x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) });
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex flex-col"><Navbar /><div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>;
  }

  if (!data?.artwork) {
    return <div className="min-h-screen flex flex-col"><Navbar /><div className="flex-1 flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-semibold mb-2">Artwork not found</h2><Button asChild><Link href="/discover">Browse Artworks</Link></Button></div></div></div>;
  }

  const { artwork } = data;

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <div className="container py-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="text-white gap-2"><Link href={`/artwork/${artworkId}`}><ArrowLeft className="h-4 w-4" />Back</Link></Button>
        <h1 className="text-white font-semibold">AR Preview</h1>
        <div className="w-20" />
      </div>

      {/* Captured Image View */}
      {capturedImage && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="p-4 flex justify-between items-center">
            <Button variant="ghost" size="sm" className="text-white" onClick={() => setCapturedImage(null)}><X className="h-5 w-5" /></Button>
            <Button variant="secondary" onClick={downloadImage}><Download className="h-4 w-4 mr-2" />Save</Button>
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
              
              {cameraError ? (
                <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mb-4">{cameraError}</div>
              ) : null}
              
              <Button size="lg" onClick={startCamera} className="gap-2">
                <Camera className="h-5 w-5" />
                Start Camera
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
              className="absolute inset-0 cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onTouchMove={handleTouchMove}
            >
              <div
                className="absolute transition-transform duration-75"
                style={{
                  left: `${artworkPosition.x}%`,
                  top: `${artworkPosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${artworkScale}%`
                }}
              >
                <div className="relative shadow-2xl">
                  <img 
                    src={artwork.primaryImageUrl} 
                    alt={artwork.title}
                    className="w-full h-auto rounded-sm"
                    style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                    draggable={false}
                  />
                  {/* Frame effect */}
                  <div className="absolute inset-0 border-4 border-white/20 rounded-sm pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <Card className="bg-black/60 border-white/10">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <ZoomOut className="h-4 w-4 text-white" />
                    <Slider
                      value={[artworkScale]}
                      onValueChange={([v]) => setArtworkScale(v)}
                      min={10}
                      max={80}
                      step={1}
                      className="flex-1"
                    />
                    <ZoomIn className="h-4 w-4 text-white" />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setArtworkPosition({ x: 50, y: 50 })}>
                      <RotateCcw className="h-4 w-4 mr-2" />Reset
                    </Button>
                    <Button className="flex-1" onClick={captureImage}>
                      <Camera className="h-4 w-4 mr-2" />Capture
                    </Button>
                    <Button variant="destructive" onClick={stopCamera}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-center text-xs text-gray-400">
                    <Move className="h-3 w-3 inline mr-1" />Drag to position • Slider to resize
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
