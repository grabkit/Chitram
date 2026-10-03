import React from 'react';
import { 
  X, 
  Play, 
  Download, 
  Star, 
  Clock, 
  Film, 
  Bookmark, 
  Check, 
  Sparkles,
  Share2,
  Volume2
} from 'lucide-react';
import { Movie } from '../types';

interface MovieDetailsModalProps {
  movie: Movie | null;
  onClose: () => void;
  onStream: (movie: Movie) => void;
  onDownload: (movie: Movie) => void;
  onToggleWatchlist: (movie: Movie) => void;
  isInWatchlist: boolean;
}

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  movie,
  onClose,
  onStream,
  onDownload,
  onToggleWatchlist,
  isInWatchlist
}) => {
  if (!movie) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-[#0e111a] border border-gray-800 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(57,255,20,0.2)] flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Backdrop Header */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden bg-gray-950">
          <img 
            src={movie.backdropUrl} 
            alt={movie.title} 
            className="w-full h-full object-cover object-center brightness-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e111a] via-[#0e111a]/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/70 backdrop-blur-md border border-gray-700 text-gray-300 hover:text-white hover:border-[#39ff14] transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Radium Badge on Poster Modal */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <span className="radium-badge px-3 py-1 rounded-full text-xs font-black shadow-[0_0_15px_rgba(57,255,20,0.9)]">
              Chitram Premiere
            </span>
            <span className="bg-black/80 backdrop-blur-md text-[#39ff14] border border-[#39ff14]/40 text-xs font-bold px-2 py-0.5 rounded">
              {movie.quality}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 sm:left-6 right-4 z-20">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase">
              {movie.title}
            </h2>
            {movie.teluguTitle && (
              <p className="text-lg sm:text-xl font-bold text-[#39ff14]">
                {movie.teluguTitle}
              </p>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
            <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {movie.rating} / 10
            </span>
            <span className="flex items-center gap-1 text-gray-300 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {movie.duration}
            </span>
            <span className="bg-gray-900 border border-gray-800 px-2 py-0.5 rounded font-semibold text-gray-300">
              {movie.year}
            </span>
            <span className="bg-emerald-950/40 border border-[#39ff14]/30 text-[#39ff14] font-semibold px-2 py-0.5 rounded">
              {movie.genre.join(', ')}
            </span>
          </div>

          {/* Synopsis */}
          <div>
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-gray-400 mb-1.5">
              Synopsis & Plot
            </h4>
            <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
              {movie.synopsis}
            </p>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#131622] p-4 rounded-2xl border border-gray-800/80">
            <div>
              <span className="text-gray-400 block mb-0.5 font-bold uppercase text-[10px]">Director</span>
              <span className="text-white font-semibold text-sm">{movie.director}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5 font-bold uppercase text-[10px]">Starring</span>
              <span className="text-white font-semibold text-sm">{movie.cast.join(', ')}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5 font-bold uppercase text-[10px]">Audio Languages</span>
              <span className="text-[#39ff14] font-semibold text-sm">{movie.languages.join(' • ')}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5 font-bold uppercase text-[10px]">Available Download Sizes</span>
              <span className="text-white font-mono text-xs">
                4K ({movie.downloadSizes['4K']}) • 1080p ({movie.downloadSizes['1080p']}) • 720p ({movie.downloadSizes['720p']})
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                onClose();
                onStream(movie);
              }}
              className="flex-1 min-w-[140px] py-3.5 px-5 rounded-xl bg-[#39ff14] hover:bg-[#4aff2a] text-black font-extrabold text-sm shadow-[0_0_20px_rgba(57,255,20,0.7)] flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-black stroke-black" />
              <span>Stream Movie</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onDownload(movie);
              }}
              className="flex-1 min-w-[140px] py-3.5 px-5 rounded-xl bg-gray-900 border border-[#39ff14]/60 hover:border-[#39ff14] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-gray-800"
            >
              <Download className="w-4 h-4 text-[#39ff14]" />
              <span>Download ({movie.downloadSizes['1080p']})</span>
            </button>

            <button
              onClick={() => onToggleWatchlist(movie)}
              className={`p-3.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                isInWatchlist
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-gray-900 border-gray-700 text-gray-300 hover:text-white hover:border-gray-500'
              }`}
              title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              {isInWatchlist ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
