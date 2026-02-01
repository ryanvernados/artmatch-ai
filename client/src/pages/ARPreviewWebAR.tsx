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
    // Load A-Frame script dynamically
    const loadScripts = () => {
      // Load A-Frame only - no AR.js needed for simple camera view
      const aframeScript = document.createElement('script');
      aframeScript.src = 'https://aframe.io/releases/1.6.0/aframe.min.js';
      aframeScript.async = false;
      document.head.appendChild(aframeScript);

      aframeScript.onload = () => {
        setArReady(true);
      };
    };

    loadScripts();

    // Cleanup
    return () => {
      const scripts = document.querySelectorAll('script[src*="aframe"]');
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
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>AR Preview</p>
              <p style={{ margin: 0, color: '#4b5563' }}>
                Move your device around to see how the artwork would look in your space
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* A-Frame Scene with Camera Background */}
      <a-scene
        embedded
        vr-mode-ui="enabled: false"
        renderer="logarithmicDepthBuffer: true; precision: medium;"
        device-orientation-permission-ui="enabled: false"
      >
        {/* Camera with webcam background */}
        <a-camera position="0 1.6 0" look-controls="enabled: true">
          {/* Webcam video as background */}
          <a-entity
            geometry="primitive: plane; width: 2; height: 2"
            material="shader: flat; src: #webcam; opacity: 0.99"
            position="0 0 -1"
          ></a-entity>
        </a-camera>

        {/* Artwork positioned in front of camera */}
        <a-plane
          position="0 1.6 -3"
          width="1.5"
          height="2.1"
          src={artwork.primaryImageUrl}
          material="transparent: true; shader: flat; side: double"
        ></a-plane>

        {/* Frame around artwork */}
        <a-box
          position="0 1.6 -3.05"
          width="1.6"
          height="2.2"
          depth="0.1"
          material="color: #8B4513; metalness: 0.5; roughness: 0.7"
        ></a-box>

        {/* Ambient lighting */}
        <a-light type="ambient" color="#FFF" intensity="0.8"></a-light>
        <a-light type="directional" color="#FFF" intensity="0.5" position="1 2 1"></a-light>

        {/* Hidden video element for webcam */}
        <a-assets>
          <video 
            id="webcam" 
            autoplay 
            playsinline 
            style={{ display: 'none' }}
          ></video>
        </a-assets>
      </a-scene>

      {/* Initialize webcam */}
      <script dangerouslySetInnerHTML={{__html: `
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
            .then(function(stream) {
              const video = document.querySelector('#webcam');
              if (video) {
                video.srcObject = stream;
              }
            })
            .catch(function(err) {
              console.error('Camera access error:', err);
            });
        }
      `}} />
    </div>
  );
}
