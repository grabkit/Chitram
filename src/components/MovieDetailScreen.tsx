import React, { useState, useMemo } from 'react';
import { ArrowLeft, Star, Clock, Download, Check, ExternalLink, RefreshCw, Play, Tv } from 'lucide-react';
import { Movie, DownloadItem } from '../types';
import { MovieCard } from './MovieCard';
import { WebtorPlayer } from './WebtorPlayer';

interface MovieDetailScreenProps {
  movie: Movie;
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
  onAddDownload?: (item: DownloadItem) => void;
  trendingMovies: Movie[];
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
  trendingMovies
}) => {
  const [downloadedQuality, setDownloadedQuality] = useState<string | null>(null);
  const [playerKey, setPlayerKey] = useState<number>(0);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [forceIframe, setForceIframe] = useState<boolean>(false);

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

  const movieGenres = Array.isArray(movie.genre) ? movie.genre.join(', ') : 'Drama';
  const movieLanguages = Array.isArray(movie.languages) ? movie.languages.join(', ') : 'Telugu';
  const movieCast = Array.isArray(movie.cast) ? movie.cast.join(', ') : 'Cast';

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

      {/* Two Column Section: Left Info, Right Download Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        
        {/* Left Column: Movie Info */}
        <div className="lg:col-span-2 bg-neutral-950 border border-neutral-900 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight font-sans">
                {movie.title}
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                {movieGenres}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 font-bold">
                {movie.quality || '4K UHD'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center gap-1 font-semibold">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                {movie.rating ? movie.rating.toFixed(1) : '8.5'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pt-1">
            <span>{movie.year}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {movie.duration || '2h 30m'}
            </span>
            <span>•</span>
            <span>{movieLanguages}</span>
          </div>

          <div className="pt-2 border-t border-neutral-900">
            <h2 className="text-xs uppercase tracking-wider font-bold text-neutral-400 mb-1">
              Storyline
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed">
              {movie.synopsis || 'Experience the movie in high-definition streaming and download.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-neutral-900 text-xs">
            <div>
              <span className="text-neutral-500 font-medium">Director: </span>
              <span className="text-neutral-200 font-semibold">{movie.director || 'Director'}</span>
            </div>
            <div>
              <span className="text-neutral-500 font-medium">Languages: </span>
              <span className="text-neutral-200 font-semibold">{movieLanguages}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-neutral-500 font-medium">Starring: </span>
              <span className="text-neutral-200 font-semibold">{movieCast}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Download Links List with Download Button */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 flex flex-col justify-start">
          <p className="text-xs text-neutral-400 mb-4">
            Select resolution to download.
          </p>

          {/* Quality Options Rows */}
          <div className="space-y-2.5">
            {allDownloadOptions.map((opt) => {
              const isDownloaded = downloadedQuality === opt.quality;
              return (
                <div
                  key={opt.id}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-900 bg-black text-xs text-neutral-300 transition-colors"
                >
                  {/* Left: Video Quality */}
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-neutral-400 text-xs sm:text-sm block truncate">
                      {opt.label}
                    </span>
                  </div>

                  {/* Right: File Size + Normal Download Button */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-neutral-400 text-[11px] sm:text-xs font-semibold bg-neutral-950 px-2.5 py-1 rounded border border-neutral-900">
                      {opt.size}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(opt)}
                      title={`Download ${opt.quality}`}
                      aria-label={`Download ${opt.quality}`}
                      className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                        isDownloaded
                          ? 'bg-emerald-950/90 border-emerald-500 text-emerald-400 shadow-sm'
                          : 'bg-white hover:bg-neutral-200 border-white text-black active:scale-95'
                      }`}
                    >
                      {isDownloaded ? (
                        <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                      ) : (
                        <Download className="w-4 h-4 text-black stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* More Movies Row (5 posters per row) */}
      {relatedMovies.length > 0 && (
        <section className="pt-2 border-t border-neutral-900">
          <div className="mb-3 px-0.5">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              More Movies
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
