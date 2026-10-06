import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Star, Clock, Download, Check, ExternalLink, RefreshCw, Play, Tv, Share2, ChevronDown, Bookmark, Plus, Heart, Loader2 } from 'lucide-react';
import { Movie, DownloadItem } from '../types';
import { MovieCard } from './MovieCard';
import { WebtorPlayer } from './WebtorPlayer';

interface MovieDetailScreenProps {
  movie: Movie;
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
  onAddDownload?: (item: DownloadItem) => void;
  trendingMovies: Movie[];
  isBookmarked?: boolean;
  onToggleBookmark?: (movie: Movie) => void;
}

interface VideoSource {
  type: 'webtor' | 'iframe' | 'video';
  url: string;
  magnet?: string;
  dataPath?: string;
  rawSnippet?: string;
}

function parseVideoSource(rawUrl: string | undefined): VideoSource {
  if (!rawUrl || !rawUrl.trim()) {
    return {
      type: 'iframe',
      url: 'https://www.youtube-nocookie.com/embed/g3JUbg4v6gc?autoplay=0&rel=0&modestbranding=1'
    };
  }

  let str = rawUrl.trim();

  // 0. Webtor / Magnet Video Embed detection (supports raw Webtor snippet or magnet URIs)
  if (
    str.includes('@webtor') ||
    str.includes('magnet:?xt=') ||
    (str.includes('<video') && (str.includes('magnet:') || str.includes('data-path')))
  ) {
    const magnetMatch = str.match(/src=["'](magnet:\?[^"']+)["']/i) || str.match(/(magnet:\?[^\s"'<>]+)/i);
    const dataPathMatch = str.match(/data-path=["']([^"']+)["']/i);
    const magnet = magnetMatch ? magnetMatch[1] : '';
    const dataPath = dataPathMatch ? dataPathMatch[1] : '';

    return {
      type: 'webtor',
      url: magnet || str,
      magnet: magnet || str,
      dataPath,
      rawSnippet: str.includes('<video') ? str : undefined
    };
  }

  // 1. If user pasted an entire <iframe> code snippet like `<iframe src="https://..." ...></iframe>`
  const iframeSrcMatch = str.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    str = iframeSrcMatch[1];
  }

  // Upgrade http to https if applicable to prevent mixed content blocking in secure browsers
  if (str.startsWith('http://') && !str.includes('localhost')) {
    str = str.replace('http://', 'https://');
  }

  // 2. YouTube standard links, shorts or embed
  const ytWatchMatch = str.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytWatchMatch && ytWatchMatch[1]) {
    return {
      type: 'iframe',
      url: `https://www.youtube-nocookie.com/embed/${ytWatchMatch[1]}?autoplay=0&rel=0&modestbranding=1`
    };
  }

  // 3. Google Drive preview link
  if (str.includes('drive.google.com/file/d/')) {
    const driveMatch = str.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return {
        type: 'iframe',
        url: `https://drive.google.com/file/d/${driveMatch[1]}/preview`
      };
    }
  }

  // 4. Vimeo link
  const vimeoMatch = str.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[3]) {
    return {
      type: 'iframe',
      url: `https://player.vimeo.com/video/${vimeoMatch[3]}`
    };
  }

  // 5. Dailymotion link
  const dmMatch = str.match(/dailymotion\.com\/(?:video|embed\/video)\/([a-zA-Z0-9]+)/);
  if (dmMatch && dmMatch[1]) {
    return {
      type: 'iframe',
      url: `https://www.dailymotion.com/embed/video/${dmMatch[1]}`
    };
  }

  // 6. Direct video extensions (.mp4, .webm, .ogg, .m3u8, .mov, etc.)
  const isDirectVideo = /\.(mp4|webm|ogg|m3u8|mov)(\?.*)?$/i.test(str);
  if (isDirectVideo) {
    return {
      type: 'video',
      url: str
    };
  }

  // 7. Any generic embed URL or web streaming provider -> play in iframe!
  return {
    type: 'iframe',
    url: str
  };
}

