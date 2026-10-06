import React, { useState } from 'react';
import { ArrowLeft, Upload, Film, Link as LinkIcon, Check, Image as ImageIcon, Trash2, Plus, Edit3, X } from 'lucide-react';
import { Movie, DownloadOption } from '../types';

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
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [duration, setDuration] = useState('2h 45m');
  const [quality, setQuality] = useState<'4K UHD' | '1080p' | 'IMAX 4K'>('4K UHD');
  const [imdbUrl, setImdbUrl] = useState('');
  const [isDubbed, setIsDubbed] = useState(false);
  
  // Media
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

  // Dynamic Download Options (Full freedom: custom quality, custom size, add and remove options)
  const [downloadOptions, setDownloadOptions] = useState<DownloadOption[]>([
    { id: 'opt-4k', quality: '4K Ultra HD', size: '3.8 GB', url: '' },
    { id: 'opt-1080p', quality: '1080p Full HD', size: '1.8 GB', url: '' },
    { id: 'opt-720p', quality: '720p HD', size: '900 MB', url: '' },
    { id: 'opt-480p', quality: '480p SD', size: '450 MB', url: '' }
  ]);

  const handleAddOption = (preset?: { quality: string; size: string }) => {
    setDownloadOptions(prev => [
      ...prev,
      {
        id: `opt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        quality: preset?.quality || '',
        size: preset?.size || '1.5 GB',
        url: ''
      }
    ]);
  };

  const handleRemoveOption = (id: string) => {
    setDownloadOptions(prev => prev.filter(opt => opt.id !== id));
  };

  const handleUpdateOption = (id: string, field: 'quality' | 'size' | 'url', value: string) => {
    setDownloadOptions(prev => prev.map(opt => opt.id === id ? { ...opt, [field]: value } : opt));
  };

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load existing custom movie into form for editing
  const handleEditMovie = (m: Movie) => {
    setEditingMovieId(m.id);
    setTitle(m.title || '');
    setYear(m.year || new Date().getFullYear());
    setDuration(m.duration || '2h 30m');
    setQuality(m.quality || '4K UHD');
    setImdbUrl(m.imdbUrl || '');
    setIsDubbed(Boolean(m.isDubbed));
    setPosterUrl(m.posterUrl || '');
    setBackdropUrl(m.backdropUrl || '');
    setVideoUrl(m.videoSampleUrl || '');
    setDownloadUrl(m.downloadUrl || m.downloadOptions?.[0]?.url || m.downloadLinks?.['4K'] || m.downloadLinks?.['1080p'] || '');

    if (m.downloadOptions && m.downloadOptions.length > 0) {
      setDownloadOptions(m.downloadOptions.map(opt => ({
        id: opt.id,
        quality: opt.quality,
        size: opt.size,
        url: opt.url || m.downloadLinks?.[opt.quality] || ''
      })));
    } else {
      // Build from downloadSizes & extraDownloadOptions
      const opts: DownloadOption[] = [];
      const stdQuals = ['4K', '1080p', '720p', '480p'];
      stdQuals.forEach(q => {
        if (m.downloadSizes?.[q]) {
          opts.push({
            id: `opt-${q.toLowerCase()}`,
            quality: q === '4K' ? '4K Ultra HD' : q === '1080p' ? '1080p Full HD' : q === '720p' ? '720p HD' : '480p SD',
            size: m.downloadSizes[q],
            url: m.downloadLinks?.[q] || ''
          });
        }
      });
      if (m.extraDownloadOptions && m.extraDownloadOptions.length > 0) {
        opts.push(...m.extraDownloadOptions);
      }
      setDownloadOptions(opts.length > 0 ? opts : [
        { id: 'opt-4k', quality: '4K Ultra HD', size: '3.8 GB', url: '' },
        { id: 'opt-1080p', quality: '1080p Full HD', size: '1.8 GB', url: '' }
      ]);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingMovieId(null);
    setTitle('');
    setImdbUrl('');
    setIsDubbed(false);
    setPosterUrl('');
    setBackdropUrl('');
    setVideoUrl('');
    setDownloadUrl('');
    setDownloadOptions([
      { id: 'opt-4k', quality: '4K Ultra HD', size: '3.8 GB', url: '' },
      { id: 'opt-1080p', quality: '1080p Full HD', size: '1.8 GB', url: '' },
      { id: 'opt-720p', quality: '720p HD', size: '900 MB', url: '' },
      { id: 'opt-480p', quality: '480p SD', size: '450 MB', url: '' }
    ]);
  };

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
      const finalVideo = videoUrl.trim() || 'https://www.youtube.com/embed/g3JUbg4v6gc';

      const cleanDownload = downloadUrl.trim();

      // Build download options and compatibility maps
      const validOptions: DownloadOption[] = [
        {
          id: 'opt-main',
          quality,
          size: '1.8 GB',
          url: cleanDownload
        }
      ];

      const downloadSizesMap: Record<string, string> = { [quality]: '1.8 GB' };
      const downloadLinksMap: Record<string, string> = cleanDownload ? { [quality]: cleanDownload } : {};

      const movieId = editingMovieId || `movie-${Date.now()}-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

      const newMovie: Movie = {
        id: movieId,
        title: title.trim(),
        year: Number(year) || new Date().getFullYear(),
        duration: duration.trim() || '2h 30m',
        quality,
        languages: ['Telugu'],
        imdbUrl: imdbUrl.trim() || undefined,
        posterUrl: finalPoster,
        backdropUrl: finalBackdrop,
        videoSampleUrl: finalVideo,
        downloadUrl: cleanDownload,
        downloadSizes: downloadSizesMap,
        downloadLinks: downloadLinksMap,
        downloadOptions: validOptions,
        isDubbed: Boolean(isDubbed),
        isCustom: true,
        createdAt: editingMovieId
          ? (customMovies.find(m => m.id === editingMovieId)?.createdAt || Date.now())
          : Date.now()
      };

      await onPublishMovie(newMovie);
      setPublishedSuccess(true);
      setEditingMovieId(null);

      // Reset Form
      setTitle('');
      setImdbUrl('');
      setIsDubbed(false);
      setPosterUrl('');
      setBackdropUrl('');
      setVideoUrl('');
      setDownloadUrl('');

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
            className="inline-flex items-center justify-center p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-white transition-colors cursor-pointer"
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
                Global Cloud Sync Active
              </p>
            </div>
          </div>
        </div>

        {editingMovieId && (
          <button
            onClick={handleCancelEdit}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:border-white text-xs text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel Edit</span>
          </button>
        )}
      </div>

      {editingMovieId && (
        <div className="mb-6 p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Editing Movie: <strong className="text-white">{title || 'Selected Movie'}</strong>. Make your changes and click Update below.</span>
          </div>
          <button
            onClick={handleCancelEdit}
            className="text-amber-400 underline hover:text-amber-200 shrink-0"
          >
            Reset Form
          </button>
        </div>
      )}

      {/* Notifications */}
      {publishedSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center gap-3 text-emerald-300 text-xs font-semibold animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            {editingMovieId ? 'Movie updated successfully in Trending catalog!' : 'Movie published successfully to Global Cloud! Visible in Trending catalog immediately.'}
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* Main Upload / Edit Form */}
      <form onSubmit={handlePublish} className="space-y-6">
        
        {/* Section 1: Basic Metadata */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 sm:p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Film className="w-4 h-4 text-white" />
            1. Movie Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-neutral-400 font-semibold mb-1">Movie Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Salaar: Part 1 – Ceasefire"
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
                min="1950"
                max="2035"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white"
              />
            </div>

            {/* Duration / Time */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Duration / Time</label>
              <input
                type="text"
                placeholder="2h 45m"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-white"
              />
            </div>

            {/* Quality Badge */}
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

            {/* Language Note */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Language</label>
              <div className="w-full bg-black/60 border border-neutral-800/80 rounded-lg px-3 py-2 text-neutral-300 flex items-center justify-between">
                <span className="font-semibold text-white">Telugu</span>
                <span className="text-[10px] text-neutral-500 uppercase font-mono">Always Telugu</span>
              </div>
            </div>

            {/* IMDb Link (Optional) */}
            <div className="sm:col-span-2">
              <label className="block text-neutral-400 font-semibold mb-1 flex items-center justify-between">
                <span>IMDb Link (Optional)</span>
                <span className="text-[10px] text-neutral-500 font-normal">If blank, defaults to IMDb search</span>
              </label>
              <input
                type="url"
                placeholder="https://www.imdb.com/title/tt... or leave blank"
                value={imdbUrl}
                onChange={(e) => setImdbUrl(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-white"
              />
            </div>

            {/* Dubbed Movie Toggle */}
            <div className="sm:col-span-2 pt-1">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-colors">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs sm:text-sm">Dubbed Movie (Telugu Dubbed)</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isDubbed ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {isDubbed ? 'DUBBED ON' : 'OFF'}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400 mt-1">
                    Turn this ON to mark this movie as a Dubbed movie. It will show in the dedicated "Dubbed" section!
                  </span>
                </div>
                <div className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    checked={isDubbed}
                    onChange={(e) => setIsDubbed(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </div>
              </label>
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
                Poster Image URL (or upload file)
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

            {/* Stream Video URL or Embed */}
            <div className="sm:col-span-2">
              <label className="block text-neutral-300 font-bold mb-1">
                Video Stream URL or Embed Link / &lt;iframe&gt; / Webtor Snippet
              </label>
              <textarea
                rows={2}
                placeholder="Paste video stream link, Webtor magnet code snippet, YouTube URL, Google Drive preview link, or <iframe src='...'></iframe>"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-white font-mono text-xs resize-none"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Supports: Webtor &lt;video&gt; code snippets, Magnet Links, YouTube, Google Drive, Streamwish, Filemoon, Dailymotion, Vimeo, or Direct MP4 files.
              </p>
            </div>

          </div>
        </div>

        {/* Section 3: Movie Download Link */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-white" />
              <span>3. Movie Download Link</span>
            </h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Paste the download link for the movie. When users click Download on the streaming page, a 3-second loading spinner runs and this link downloads directly.
            </p>
          </div>

          <div>
            <label className="block text-neutral-300 font-semibold mb-1 flex items-center justify-between text-xs">
              <span>Movie Download URL (Direct MP4, Google Drive, or Magnet)</span>
              <span className="text-[10px] text-emerald-400 font-normal">Direct MP4/Drive links download with zero apps needed</span>
            </label>
            <input
              type="text"
              placeholder="e.g. https://... direct .mp4 or Google Drive link or magnet:?xt=urn:..."
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-white font-mono text-xs"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              Note: If left blank, the Download button on the movie page will appear disabled.
            </p>
          </div>
        </div>

        {/* Submit Publish / Update Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPublishing}
            className="w-full py-3.5 px-6 rounded-xl bg-white text-black font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors shadow-lg disabled:opacity-50 cursor-pointer"
          >
            <Upload className="w-4 h-4 stroke-[2.5]" />
            <span>
              {isPublishing
                ? 'Saving to Global Cloud...'
                : editingMovieId
                ? 'Update Movie in Trending'
                : 'Publish Movie to Trending'}
            </span>
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-white">{custMovie.title || 'Untitled'} ({custMovie.year || 2024})</h4>
                      {custMovie.isDubbed && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold uppercase">
                          Dubbed
                        </span>
                      )}
                    </div>
                    <span className="text-neutral-400">
                      {Array.isArray(custMovie.genre) ? custMovie.genre.join(', ') : 'Action'} • {custMovie.quality || '4K UHD'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEditMovie(custMovie)}
                    className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Edit Movie"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Edit</span>
                  </button>

                  <button
                    onClick={() => onDeleteCustomMovie(custMovie.id)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-900 transition-colors cursor-pointer"
                    title="Delete Movie"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
