import React, { useState } from 'react';
import { ArrowLeft, Download, CheckCircle2, Star, Clock, Film } from 'lucide-react';
import { Movie, DownloadItem } from '../types';
import { MovieCard } from './MovieCard';

interface MovieDetailScreenProps {
  movie: Movie;
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
  onAddDownload: (item: DownloadItem) => void;
  trendingMovies: Movie[];
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

      // Custom link or mock client blob download
      const customLink = movie.downloadLinks?.[quality];
      if (customLink && customLink.startsWith('http')) {
        const a = document.createElement('a');
        a.href = customLink;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const blob = new Blob([`Chitram Movie: ${movie.title} [${quality}]`], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Chitram_${(movie.title || 'Movie').replace(/\s+/g, '_')}_${quality}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }

      setTimeout(() => {
        setDownloaded(false);
      }, 4000);
    } catch (err) {
      console.warn('Download error:', err instanceof Error ? err.message : String(err));
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
            preload="metadata"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Movie Details & Direct Download Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        
        {/* Left Column: Movie Info */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase font-sans">
              {movie.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 mt-2">
              <span className="flex items-center gap-1 text-white font-bold">
                <Star className="w-3.5 h-3.5 text-white fill-white" />
                {movie.rating || 8.5} / 10
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                {movie.duration || '2h 30m'}
              </span>
              <span>•</span>
              <span>{movie.year || 2024}</span>
              <span>•</span>
              <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-white font-semibold text-[10px]">
                {movie.quality || '4K UHD'}
              </span>
              <span>•</span>
              <span>{movieGenres}</span>
            </div>
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

        {/* Right Column: Download Options */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Film className="w-4 h-4 text-white" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Download Movie
              </h3>
            </div>
            <p className="text-xs text-neutral-400 mb-4">
              Select resolution to download directly to your device for offline viewing.
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

          <div className="mt-5 pt-4 border-t border-neutral-900">
            {downloaded && (
              <div className="mb-2 text-xs text-white font-bold flex items-center gap-1.5 justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>Download started ({selectedQuality})</span>
              </div>
            )}
            <button
              onClick={() => handleDownload(selectedQuality)}
              className="w-full py-2.5 px-4 rounded-lg bg-white text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors"
            >
              <Download className="w-4 h-4 text-black stroke-[2.5]" />
              <span>Download {selectedQuality}</span>
            </button>
          </div>
        </div>

      </div>

      {/* More Movies Row (5 posters per row) */}
      {relatedMovies.length > 0 && (
        <div className="pt-6 border-t border-neutral-900">
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              More Movies
            </h3>
            <button
              onClick={onBack}
              className="text-xs text-neutral-400 hover:text-white underline"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-5 gap-y-3.5 sm:gap-y-5 gap-x-1.5 sm:gap-x-3 md:gap-x-4">
            {relatedMovies.map((relMovie) => (
              <MovieCard
                key={relMovie.id}
                movie={relMovie}
                onSelect={(m) => {
                  onSelectMovie(m);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
