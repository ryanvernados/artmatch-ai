import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useParams, Link } from "wouter";
import { Loader2, ArrowLeft, Info } from "lucide-react";

export default function ARPreviewWebAR() {
  const { id } = useParams<{ id: string }>();
  const artworkId = parseInt(id || '0');
  const [arReady, setArReady] = useState(false);
  const [scale, setScale] = useState(1);
  const [positionY, setPositionY] = useState(0);
  const [distance, setDistance] = useState(-2.5);
  
  const { data, isLoading } = trpc.artwork.getById.useQuery({ id: artworkId }, { enabled: artworkId > 0 });

  // Load A-Frame and AR.js
  useEffect(() => {
    const loadScripts = () => {
      const aframeScript = document.createElement('script');
      aframeScript.src = 'https://aframe.io/releases/1.6.0/aframe.min.js';
      aframeScript.async = false;
      document.head.appendChild(aframeScript);

      aframeScript.onload = () => {
        const arjsScript = document.createElement('script');
        arjsScript.src = 'https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js';
        arjsScript.async = false;
        document.head.appendChild(arjsScript);
        
        arjsScript.onload = () => {
          setArReady(true);
        };
      };
    };

    loadScripts();

    return () => {
      const scripts = document.querySelectorAll('script[src*="aframe"], script[src*="AR.js"]');
      scripts.forEach(script => script.remove());
    };
  }, []);

  // Camera cleanup
  useEffect(() => {
    return () => {
      const video = document.querySelector('video') as HTMLVideoElement;
      if (video?.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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

  if (!arReady) {
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading AR...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      margin: 0, 
      overflow: 'hidden', 
      width: '100vw', 
      height: '100vh', 
      position: 'fixed',
      top: 0,
      left: 0,
      touchAction: 'none',
      userSelect: 'none',
      WebkitUserSelect: 'none'
    }}>
      {/* Header */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 10, 
        background: 'rgba(0,0,0,0.5)', 
        backdropFilter: 'blur(8px)',
        padding: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href={`/artwork/${artworkId}`}>
            <button style={{ 
              color: 'white', 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '14px'
            }}>
              <ArrowLeft style={{ width: '16px', height: '16px' }} />
              Back
            </button>
          </Link>
          <h1 style={{ color: 'white', fontSize: '16px', fontWeight: 600 }}>{artwork.title}</h1>
          <div style={{ width: '60px' }} />
        </div>
      </div>

      {/* Instructions */}
      <div style={{ 
        position: 'absolute', 
        bottom: '1rem', 
        left: '1rem', 
        right: '1rem', 
        zIndex: 10,
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.95)', 
          backdropFilter: 'blur(8px)', 
          borderRadius: '8px', 
          padding: '1rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          {/* Controls */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                Size: {scale.toFixed(1)}x
              </label>
              <input 
                type="range" 
                min="0.5" 
                max="3" 
                step="0.1" 
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                Height: {positionY.toFixed(1)}m
              </label>
              <input 
                type="range" 
                min="-1" 
                max="1" 
                step="0.1" 
                value={positionY}
                onChange={(e) => setPositionY(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                Distance: {Math.abs(distance).toFixed(1)}m
              </label>
              <input 
                type="range" 
                min="-5" 
                max="-1" 
                step="0.1" 
                value={distance}
                onChange={(e) => setDistance(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <button 
              onClick={() => {
                setScale(1);
                setPositionY(0);
                setDistance(-2.5);
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reset Position
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
            <Info style={{ width: '16px', height: '16px', color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, color: '#4b5563', fontSize: '12px' }}>
              Adjust the artwork size and position to fit your space
            </p>
          </div>
        </div>
      </div>

      {/* A-Frame AR Scene - AR.js handles camera automatically */}
      <a-scene
        embedded
        arjs="sourceType: webcam; debugUIEnabled: false; trackingMethod: best; videoTexture: true;"
        vr-mode-ui="enabled: false"
        renderer="logarithmicDepthBuffer: true; precision: medium; colorManagement: true;"
        device-orientation-permission-ui="enabled: false"
        gyroscope="enabled: false"
      >
        {/* Camera - completely locked to prevent jumping */}
        <a-camera 
          position="0 0 0" 
          rotation="0 0 0"
          look-controls="enabled: false; touchEnabled: false; mouseEnabled: false" 
          wasd-controls="enabled: false"
        ></a-camera>

        {/* Frame around artwork - positioned behind */}
        <a-box
          position={`0 ${positionY} ${distance}`}
          scale={`${scale} ${scale} 1`}
          width="1.1"
          height="1.5"
          depth="0.05"
          material="color: #8B4513; metalness: 0.5; roughness: 0.7"
        ></a-box>

        {/* Artwork floating in front - always visible without markers */}
        <a-plane
          position={`0 ${positionY} ${distance + 0.01}`}
          scale={`${scale} ${scale} 1`}
          width="1"
          height="1.4"
          src={artwork.primaryImageUrl}
          material="transparent: true; shader: flat; side: double"
        ></a-plane>

        {/* Lighting */}
        <a-light type="ambient" color="#FFF" intensity="0.8"></a-light>
        <a-light type="directional" color="#FFF" intensity="0.5" position="1 2 1"></a-light>
      </a-scene>
    </div>
  );
}
