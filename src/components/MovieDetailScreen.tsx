import React, { useState } from 'react';
import { ArrowLeft, Download, CheckCircle2, Star, Clock, Film, ExternalLink, Copy, Check } from 'lucide-react';
import { Movie, DownloadItem } from '../types';
import { MovieCard } from './MovieCard';

interface MovieDetailScreenProps {
  movie: Movie;
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
  onAddDownload: (item: DownloadItem) => void;
  trendingMovies: Movie[];
}

function getMagnetLink(movie: Movie, quality: '4K' | '1080p' | '720p' | '480p'): string {
  const custom = movie.downloadLinks?.[quality];
  if (custom && (custom.startsWith('magnet:') || custom.startsWith('http://') || custom.startsWith('https://'))) {
    return custom;
  }
  
  // Format clean movie title for torrent display name
  const safeTitle = (movie.title || 'Movie').replace(/[^\w\s.-]/g, '');
  const dn = encodeURIComponent(`${safeTitle}.${movie.year || 2024}.${quality}.Telugu.WEB-DL.DDP5.1.Atmos-Chitram`);
  
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
  const [selectedQuality, setSelectedQuality] = useState<'4K' | '1080p' | '720p' | '480p'>('1080p');
  const [downloaded, setDownloaded] = useState(false);
  const [activeMagnet, setActiveMagnet] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDownload = (quality: '4K' | '1080p' | '720p' | '480p') => {
    try {
      setSelectedQuality(quality);
      setDownloaded(true);

      const downloadItem: DownloadItem = {
        id: `${movie.id}-${quality}-${Date.now()}`,
        movie,
        quality,
        size: movie.downloadSizes?.[quality] || '1.8 GB',
        language: 'English / Dual Audio',
        progress: 100,
        speed: '50 MB/s',
        status: 'completed',
        timestamp: Date.now()
      };
      onAddDownload(downloadItem);

      // Generate or retrieve the uTorrent Magnet URI
      const magnetUri = getMagnetLink(movie, quality);
      setActiveMagnet(magnetUri);

      // Trigger redirection to uTorrent app via magnet protocol
      const a = document.createElement('a');
      a.href = magnetUri;
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Try window.location.href for Android intent redirection
      try {
        window.location.href = magnetUri;
      } catch {
        // Ignored
      }

      setTimeout(() => {
        setDownloaded(false);
      }, 7000);
    } catch (err) {
      console.warn('Download error:', err instanceof Error ? err.message : String(err));
    }
  };

  const handleCopyMagnet = () => {
    const magnetUri = activeMagnet || getMagnetLink(movie, selectedQuality);
    navigator.clipboard.writeText(magnetUri).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => {});
  };

  // 5 related trending movies excluding current movie
  const relatedMovies = (trendingMovies || []).filter(m => m && m.id !== movie.id).slice(0, 5);

  const movieGenres = Array.isArray(movie.genre) ? movie.genre.join(', ') : 'Drama';
  const movieLanguages = Array.isArray(movie.languages) ? movie.languages.join(', ') : 'Telugu';
  const movieCast = Array.isArray(movie.cast) ? movie.cast.join(', ') : 'Cast';
  const currentMagnet = activeMagnet || getMagnetLink(movie, selectedQuality);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      
      {/* Back Button - Just Back Icon */}
      <div className="mb-4">
        <button
          onClick={onBack}
          aria-label="Back"
          title="Back"
          className="inline-flex items-center justify-center p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>

      {/* Main Video Streaming Player */}
      <div className="w-full bg-black rounded-xl overflow-hidden border border-neutral-900 shadow-2xl mb-6">
        <div className="relative aspect-video w-full bg-black">
          <video
            key={movie.id}
            src={movie.videoSampleUrl}
            controls
            playsInline
            poster={movie.backdropUrl || movie.posterUrl}
            className="w-full h-full object-contain"
          >
            Your browser does not support the video tag.
          </video>
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

        {/* Right Column: Download Options with uTorrent Redirect */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Download Movie
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-bold">
                µTorrent Ready
              </span>
            </div>
            <p className="text-xs text-neutral-400 mb-4">
              Select resolution to download directly in <strong>uTorrent App</strong>.
            </p>

            {/* Quality Selection Grid */}
            <div className="space-y-2">
              {(['4K', '1080p', '720p', '480p'] as const).map((q) => {
                const isSelected = selectedQuality === q;
                const sizeText = movie.downloadSizes?.[q] || (q === '4K' ? '3.8 GB' : q === '1080p' ? '1.8 GB' : q === '720p' ? '900 MB' : '450 MB');
                return (
                  <button
                    key={q}
                    onClick={() => setSelectedQuality(q)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors ${
                      isSelected
                        ? 'border-white bg-neutral-900 text-white'
                        : 'border-neutral-900 bg-black text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    <span className="font-bold">{q} {q === '4K' ? 'Ultra HD' : q === '1080p' ? 'Full HD' : 'HD'}</span>
                    <span className="text-neutral-400 text-[11px]">{sizeText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-neutral-900 space-y-2.5">
            {downloaded && (
              <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-200 space-y-2 animate-fadeIn">
                <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Redirecting to uTorrent App...</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-normal">
                  If uTorrent doesn't open automatically on your device, click the button below:
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={currentMagnet}
                    className="flex-1 py-1.5 px-2 bg-emerald-500 text-black font-bold text-center rounded text-[11px] hover:bg-emerald-400 flex items-center justify-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open uTorrent</span>
                  </a>
                  <button
                    onClick={handleCopyMagnet}
                    className="py-1.5 px-2.5 bg-neutral-900 border border-neutral-700 text-white rounded text-[11px] hover:bg-neutral-800 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied!' : 'Copy Magnet'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Main Action Button */}
            <button
              onClick={() => handleDownload(selectedQuality)}
              className="w-full py-3 px-4 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors shadow-lg active:scale-[0.99]"
            >
              <Download className="w-4 h-4 text-black stroke-[2.5]" />
              <span>Download in uTorrent ({selectedQuality})</span>
            </button>

            {/* Quick Copy Link Helper */}
            <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1 pt-1">
              <span>Supports µTorrent, BitTorrent, qBit</span>
              <button
                onClick={handleCopyMagnet}
                className="text-neutral-400 hover:text-white underline flex items-center gap-1"
              >
                {copied ? 'Magnet copied!' : 'Copy Magnet Link'}
              </button>
            </div>
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
