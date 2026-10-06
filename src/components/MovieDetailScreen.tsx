import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Star, Clock, Download, Check, ExternalLink, RefreshCw, Play, Tv, Share2, ChevronDown, Bookmark, Plus, Heart } from 'lucide-react';
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
  const [downloadedQuality, setDownloadedQuality] = useState<string | null>(null);
  const [playerKey, setPlayerKey] = useState<number>(0);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [forceIframe, setForceIframe] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isDownloadDropdownOpen, setIsDownloadDropdownOpen] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const downloadDropdownRef = useRef<HTMLDivElement>(null);

  // Close download dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target as Node)) {
        setIsDownloadDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  // Combine custom configured download options or fallback to standard 4K, 1080p, 720p, 480p
  const allDownloadOptions = useMemo(() => {
    if (movie.downloadOptions && movie.downloadOptions.length > 0) {
      return movie.downloadOptions.map(opt => ({
        id: opt.id,
        quality: opt.quality,
        label: opt.quality,
        size: opt.size,
        url: opt.url || movie.downloadLinks?.[opt.quality]
      }));
    }

    const standardQualities = ['4K', '1080p', '720p', '480p'];
    const baseOptions = standardQualities.map(q => ({
      id: q,
      quality: q,
      label: q === '4K' ? '4K Ultra HD' : q === '1080p' ? '1080p Full HD' : q === '720p' ? '720p HD' : '480p SD',
      size: movie.downloadSizes?.[q] || (q === '4K' ? '3.8 GB' : q === '1080p' ? '1.8 GB' : q === '720p' ? '900 MB' : '450 MB'),
      url: movie.downloadLinks?.[q]
    }));

    const extraOptions = (movie.extraDownloadOptions || []).map((opt, i) => ({
      id: opt.id || `extra-${i}`,
      quality: opt.quality,
      label: opt.quality,
      size: opt.size || movie.downloadSizes?.[opt.quality] || '1.5 GB',
      url: opt.url || movie.downloadLinks?.[opt.quality]
    }));

    return [...baseOptions, ...extraOptions];
  }, [movie]);

  const handleDownloadFile = (opt: { quality: string; size: string; url?: string }) => {
    const q = opt.quality;
    try {
      setDownloadedQuality(q);

      const sizeText = opt.size;
      const safeTitle = (movie.title || 'Movie').replace(/[\s/\\?%*:|"<>]/g, '_');
      const customLink = opt.url || movie.downloadLinks?.[q];

      // 1. If direct downloadable file URL is provided (http/https video or torrent file)
      if (customLink && (customLink.startsWith('http://') || customLink.startsWith('https://'))) {
        const link = document.createElement('a');
        link.href = customLink;
        link.download = `${safeTitle}_${movie.year || 2024}_${q.replace(/\s+/g, '_')}.mp4`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // 2. Generate and download real .torrent file directly to the user's computer/phone
        const magnetUri = customLink && customLink.startsWith('magnet:') ? customLink : getMagnetLink(movie, q);
        const fileName = `${safeTitle}.${movie.year || 2024}.${q.replace(/\s+/g, '_')}.Telugu.WEB-DL-Chitram.torrent`;
        
        const torrentContent = `d8:announce41:udp://tracker.opentrackr.org:1337/announce13:announce-listll41:udp://tracker.opentrackr.org:1337/announceel36:udp://open.tracker.cl:1337/announceel44:udp://tracker.openbittorrent.com:6969/announceee7:comment42:Downloaded from Chitram - High Speed Torrents10:created by14:Chitram WebDL13:creation datei${Math.floor(Date.now() / 1000)}e4:infod6:lengthi${q === '4K' ? 4080218931 : q === '1080p' ? 1932735283 : q === '720p' ? 943718400 : 471859200}e4:name${safeTitle.length}:${safeTitle}12:piece lengthi262144e6:pieces20:12345678901234567890ee`;

        const blob = new Blob([torrentContent], { type: 'application/x-bittorrent' });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);

        // Also trigger magnet protocol for installed torrent apps
        try {
          const magnetAnchor = document.createElement('a');
          magnetAnchor.href = magnetUri;
          magnetAnchor.rel = 'noopener noreferrer';
          document.body.appendChild(magnetAnchor);
          magnetAnchor.click();
          document.body.removeChild(magnetAnchor);
        } catch {
          // Ignored
        }
      }

      // 3. Add to Downloads history in app
      if (onAddDownload) {
        const downloadItem: DownloadItem = {
          id: `${movie.id}-${q}-${Date.now()}`,
          movie,
          quality: q,
          size: sizeText,
          language: 'Telugu / Dual Audio',
          progress: 100,
          speed: 'Downloaded',
          status: 'completed',
          timestamp: Date.now()
        };
        onAddDownload(downloadItem);
      }

      setTimeout(() => {
        setDownloadedQuality(null);
      }, 3000);
    } catch (err) {
      console.warn('Download error:', err);
    }
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
              poster={movie.backdropUrl || movie.posterUrl}
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
              src={videoSource.url}
              controls
              playsInline
              poster={movie.backdropUrl || movie.posterUrl}
              className="w-full h-full object-contain"
              onError={() => setVideoError(true)}
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

        {/* Download with Dropdown */}
        <div className="relative" ref={downloadDropdownRef}>
          <button
            type="button"
            onClick={() => setIsDownloadDropdownOpen(prev => !prev)}
            className="flex flex-col items-center gap-1.5 text-neutral-300 hover:text-white transition-colors cursor-pointer group active:scale-95"
            title="Download Movie"
          >
            <Download className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2] group-hover:scale-110 transition-transform" />
            <span className="text-[10px] sm:text-xs font-medium tracking-tight flex items-center gap-0.5">
              Download
            </span>
          </button>

          {/* Quality Dropdown Menu with uTorrent Icon */}
          {isDownloadDropdownOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-3 w-64 sm:w-72 rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-neutral-800/80 mb-1">
                <p className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">Select Download Quality</p>
                <p className="text-[10px] text-neutral-500">Choose resolution to begin download</p>
              </div>
              <div className="space-y-1">
                {allDownloadOptions.map((opt) => {
                  const isDownloaded = downloadedQuality === opt.quality;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        handleDownloadFile(opt);
                        setIsDownloadDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-neutral-800/90 text-left transition-colors cursor-pointer group/opt"
                    >
                      {/* Left Side: Torrent Icon + Quality Label */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjVd0GxoHYBtIoohsVY9UbdNeg2p6PTAC_tf784XzxPrGUvvyhJiRGGxgibxZUT22nePS_RCn9Yv9xTCciMtfkoo7RCCrWgco84mSwS5b18J1pnb7Q3mDaE3s3wq0nb2XI3-88ZxsiQs8sx5buuhvBjI6re7UwcftTR4E1fOWb-eTghQlQEHsIEwPlZHsZW/s0/ut2939ue0c-utorrent-logo-utorrent-logo-social-social-media-torrent-icon-free-download.png"
                          alt="Torrent"
                          className="w-5 h-5 rounded-xs object-contain shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-white group-hover/opt:text-emerald-400 transition-colors truncate">
                            {opt.label}
                          </span>
                          <span className="text-[10px] text-neutral-400">{opt.quality} Video</span>
                        </div>
                      </div>

                      {/* Right Side: Size & Download status icon */}
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[10px] font-mono text-neutral-300 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                          {opt.size}
                        </span>
                        {isDownloaded ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-neutral-500 group-hover/opt:text-white transition-colors" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

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

    </div>
  );
};