function getMagnetLink(movie: Movie, quality: string): string {
  const custom = movie.downloadLinks?.[quality];
  if (custom && (custom.startsWith('magnet:') || custom.startsWith('http://') || custom.startsWith('https://'))) {
    return custom;
  }
  
  // Format clean movie title for torrent display name
  const safeTitle = (movie.title || 'Movie').replace(/[^\w\s.-]/g, '');
  const dn = encodeURIComponent(`${safeTitle}.${movie.year || 2024}.${quality.replace(/\s+/g, '.')}.Telugu.WEB-DL.DDP5.1.Atmos-Chitram`);
  
  // Generate deterministic 40-character hex BTIH hash
  const raw = `${safeTitle}-${movie.year || 2024}-${quality}-chitram-utorrent`;
  let btih = '';
  for (let i = 0; i < 40; i++) {
    const c = raw.charCodeAt(i % raw.length) + (i * 13);
    btih += (c % 16).toString(16);
  }

  // Fast public BitTorrent trackers
  const trackers = [
    'udp://tracker.opentrackr.org:1337/announce',
    'udp://open.tracker.cl:1337/announce',
    'udp://tracker.openbittorrent.com:6969/announce',
    'udp://opentracker.i2p.rocks:6969/announce',
    'udp://tracker.torrent.eu.org:451/announce',
    'udp://open.stealth.si:80/announce',
    'udp://explodie.org:6969/announce'
  ].map(t => `&tr=${encodeURIComponent(t)}`).join('');

  return `magnet:?xt=urn:btih:${btih}&dn=${dn}${trackers}`;
}

