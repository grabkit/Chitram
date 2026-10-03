import React from 'react';
import { 
  X, 
  Bookmark, 
  Trash2, 
  Play, 
  Download, 
  Star, 
  Film
} from 'lucide-react';
import { Movie } from '../types';

interface WatchlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: Movie[];
  onRemoveFromWatchlist: (movie: Movie) => void;
  onStream: (movie: Movie) => void;
  onDownload: (movie: Movie) => void;
  onClearAll: () => void;
}

export const WatchlistDrawer: React.FC<WatchlistDrawerProps> = ({
  isOpen,
  onClose,
  watchlist,
  onRemoveFromWatchlist,
  onStream,
  onDownload,
  onClearAll
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-md bg-[#0c0e15] border-l border-gray-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-800 bg-[#090a10]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40">
              <Bookmark className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                My Watchlist
                <span className="bg-amber-500 text-black px-2 py-0.2 rounded-full text-[9px] font-black">
                  {watchlist.length}
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">Saved favorite films</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:border-[#39ff14]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {watchlist.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4 text-amber-400">
                <Bookmark className="w-8 h-8 opacity-60" />
              </div>
              <h3 className="text-sm font-bold text-gray-200">Watchlist is Empty</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                Save movies you want to watch later by clicking the bookmark icon on any poster.
              </p>
            </div>
          ) : (
            watchlist.map((movie) => (
              <div 
                key={movie.id}
                className="bg-[#121520] border border-gray-800/80 hover:border-gray-700 rounded-2xl p-3.5 flex flex-col gap-2.5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-14 aspect-[2/3] rounded-lg overflow-hidden bg-gray-900 shrink-0 border border-gray-800">
                    <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                    <span className="absolute top-0.5 left-0.5 radium-badge px-1 py-0.2 rounded text-[6px] font-black">
                      Chitram
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{movie.title}</h4>
                    {movie.teluguTitle && (
                      <p className="text-[10px] text-gray-400 truncate">{movie.teluguTitle}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                      <span className="text-[#39ff14] font-bold">★ {movie.rating}</span>
                      <span>•</span>
                      <span>{movie.year}</span>
                      <span>•</span>
                      <span className="bg-gray-800 px-1 rounded text-gray-300">{movie.quality}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveFromWatchlist(movie)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-800/60">
                  <button
                    onClick={() => {
                      onClose();
                      onStream(movie);
                    }}
                    className="py-1.5 rounded-lg bg-[#39ff14] text-black font-extrabold text-[11px] flex items-center justify-center gap-1 hover:bg-[#4aff2a] active:scale-95 shadow-[0_0_8px_rgba(57,255,20,0.5)] transition-all"
                  >
                    <Play className="w-3 h-3 fill-black" />
                    <span>Stream</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onDownload(movie);
                    }}
                    className="py-1.5 rounded-lg bg-gray-900 border border-gray-700 hover:border-[#39ff14] text-white font-bold text-[11px] flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <Download className="w-3 h-3 text-[#39ff14]" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {watchlist.length > 0 && (
          <div className="p-4 border-t border-gray-800 bg-[#090a10] flex items-center justify-between">
            <span className="text-xs text-gray-400 font-mono">
              Total: {watchlist.length} Title{watchlist.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={onClearAll}
              className="text-xs text-red-400 hover:text-red-300 font-semibold hover:underline"
            >
              Clear Watchlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
