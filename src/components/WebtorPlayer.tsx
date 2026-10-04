import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, AlertCircle } from 'lucide-react';

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

  // 12-second Minimal Circular Ad Shield (0 to 100% inside circle, no skip)
  const [isAdShieldActive, setIsAdShieldActive] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const hasTriggeredShieldRef = useRef(false);
  const shieldIntervalRef = useRef<any>(null);

  const triggerAdShield = useCallback(() => {
    if (hasTriggeredShieldRef.current) return;
    hasTriggeredShieldRef.current = true;
    setIsAdShieldActive(true);
    setProgressPercent(0);

    const DURATION_MS = 12000; // Exactly 12 seconds
    const startTime = Date.now();

    if (shieldIntervalRef.current) clearInterval(shieldIntervalRef.current);

    shieldIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const current = Math.min(100, (elapsed / DURATION_MS) * 100);
      setProgressPercent(current);

      if (elapsed >= DURATION_MS) {
        if (shieldIntervalRef.current) clearInterval(shieldIntervalRef.current);
        setIsAdShieldActive(false);
      }
    }, 40);
  }, []);

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
          header: false, // Disables webtor header bar
          features: {
            continue: false,
            p2pProgress: false,
          },
          on: function(e: any) {
            if (isCancelled) return;
            const eventName = String(e?.name || '').toLowerCase();
            if (eventName.includes('play') || eventName.includes('ad') || eventName.includes('start')) {
              triggerAdShield();
            }
            if (e.name === window.webtor?.TORRENT_FETCHED || e.name === window.webtor?.OPENED) {
              setIsInitializing(false);
            }
          }
        });

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

    // 1. Detect user click inside the Webtor iframe (window blur event)
    const handleWindowBlur = () => {
      setTimeout(() => {
        const active = document.activeElement;
        if (active && (active.tagName === 'IFRAME' || active.id === playerId)) {
          triggerAdShield();
        }
      }, 50);
    };

    // 2. Detect postMessage from Webtor iframe
    const handlePostMessage = (event: MessageEvent) => {
      try {
        const raw = event.data;
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (data) {
          const evt = String(data.event || data.name || data.type || '').toLowerCase();
          if (evt.includes('play') || evt.includes('ad') || evt.includes('video')) {
            triggerAdShield();
          }
        }
      } catch {}
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('message', handlePostMessage);

    return () => {
      isCancelled = true;
      if (shieldIntervalRef.current) clearInterval(shieldIntervalRef.current);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('message', handlePostMessage);
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [magnet, dataPath, poster, title, playerId, triggerAdShield]);

  const webPlayerUrl = `https://webtor.io/#/show?magnet=${encodeURIComponent(magnet)}`;

  // SVG circular calculation: radius = 42, circumference = 2 * pi * 42 = 263.89
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div
      className="w-full h-full relative bg-black overflow-hidden flex items-center justify-center select-none"
      onClick={() => {
        if (!hasTriggeredShieldRef.current) {
          triggerAdShield();
        }
      }}
    >
      {/* Target DOM Element for Webtor SDK Player */}
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0 [&_iframe]:!w-full [&_iframe]:!h-full [&_iframe]:!max-w-full [&_iframe]:!max-h-full [&_iframe]:!absolute [&_iframe]:!inset-0 [&_iframe]:!border-0"
      />

      {/* 12-Second Minimal Clean Circular Loader (0 to 100% inside small grey circle, no skip) */}
      {isAdShieldActive && (
        <div className="absolute inset-0 z-30 bg-black flex flex-col items-center justify-center pointer-events-auto select-none">
          {/* Small compact circular progress ring */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-neutral-800/80"
                strokeWidth="4"
                fill="transparent"
              />
              {/* Animated Progress Ring (Theme Grey) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-neutral-400"
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Percentage text in center */}
            <div className="absolute inset-0 flex items-center justify-center font-mono font-medium text-neutral-300 text-xs sm:text-sm">
              {Math.min(100, Math.floor(progressPercent))}%
            </div>
          </div>

          {/* Minimal Connecting Label */}
          <span className="text-[11px] text-neutral-400 font-medium tracking-wide mt-2.5">
            Connecting...
          </span>
        </div>
      )}

      {/* Initial Bootstrap Indicator */}
      {isInitializing && !hasError && !isAdShieldActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 pointer-events-none z-10 space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
          <span className="text-xs text-neutral-400 font-semibold">Connecting...</span>
        </div>
      )}

      {/* Error Fallback */}
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
            className="px-4 py-2 rounded-lg bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>Open Direct Stream</span>
          </a>
        </div>
      )}
    </div>
  );
};
