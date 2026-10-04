import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, ExternalLink, Play, AlertCircle } from 'lucide-react';

interface WebtorPlayerProps {
  magnet: string;
  dataPath?: string;
  poster?: string;
  title?: string;
  onReload?: () => void;
}

declare global {
  interface Window {
    webtor?: any;
  }
}

export const WebtorPlayer: React.FC<WebtorPlayerProps> = ({
  magnet,
  dataPath,
  poster,
  title
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [playerId] = useState(() => `webtor-embed-${Math.random().toString(36).substring(2, 9)}`);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const container = containerRef.current;
    if (!container) return;

    // Reset container and create target player element
    container.innerHTML = '';
    const playerTarget = document.createElement('div');
    playerTarget.id = playerId;
    playerTarget.style.width = '100%';
    playerTarget.style.height = '100%';
    playerTarget.style.position = 'absolute';
    playerTarget.style.inset = '0';
    container.appendChild(playerTarget);

    const initWebtor = () => {
      if (isCancelled) return;
      try {
        window.webtor = window.webtor || [];
        window.webtor.push({
          id: playerId,
          magnet: magnet,
          path: dataPath || undefined,
          width: '100%',
          height: '100%',
          poster: poster || undefined,
          title: title || undefined,
          header: true,
          features: {
            continue: false,
          },
          on: function(e: any) {
            if (isCancelled) return;
            if (e.name === window.webtor?.TORRENT_FETCHED || e.name === window.webtor?.OPENED) {
              setIsInitializing(false);
            }
          }
        });

        // Hide loader after a short timeout so user sees the initialized Webtor player interface
        setTimeout(() => {
          if (!isCancelled) setIsInitializing(false);
        }, 1500);
      } catch (err) {
        console.warn('Webtor init error:', err);
        if (!isCancelled) setHasError(true);
      }
    };

    // Load @webtor/embed-sdk-js in main window if not already present
    const existingScript = document.getElementById('webtor-sdk-script');
    if (!window.webtor && !existingScript) {
      const script = document.createElement('script');
      script.id = 'webtor-sdk-script';
      script.src = 'https://cdn.jsdelivr.net/npm/@webtor/embed-sdk-js/dist/index.min.js';
      script.charset = 'utf-8';
      script.async = true;
      script.onload = () => {
        initWebtor();
      };
      script.onerror = () => {
        if (!isCancelled) setHasError(true);
      };
      document.body.appendChild(script);
    } else if (existingScript && !window.webtor) {
      existingScript.addEventListener('load', initWebtor);
    } else {
      initWebtor();
    }

    return () => {
      isCancelled = true;
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [magnet, dataPath, poster, title, playerId]);

  // Direct webtor web link that always works on any mobile browser without CSRF or cookie issues
  const webPlayerUrl = `https://webtor.io/#/show?magnet=${encodeURIComponent(magnet)}`;

  return (
    <div className="w-full h-full relative bg-black overflow-hidden flex items-center justify-center">
      {/* Target DOM Element for Webtor SDK Player */}
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0 [&_iframe]:!w-full [&_iframe]:!h-full [&_iframe]:!max-w-full [&_iframe]:!max-h-full [&_iframe]:!absolute [&_iframe]:!inset-0 [&_iframe]:!border-0"
      />

      {/* Loading Indicator */}
      {isInitializing && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs pointer-events-none z-10 space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span className="text-xs text-emerald-400 font-semibold">Connecting to Stream...</span>
        </div>
      )}

      {/* Error Fallback with 1-click Mobile Direct Player */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-neutral-950 z-20 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-400" />
          <div>
            <p className="text-sm font-bold text-white">Live Stream Notice</p>
            <p className="text-xs text-neutral-400 max-w-sm mt-1">
              Mobile browsers with strict cookie protection can stream directly via the dedicated player tab.
            </p>
          </div>
          <a
            href={webPlayerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-colors flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>Open Direct Stream</span>
          </a>
        </div>
      )}
    </div>
  );
};
