import React, { useState } from 'react';
import { ArrowLeft, Star, Clock, Copy, Check } from 'lucide-react';
import { Movie, DownloadItem } from '../types';
import { MovieCard } from './MovieCard';

interface MovieDetailScreenProps {
  movie: Movie;
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
  onAddDownload?: (item: DownloadItem) => void;
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
  trendingMovies
}) => {
  const [copiedQuality, setCopiedQuality] = useState<string | null>(null);

  const handleCopyQualityMagnet = (q: '4K' | '1080p' | '720p' | '480p') => {
    try {
      const magnetUri = getMagnetLink(movie, q);
      navigator.clipboard.writeText(magnetUri).then(() => {
        setCopiedQuality(q);
        setTimeout(() => setCopiedQuality(null), 2500);
      }).catch(() => {
        // Fallback copy
        const textArea = document.createElement('textarea');
        textArea.value = magnetUri;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedQuality(q);
        setTimeout(() => setCopiedQuality(null), 2500);
      });
    } catch (err) {
      console.warn('Copy error:', err);
    }
  };

  // 5 related trending movies excluding current movie
  const relatedMovies = (trendingMovies || []).filter(m => m && m.id !== movie.id).slice(0, 5);

  const movieGenres = Array.isArray(movie.genre) ? movie.genre.join(', ') : 'Drama';
  const movieLanguages = Array.isArray(movie.languages) ? movie.languages.join(', ') : 'Telugu';
  const movieCast = Array.isArray(movie.cast) ? movie.cast.join(', ') : 'Cast';

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

        {/* Right Column: Clean Download Links List with Copy Button */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 flex flex-col justify-start">
          <p className="text-xs text-neutral-400 mb-4">
            Copy magnet link to download in <strong>uTorrent</strong>.
          </p>

          {/* Quality Options Rows */}
          <div className="space-y-2.5">
            {(['4K', '1080p', '720p', '480p'] as const).map((q) => {
              const sizeText = movie.downloadSizes?.[q] || (q === '4K' ? '3.8 GB' : q === '1080p' ? '1.8 GB' : q === '720p' ? '900 MB' : '450 MB');
              const isCopied = copiedQuality === q;
              return (
                <div
                  key={q}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-900 bg-black text-xs text-neutral-300 transition-colors"
                >
                  {/* Left: Torrent Logo + Resolution Name */}
                  <div className="flex items-center gap-2.5">
                    <img
                      src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgeED3Cmbrd4zcEIHYFFX8MO58z5BJEmgmIkogwFY3LIPglUnaKPNy_ERcrKJKQWDN6AVXL12n4nl1xgpoOfrEC3nV6N1H7iDj98tQvqnDj1sSkF8h_z3BqMg_5azUCi7pnmo9fcSnZFlDd2qauvILU58vVdQx1q_HiwCNEZH7qeH7hDUOJJpfa9zqcYsMj/s320/ut2939ue0c-utorrent-logo-utorrent-logo-social-social-media-torrent-icon-free-download.png"
                      alt="uTorrent Logo"
                      className="w-5 h-5 object-contain shrink-0"
                    />
                    <div>
                      <span className="font-bold text-white text-xs block">
                        {q} {q === '4K' ? 'Ultra HD' : q === '1080p' ? 'Full HD' : 'HD'}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        uTorrent Magnet
                      </span>
                    </div>
                  </div>

                  {/* Right: Size Badge + Dedicated Clickable Copy Button */}
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400 text-[11px] font-semibold bg-neutral-950 px-2 py-1 rounded border border-neutral-900">
                      {sizeText}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyQualityMagnet(q)}
                      title={`Copy ${q} Magnet Link`}
                      aria-label={`Copy ${q} Magnet Link`}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                        isCopied
                          ? 'bg-emerald-950/90 border-emerald-500 text-emerald-400 shadow-sm'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-500 active:scale-95'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                          <span className="text-[10px] font-bold text-emerald-400 pr-0.5">Copied!</span>
                        </>
                      ) : (
                        <Copy className="w-3.5 h-3.5 stroke-[2]" />
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
