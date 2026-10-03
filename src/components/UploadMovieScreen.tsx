import React, { useState } from 'react';
import { ArrowLeft, Upload, Film, Link as LinkIcon, Check, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Movie } from '../types';

interface UploadMovieScreenProps {
  onBack: () => void;
  onPublishMovie: (newMovie: Movie) => Promise<void> | void;
  customMovies: Movie[];
  onDeleteCustomMovie: (id: string) => void;
}

export const UploadMovieScreen: React.FC<UploadMovieScreenProps> = ({
  onBack,
  onPublishMovie,
  customMovies,
  onDeleteCustomMovie
}) => {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [rating, setRating] = useState<number>(9.0);
  const [duration, setDuration] = useState('2h 45m');
  const [quality, setQuality] = useState<'4K UHD' | '1080p' | 'IMAX 4K'>('4K UHD');
  const [genres, setGenres] = useState('Action, Thriller');
  const [director, setDirector] = useState('');
  const [cast, setCast] = useState('');
  const [languages, setLanguages] = useState('Telugu, Hindi, English');
  const [synopsis, setSynopsis] = useState('');
  
  // Media
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // Download Sizes & Links
  const [size4K, setSize4K] = useState('3.8 GB');
  const [link4K, setLink4K] = useState('');
  const [size1080p, setSize1080p] = useState('1.8 GB');
  const [link1080p, setLink1080p] = useState('');
  const [size720p, setSize720p] = useState('900 MB');
  const [link720p, setLink720p] = useState('');
  const [size480p, setSize480p] = useState('450 MB');
  const [link480p, setLink480p] = useState('');

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // File Upload Handlers (auto-compresses local files to ~40KB Data URLs to fit perfectly in Firestore and LocalStorage)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'poster' | 'backdrop') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = target === 'poster' ? 600 : 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          if (target === 'poster') {
            setPosterUrl(compressed);
          } else {
            setBackdropUrl(compressed);
          }
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter movie title');
      return;
    }

    setIsPublishing(true);
    setErrorMsg('');

    try {
      const defaultPoster = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=700&q=80';
      const finalPoster = posterUrl.trim() || defaultPoster;
      const finalBackdrop = backdropUrl.trim() || finalPoster;
      const finalVideo = videoUrl.trim() || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4';

      const newMovie: Movie = {
        id: `movie-${Date.now()}-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        title: title.trim(),
        year: Number(year) || new Date().getFullYear(),
        rating: Number(rating) || 8.5,
        duration: duration.trim() || '2h 30m',
        quality,
        genre: genres.split(',').map(g => g.trim()).filter(Boolean),
        director: director.trim() || 'Director',
        cast: cast.split(',').map(c => c.trim()).filter(Boolean),
        languages: languages.split(',').map(l => l.trim()).filter(Boolean),
        synopsis: synopsis.trim() || `${title} is now streaming in high definition.`,
        posterUrl: finalPoster,
        backdropUrl: finalBackdrop,
        videoSampleUrl: finalVideo,
        downloadSizes: {
          '4K': size4K.trim() || '3.8 GB',
          '1080p': size1080p.trim() || '1.8 GB',
          '720p': size720p.trim() || '900 MB',
          '480p': size480p.trim() || '450 MB',
        },
        downloadLinks: {
          '4K': link4K.trim() || undefined,
          '1080p': link1080p.trim() || undefined,
          '720p': link720p.trim() || undefined,
          '480p': link480p.trim() || undefined,
        },
        isCustom: true
      };

      await onPublishMovie(newMovie);
      setPublishedSuccess(true);

      // Reset Form
      setTitle('');
      setDirector('');
      setCast('');
      setSynopsis('');
      setPosterUrl('');
      setBackdropUrl('');
      setVideoUrl('');
      setLink4K('');
      setLink1080p('');
      setLink720p('');
      setLink480p('');

      setTimeout(() => {
        setPublishedSuccess(false);
      }, 7000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Cloud Sync Notice: ${msg}`);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header & Back Button */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-900 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Back"
            title="Back"
            className="inline-flex items-center justify-center p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight font-sans">
              Creator Studio
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs text-neutral-400">
                Global Cloud Sync Active • Prems@3738
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onBack}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
        >
          Done
        </button>
      </div>

      {publishedSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-neutral-950 border border-emerald-500/50 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Movie successfully published to Global Cloud! It is now live across all devices worldwide.</span>
          </div>
          <button
            onClick={onBack}
            className="text-xs underline text-white hover:text-neutral-300 font-bold ml-2 shrink-0"
          >
            View on Trending
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-3 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-200 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handlePublish} className="space-y-6">
        
        {/* Section 1: Basic Information */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 sm:p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Film className="w-4 h-4 text-white" />
            1. Movie Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-neutral-400 font-semibold mb-1">
                Movie Title <span className="text-white">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Salaar 2: Shouryaanga Parvam"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-white"
              />
            </div>

            {/* Year */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Release Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Rating (out of 10)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Duration</label>
              <input
                type="text"
                placeholder="e.g. 2h 55m"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-white"
              />
            </div>

            {/* Quality */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Quality Badge</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as any)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white"
              >
                <option value="4K UHD">4K UHD</option>
                <option value="1080p">1080p Full HD</option>
                <option value="IMAX 4K">IMAX 4K</option>
              </select>
            </div>

            {/* Genres */}
            <div className="sm:col-span-2">
              <label className="block text-neutral-400 font-semibold mb-1">
                Genres (comma separated)
              </label>
              <input
                type="text"
                placeholder="Action, Thriller, Drama"
                value={genres}
                onChange={(e) => setGenres(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-white"
              />
            </div>

            {/* Director */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Director</label>
              <input
                type="text"
                placeholder="e.g. Prashanth Neel"
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-white"
              />
            </div>

            {/* Audio Languages */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Languages (comma separated)</label>
              <input
                type="text"
                placeholder="Telugu, Hindi, English"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-white"
              />
            </div>

            {/* Cast */}
            <div className="sm:col-span-2">
              <label className="block text-neutral-400 font-semibold mb-1">Star Cast (comma separated)</label>
              <input
                type="text"
                placeholder="Prabhas, Prithviraj, Shruti Haasan"
                value={cast}
                onChange={(e) => setCast(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-white"
              />
            </div>

            {/* Synopsis */}
            <div className="sm:col-span-2">
              <label className="block text-neutral-400 font-semibold mb-1">Storyline / Synopsis</label>
              <textarea
                rows={3}
                placeholder="Enter storyline summary..."
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-white resize-none"
              />
            </div>

          </div>
        </div>

        {/* Section 2: Poster & Media */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 sm:p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-white" />
            2. Poster & Video Source
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            
            {/* Poster URL or File */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">
                Poster Image URL (or upload below)
              </label>
              <input
                type="url"
                placeholder="https://... image url"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-white mb-2"
              />
              
              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Poster File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'poster')}
                  className="hidden"
                />
              </label>
            </div>

            {/* Poster Live Preview */}
            <div className="flex items-center gap-4">
              <div className="w-20 aspect-[2/3] bg-black border border-neutral-800 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                {posterUrl ? (
                  <img src={posterUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-neutral-600 text-center px-1">Poster Preview</span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500">
                This poster will appear directly in the 5-column "Trending" grid once published.
              </p>
            </div>

            {/* Stream Video URL */}
            <div className="sm:col-span-2">
              <label className="block text-neutral-400 font-semibold mb-1">
                Video Stream URL (MP4 / WebM / HLS)
              </label>
              <input
                type="url"
                placeholder="https://... video stream url (leave blank for high quality sample)"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-white"
              />
            </div>

          </div>
        </div>

        {/* Section 3: Download Links & Sizes */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 sm:p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-white" />
            3. Movie Download Links & File Sizes
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* 4K UHD */}
            <div>
              <label className="block text-neutral-300 font-bold mb-1">4K Ultra HD File Size</label>
              <input
                type="text"
                value={size4K}
                onChange={(e) => setSize4K(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white mb-2"
              />
              <input
                type="text"
                placeholder="4K Download link (optional)"
                value={link4K}
                onChange={(e) => setLink4K(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-white"
              />
            </div>

            {/* 1080p */}
            <div>
              <label className="block text-neutral-300 font-bold mb-1">1080p Full HD File Size</label>
              <input
                type="text"
                value={size1080p}
                onChange={(e) => setSize1080p(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white mb-2"
              />
              <input
                type="text"
                placeholder="1080p Download link (optional)"
                value={link1080p}
                onChange={(e) => setLink1080p(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-white"
              />
            </div>

            {/* 720p */}
            <div>
              <label className="block text-neutral-300 font-bold mb-1">720p HD File Size</label>
              <input
                type="text"
                value={size720p}
                onChange={(e) => setSize720p(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white mb-2"
              />
              <input
                type="text"
                placeholder="720p Download link (optional)"
                value={link720p}
                onChange={(e) => setLink720p(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-white"
              />
            </div>

            {/* 480p */}
            <div>
              <label className="block text-neutral-300 font-bold mb-1">480p SD File Size</label>
              <input
                type="text"
                value={size480p}
                onChange={(e) => setSize480p(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white mb-2"
              />
              <input
                type="text"
                placeholder="480p Download link (optional)"
                value={link480p}
                onChange={(e) => setLink480p(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-white"
              />
            </div>
          </div>
        </div>

        {/* Submit Publish Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPublishing}
            className="w-full py-3.5 px-6 rounded-xl bg-white text-black font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors shadow-lg disabled:opacity-50"
          >
            <Upload className="w-4 h-4 stroke-[2.5]" />
            <span>{isPublishing ? 'Publishing to Global Cloud...' : 'Publish Movie to Trending'}</span>
          </button>
        </div>

      </form>

      {/* Previously Published Custom Movies */}
      {customMovies.length > 0 && (
        <div className="mt-12 pt-8 border-t border-neutral-900">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Your Uploaded Movies ({customMovies.length})
          </h3>
          <div className="space-y-2">
            {customMovies.map((custMovie) => (
              <div
                key={custMovie.id}
                className="flex items-center justify-between p-3 rounded-lg bg-neutral-950 border border-neutral-900 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 aspect-[2/3] bg-black rounded overflow-hidden">
                    <img src={custMovie.posterUrl} alt={custMovie.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{custMovie.title || 'Untitled'} ({custMovie.year || 2024})</h4>
                    <span className="text-neutral-400">
                      {Array.isArray(custMovie.genre) ? custMovie.genre.join(', ') : 'Action'} • {custMovie.quality || '4K UHD'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteCustomMovie(custMovie.id)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                  title="Delete Movie"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