export const MovieDetailScreen: React.FC<MovieDetailScreenProps> = ({
  movie,
  onBack,
  onSelectMovie,
  onAddDownload,
  trendingMovies,
  isBookmarked = false,
  onToggleBookmark
}) => {
  const [playerKey, setPlayerKey] = useState<number>(0);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [forceIframe, setForceIframe] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  
  // 3-Second Circular Loading Download State
  const [isDownloadLoading, setIsDownloadLoading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloadDone, setIsDownloadDone] = useState<boolean>(false);
  const downloadIntervalRef = useRef<any>(null);

  const [downloadNotice, setDownloadNotice] = useState<{
    loading: boolean;
    title: string;
    message: string;
  } | null>(null);
  const hasStartedPlayingRef = useRef<boolean>(false);

  useEffect(() => {
    hasStartedPlayingRef.current = false;
  }, [movie.id, playerKey]);

  useEffect(() => {
    return () => {
      if (downloadIntervalRef.current) clearInterval(downloadIntervalRef.current);
    };
  }, []);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: `${movie.title} - Chitram`,
      text: `Watch and stream ${movie.title} in HD on Chitram!`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or share failed, fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
    } catch {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
    }
  };

  // Parse video source (detects Webtor torrent embed, iframe embed or direct HTML5 video)
  const videoSource = useMemo(() => parseVideoSource(movie.videoSampleUrl), [movie.videoSampleUrl]);

  // Determine current player type
  const activePlayerType = forceIframe ? 'iframe' : videoSource.type;

  const handleReloadPlayer = () => {
    setVideoError(false);
    setPlayerKey(prev => prev + 1);
  };

  // Check if a download link was provided by the creator
  const hasDownloadLink = useMemo(() => {
    if (movie.downloadUrl && movie.downloadUrl.trim().length > 0) return true;
    if (movie.downloadOptions && movie.downloadOptions.some(opt => opt.url && opt.url.trim().length > 0)) return true;
    if (movie.downloadLinks && Object.values(movie.downloadLinks).some(url => Boolean(url && typeof url === 'string' && url.trim().length > 0))) return true;
    return false;
  }, [movie]);

  const recordDownloadHistory = () => {
    if (onAddDownload) {
      const downloadItem: DownloadItem = {
        id: `${movie.id}-${Date.now()}`,
        movie,
        quality: movie.quality || '1080p',
        size: '1.8 GB',
        language: 'Telugu',
        progress: 100,
        speed: 'Downloaded',
        status: 'completed',
        timestamp: Date.now()
      };
      onAddDownload(downloadItem);
    }
  };

  const executeDirectDownload = async () => {
    try {
      const safeTitle = (movie.title || 'Movie').replace(/[\s/\\?%*:|"<>]/g, '_');
      
      // Target download link priority:
      // 1. Explicit downloadUrl from Creator Studio
      // 2. First download option URL
      // 3. Fallback to active video streaming sample URL
      const targetLink = (movie.downloadUrl && movie.downloadUrl.trim())
        || (movie.downloadOptions && movie.downloadOptions[0]?.url && movie.downloadOptions[0].url.trim())
        || (movie.downloadLinks && Object.values(movie.downloadLinks).find(v => Boolean(v && v.trim())))
        || (movie.videoSampleUrl && movie.videoSampleUrl.trim())
        || '';

      const fileName = `${safeTitle}.${movie.year || 2024}.${(movie.quality || 'HD').replace(/\s+/g, '_')}.mp4`;

      const triggerDownloadAnchor = (url: string, name: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };

      // CASE 1: Google Drive Link -> Direct download without third-party app
      if (targetLink.includes('drive.google.com/file/d/')) {
        const driveMatch = targetLink.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (driveMatch && driveMatch[1]) {
          const driveDownloadUrl = `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
          triggerDownloadAnchor(driveDownloadUrl, fileName);

          setDownloadNotice({
            loading: false,
            title: movie.title,
            message: 'Direct video download started to your device!'
          });
          setTimeout(() => setDownloadNotice(null), 4000);
          recordDownloadHistory();
          return;
        }
      }

      // CASE 2: Direct Video Link (http/https mp4, mkv, webm, direct streaming URL)
      if (targetLink.startsWith('http://') || targetLink.startsWith('https://')) {
        let blobSuccess = false;
        try {
          const res = await fetch(targetLink);
          if (res.ok) {
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
            blobSuccess = true;
          }
        } catch {
          // If CORS prevents fetch, fallback to browser native anchor download below
        }

        if (!blobSuccess) {
          triggerDownloadAnchor(targetLink, fileName);
        }

        setDownloadNotice({
          loading: false,
          title: movie.title,
          message: 'Video file download started to your device!'
        });
        setTimeout(() => setDownloadNotice(null), 4000);
        recordDownloadHistory();
        return;
      }

      // CASE 3: Magnet Link -> Direct Web Stream Cloud Downloader
      if (targetLink.startsWith('magnet:') || (!targetLink && getMagnetLink(movie, '1080p'))) {
        const cleanMagnet = targetLink.startsWith('magnet:') ? targetLink : getMagnetLink(movie, '1080p');

        // Open Webtor Cloud Web Player / Direct Downloader in browser tab
        const webStreamDownloadUrl = `https://webtor.io/#/show?magnet=${encodeURIComponent(cleanMagnet)}`;
        window.open(webStreamDownloadUrl, '_blank', 'noopener,noreferrer');

        // Also trigger magnet protocol for users who have uTorrent installed
        try {
          const magnetAnchor = document.createElement('a');
          magnetAnchor.href = cleanMagnet;
          document.body.appendChild(magnetAnchor);
          magnetAnchor.click();
          document.body.removeChild(magnetAnchor);
        } catch {}

        setDownloadNotice({
          loading: false,
          title: movie.title,
          message: 'Direct Web Downloader opened (No app needed to download MP4)!'
        });
        setTimeout(() => setDownloadNotice(null), 4000);
        recordDownloadHistory();
      }
    } catch (err) {
      console.warn('Download error:', err);
      setDownloadNotice({
        loading: false,
        title: movie.title,
        message: 'Download could not start. Please check the video link.'
      });
      setTimeout(() => setDownloadNotice(null), 4000);
    }
  };

  // 3-Second Circular Loading Spinner when clicking Download
  const handleDownloadButtonClick = () => {
    if (!hasDownloadLink || isDownloadLoading) return;

    setIsDownloadLoading(true);
    setDownloadProgress(0);
    setIsDownloadDone(false);

    const DURATION = 3000; // Exactly 3 seconds
    const startTime = Date.now();

    if (downloadIntervalRef.current) clearInterval(downloadIntervalRef.current);

    downloadIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(100, (elapsed / DURATION) * 100);
      setDownloadProgress(p);

      if (elapsed >= DURATION) {
        if (downloadIntervalRef.current) clearInterval(downloadIntervalRef.current);
        setIsDownloadLoading(false);
        setIsDownloadDone(true);
        executeDirectDownload();
        setTimeout(() => {
          setIsDownloadDone(false);
        }, 3500);
      }
    }, 30);
  };

  // 5 related trending movies excluding current movie
  const relatedMovies = (trendingMovies || []).filter(m => m && m.id !== movie.id).slice(0, 5);

  const magnetUrl = videoSource.magnet || videoSource.url;
  const webtorWebUrl = `https://webtor.io/#/show?magnet=${encodeURIComponent(magnetUrl)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      
      {/* Back Button & Stream Header Controls */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          aria-label="Back"
          title="Back"
          className="inline-flex items-center justify-center p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Video Player Quick Actions */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleReloadPlayer}
            title="Reload Player"
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reload</span>
          </button>
        </div>
      </div>

      {/* Main Video Streaming Player (Supports Webtor Native SDK, Iframe Embed, and Direct HTML5 Video) */}
      <div className="w-full bg-black rounded-xl overflow-hidden border border-neutral-900 shadow-2xl mb-6 relative">
        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
          {videoSource.type === 'webtor' ? (
            <WebtorPlayer
              key={`webtor-${movie.id}-${playerKey}`}
              magnet={videoSource.magnet || videoSource.url}
              dataPath={videoSource.dataPath}
              title={movie.title}
              onReload={handleReloadPlayer}
            />
          ) : activePlayerType === 'iframe' ? (
            <iframe
              key={`iframe-${videoSource.url}-${playerKey}`}
              src={videoSource.url}
              title={`${movie.title} Stream`}
              className="w-full h-full border-0 absolute inset-0"
              referrerPolicy="no-referrer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
            />
          ) : videoError ? (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400">
                <Tv className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Direct video stream could not be loaded</p>
                <p className="text-xs text-neutral-400 mt-1">This video may require the Embed Server or an external player.</p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setForceIframe(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Switch to Embed Player</span>
                </button>
                <a
                  href={videoSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs hover:bg-neutral-800 transition-colors flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Stream</span>
                </a>
              </div>
            </div>
          ) : (
            <video
              key={`video-${videoSource.url}-${playerKey}`}
              src={
                videoSource.url.includes('#')
                  ? videoSource.url
                  : `${videoSource.url}#t=600`
              }
              controls
              playsInline
              preload="metadata"
              className="w-full h-full object-contain bg-black"
              onError={() => setVideoError(true)}
              onPlay={(e) => {
                const vid = e.currentTarget;
                if (!hasStartedPlayingRef.current) {
                  hasStartedPlayingRef.current = true;
                  // If video is at preview timestamp (around 10 mins), start playing from beginning
                  if (vid.currentTime >= 590) {
                    vid.currentTime = 0;
                    vid.play().catch(() => {});
                  }
                }
              }}
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      </div>

      {/* 🌟 NATIVE OTT VIEW (NO CARDS, CLEAN FLUSH HOTSTAR/NETFLIX OTT APP STYLE) 🌟 */}
      
      {/* 1. Movie Title & Essential Metadata with IMDb Button */}
      <div className="pt-3 pb-1.5">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {movie.title}
        </h1>

        {/* Essential Metadata: Year • Time • Telugu • Quality Badge • IMDb Button */}
        <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm text-neutral-400 mt-1.5 mb-1 font-medium">
          <span>{movie.year}</span>
          <span>•</span>
          <span>{movie.duration || '2h 30m'}</span>
          <span>•</span>
          <span>Telugu</span>
          <span>•</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 font-bold uppercase">
            {movie.quality || '4K UHD'}
          </span>
          <span>•</span>
          {/* Official Yellow IMDb Button redirecting to full IMDb movie details */}
          <a
            href={
              movie.imdbUrl && movie.imdbUrl.trim()
                ? (movie.imdbUrl.startsWith('http') ? movie.imdbUrl : `https://${movie.imdbUrl}`)
                : `https://www.imdb.com/find/?q=${encodeURIComponent(movie.title)}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 px-1.5 py-[2px] rounded-[3px] bg-[#F5C518] hover:bg-[#e2b616] text-black font-black text-[9px] tracking-tight transition-all shadow-xs cursor-pointer active:scale-95 leading-none"
            title="View complete details, cast & reviews on IMDb"
          >
            <span>IMDb</span>
            <ExternalLink className="w-2 h-2 stroke-[2.5]" />
          </a>
        </div>
      </div>

      {/* 2. Native OTT Action Buttons Row (Watchlist, Download, Share, Rate) - Flush, No Cards */}
      <div className="flex items-center justify-around sm:justify-start sm:gap-12 py-3 my-2 border-y border-neutral-900/60">
        {/* Watchlist */}
        <button
          type="button"
          onClick={() => onToggleBookmark?.(movie)}
          className="flex flex-col items-center gap-1.5 text-neutral-300 hover:text-white transition-colors cursor-pointer group active:scale-95"
          title={isBookmarked ? 'In Watchlist' : 'Add to Watchlist'}
        >
          {isBookmarked ? (
            <Check className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 stroke-[2.5]" />
          ) : (
            <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2] group-hover:scale-110 transition-transform" />
          )}
          <span className="text-[10px] sm:text-xs font-medium tracking-tight">
            {isBookmarked ? 'Watchlisted' : 'Watchlist'}
          </span>
        </button>

        {/* Download Button with 3-Second Circular Loading Spinner (Direct Download, No Dropdown) */}
        <button
          type="button"
          onClick={hasDownloadLink ? handleDownloadButtonClick : undefined}
          disabled={!hasDownloadLink || isDownloadLoading}
          className={`flex flex-col items-center gap-1.5 transition-colors select-none ${
            !hasDownloadLink
              ? 'opacity-40 cursor-not-allowed text-neutral-500'
              : 'text-neutral-300 hover:text-white cursor-pointer group active:scale-95 disabled:cursor-wait'
          }`}
          title={!hasDownloadLink ? 'Download not available for this movie' : 'Download Movie'}
        >
          {isDownloadLoading ? (
            <div className="relative w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className="stroke-neutral-800"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className="stroke-neutral-400"
                  strokeWidth="3.5"
                  strokeDasharray={2 * Math.PI * 14}
                  strokeDashoffset={2 * Math.PI * 14 * (1 - downloadProgress / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
            </div>
          ) : isDownloadDone ? (
            <Check className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 stroke-[2.5]" />
          ) : (
            <Download className={`w-5 h-5 sm:w-6 sm:h-6 stroke-[2] ${hasDownloadLink ? 'group-hover:scale-110 transition-transform' : ''}`} />
          )}

          <span className={`text-[10px] sm:text-xs font-medium tracking-tight ${
            !hasDownloadLink
              ? 'text-neutral-500'
              : isDownloadLoading
              ? 'text-neutral-400 font-mono'
              : isDownloadDone
              ? 'text-emerald-400 font-bold'
              : ''
          }`}>
            {isDownloadLoading
              ? `${Math.min(100, Math.floor(downloadProgress))}%`
              : isDownloadDone
              ? 'Starting...'
              : 'Download'}
          </span>
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={handleShare}
          className="flex flex-col items-center gap-1.5 text-neutral-300 hover:text-white transition-colors cursor-pointer group active:scale-95"
          title="Share Movie"
        >
          {isCopied ? (
            <Check className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 stroke-[2.5]" />
          ) : (
            <Share2 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2] group-hover:scale-110 transition-transform" />
          )}
          <span className={`text-[10px] sm:text-xs font-medium tracking-tight ${isCopied ? 'text-emerald-400 font-bold' : ''}`}>
            {isCopied ? 'Copied' : 'Share'}
          </span>
        </button>

        {/* Rate */}
        <button
          type="button"
          onClick={() => setIsLiked(prev => !prev)}
          className="flex flex-col items-center gap-1.5 text-neutral-300 hover:text-white transition-colors cursor-pointer group active:scale-95"
          title="Rate / Like"
        >
          <Heart className={`w-5 h-5 sm:w-6 sm:h-6 stroke-[2] group-hover:scale-110 transition-transform ${isLiked ? 'fill-red-500 text-red-500 stroke-red-500' : ''}`} />
          <span className={`text-[10px] sm:text-xs font-medium tracking-tight ${isLiked ? 'text-red-400 font-bold' : ''}`}>
            {isLiked ? 'Liked' : 'Rate'}
          </span>
        </button>
      </div>

      {/* 3. "More Like This" Section (Native OTT without card borders) */}
      {relatedMovies.length > 0 && (
        <section className="pt-3 pb-8">
          <div className="mb-3 px-0.5">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              More Like This
            </h2>
          </div>
          <div className="grid grid-cols-5 gap-y-3.5 sm:gap-y-5 gap-x-1.5 sm:gap-x-3 md:gap-x-4">
            {relatedMovies.map((relMovie) => (
              <MovieCard
                key={relMovie.id}
                movie={relMovie}
                onSelect={onSelectMovie}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Floating In-App Download Status Toast */}
      {downloadNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100vw-3rem)] bg-neutral-900 border border-neutral-700/80 rounded-xl shadow-2xl p-3.5 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            {downloadNotice.loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5 stroke-[2.5]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{downloadNotice.title}</p>
            <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">{downloadNotice.message}</p>
          </div>
        </div>
      )}

    </div>
  );
};
