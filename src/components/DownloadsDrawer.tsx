import React from 'react';
import { X, Download, Trash2, Play, HardDrive } from 'lucide-react';
import { DownloadItem, Movie } from '../types';

interface DownloadsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  downloads: DownloadItem[];
  onPlayMovie: (movie: Movie) => void;
  onRemoveDownload: (id: string) => void;
  onClearAll: () => void;
}

export const DownloadsDrawer: React.FC<DownloadsDrawerProps> = ({
  isOpen,
  onClose,
  downloads,
  onPlayMovie,
  onRemoveDownload,
  onClearAll
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/85 backdrop-blur-sm">
      <div 
        className="w-full max-w-sm bg-neutral-950 border-l border-neutral-800 h-full flex flex-col shadow-2xl p-4 sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-white" />
            <h2 className="text-sm font-bold text-white">Downloads ({downloads.length})</h2>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
          {downloads.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
              <HardDrive className="w-10 h-10 mb-2 opacity-40 text-neutral-400" />
              <p className="text-xs">No downloaded movies</p>
            </div>
          ) : (
            downloads.map((item) => (
              <div 
                key={item.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-10 aspect-[2/3] rounded-md overflow-hidden bg-neutral-800 shrink-0">
                    <img src={item.movie?.posterUrl || ''} alt={item.movie?.title || 'Movie'} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{item.movie?.title || 'Movie'}</h4>
                    <span className="text-[10px] text-neutral-300 font-semibold">{item.quality || '1080p'} • {item.size || '1.8 GB'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (item.movie) {
                        onClose();
                        onPlayMovie(item.movie);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-white text-black hover:bg-neutral-200"
                    title="Play"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                  </button>
                  <button
                    onClick={() => onRemoveDownload(item.id)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Clear All */}
        {downloads.length > 0 && (
          <div className="pt-3 border-t border-neutral-800 mt-2 flex justify-end">
            <button
              onClick={onClearAll}
              className="text-xs text-neutral-400 hover:text-white font-medium"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
