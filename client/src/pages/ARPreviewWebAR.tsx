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
  
  const { data, isLoading } = trpc.artwork.getById.useQuery({ id: artworkId }, { enabled: artworkId > 0 });

  useEffect(() => {
    // Load A-Frame and AR.js scripts dynamically
    const loadScripts = () => {
      // Load A-Frame first (version 1.6.0 required for AR.js 3.4.7)
      const aframeScript = document.createElement('script');
      aframeScript.src = 'https://aframe.io/releases/1.6.0/aframe.min.js';
      aframeScript.async = false;
      document.head.appendChild(aframeScript);

      // Load AR.js marker tracking after A-Frame
      aframeScript.onload = () => {
        const arjsScript = document.createElement('script');
        // Using marker-based version which is more stable and doesn't require NFT preprocessing
        arjsScript.src = 'https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js';
        arjsScript.async = false;
        document.head.appendChild(arjsScript);
        
        arjsScript.onload = () => {
          setArReady(true);
        };
      };
    };

    loadScripts();

    // Cleanup
    return () => {
      const scripts = document.querySelectorAll('script[src*="aframe"], script[src*="AR.js"]');
      scripts.forEach(script => script.remove());
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
    <div style={{ margin: 0, overflow: 'hidden', width: '100vw', height: '100vh' }}>
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
          background: 'rgba(255,255,255,0.9)', 
          backdropFilter: 'blur(8px)', 
          borderRadius: '8px', 
          padding: '1rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
            <Info style={{ width: '20px', height: '20px', color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '14px' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>How to use:</p>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', margin: 0 }}>
                <li>Point camera at a flat surface (wall, table)</li>
                <li>The artwork will appear in AR</li>
                <li>Move your phone to view from different angles</li>
                <li>Scan the <a href="https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png" target="_blank" rel="noopener" style={{ color: '#2563eb', textDecoration: 'underline' }}>HIRO marker</a> for better tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* A-Frame AR Scene */}
      <a-scene
        embedded
        arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
        vr-mode-ui="enabled: false"
        renderer="logarithmicDepthBuffer: true; precision: medium;"
      >
        {/* HIRO Marker - default AR.js marker */}
        <a-marker preset="hiro">
          {/* Artwork as a plane */}
          <a-plane
            position="0 0.5 0"
            rotation="-90 0 0"
            width="2"
            height="2.8"
            src={artwork.primaryImageUrl}
            material="transparent: true; shader: flat"
          ></a-plane>
          {/* Frame around artwork */}
          <a-box
            position="0 0.5 0"
            rotation="-90 0 0"
            width="2.1"
            height="2.9"
            depth="0.05"
            material="color: #8B4513; metalness: 0.5"
          ></a-box>
        </a-marker>

        {/* Camera */}
        <a-entity camera></a-entity>
      </a-scene>
    </div>
  );
}
