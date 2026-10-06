import React from 'react';
import { X, Download } from 'lucide-react';
import { Movie } from '../types';

interface StreamModalProps {
  movie: Movie | null;
  onClose: () => void;
  onDownload: (movie: Movie) => void;
}

export const StreamModal: React.FC<StreamModalProps> = ({
  movie,
  onClose,
  onDownload
}) => {
  if (!movie) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md">
      <div 
        className="relative w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-black">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
              {movie.title} ({movie.year})
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full bg-neutral-900 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video w-full bg-black">
          <video
            src={movie.videoSampleUrl}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
        </div>

        {/* Info & Download Button - Black & White */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black">
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
              {movie.rating != null && (
                <>
                  <span className="text-white font-bold">★ {movie.rating}</span>
                  <span>•</span>
                </>
              )}
              <span>{movie.duration}</span>
              <span>•</span>
              <span className="text-white font-semibold">{movie.quality}</span>
              {movie.genre && movie.genre.length > 0 && (
                <>
                  <span>•</span>
                  <span>{movie.genre.join(', ')}</span>
                </>
              )}
            </div>
            {movie.synopsis && (
              <p className="text-xs sm:text-sm text-neutral-300 max-w-xl line-clamp-2">
                {movie.synopsis}
              </p>
            )}
          </div>

          <button
            onClick={() => {
              onClose();
              onDownload(movie);
            }}
            className="py-2 px-4 rounded-lg bg-white text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:bg-neutral-200 transition-colors shrink-0"
          >
            <Download className="w-4 h-4 text-black stroke-[2.5]" />
            <span>Download</span>
          </button>
        </div>

      </div>
    </div>
  );
};
