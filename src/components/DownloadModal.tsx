import React, { useState } from 'react';
import { X, Download, CheckCircle2 } from 'lucide-react';
import { Movie, DownloadItem } from '../types';

interface DownloadModalProps {
  movie: Movie | null;
  onClose: () => void;
  onAddDownload: (item: DownloadItem) => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  movie,
  onClose,
  onAddDownload
}) => {
  const [selectedQuality, setSelectedQuality] = useState<'4K' | '1080p' | '720p' | '480p'>('1080p');
  const [downloaded, setDownloaded] = useState(false);

  if (!movie) return null;

  const handleDownload = () => {
    setDownloaded(true);

    const downloadItem: DownloadItem = {
      id: `${movie.id}-${selectedQuality}-${Date.now()}`,
      movie,
      quality: selectedQuality,
      size: movie.downloadSizes[selectedQuality],
      language: 'English / Dual Audio',
      progress: 100,
      speed: '50 MB/s',
      status: 'completed',
      timestamp: Date.now()
    };
    onAddDownload(downloadItem);

    // Trigger mock file download
    const blob = new Blob([`Chitram Movie: ${movie.title} [${selectedQuality}]`], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Chitram_${movie.title.replace(/\s+/g, '_')}_${selectedQuality}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md">
      <div 
        className="relative w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Download Movie</span>
          </div>

          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Movie Info */}
        <div className="flex items-center gap-3 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800 mb-4">
          <div className="relative w-12 aspect-[2/3] rounded-lg overflow-hidden shrink-0 border border-neutral-700">
            <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate">{movie.title}</h4>
            <p className="text-[11px] text-neutral-400 mt-0.5">{movie.year} • {movie.duration}</p>
          </div>
        </div>

        {/* Quality Options */}
        <div className="space-y-2 mb-5">
          <label className="text-xs font-semibold text-neutral-300 block">Select Resolution:</label>
          <div className="grid grid-cols-2 gap-2">
            {(['4K', '1080p', '720p', '480p'] as const).map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQuality(q)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedQuality === q
                    ? 'bg-white text-black border-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="text-xs font-bold">{q}</div>
                <div className={`text-[10px] font-medium ${selectedQuality === q ? 'text-black' : 'text-neutral-300'}`}>
                  {movie.downloadSizes[q]}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Download Action */}
        {!downloaded ? (
          <button
            onClick={handleDownload}
            className="w-full py-2.5 rounded-xl bg-white text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Download {selectedQuality} ({movie.downloadSizes[selectedQuality]})</span>
          </button>
        ) : (
          <div className="p-3 bg-neutral-900 border border-neutral-700 rounded-xl text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Download Started Successfully!</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              The file is saving to your device and added to Downloads.
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full py-2 rounded-lg bg-neutral-800 text-white text-xs font-semibold hover:bg-neutral-700"
            >
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
