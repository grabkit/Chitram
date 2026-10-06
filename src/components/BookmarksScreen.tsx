import React from 'react';
import { ArrowLeft, Bookmark, Trash2, Film } from 'lucide-react';
import { Movie } from '../types';
import { MovieCard } from './MovieCard';

interface BookmarksScreenProps {
  bookmarks: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onRemoveBookmark: (movieId: string) => void;
  onBack: () => void;
  onClearAllBookmarks?: () => void;
}

export const BookmarksScreen: React.FC<BookmarksScreenProps> = ({
  bookmarks,
  onSelectMovie,
  onRemoveBookmark,
  onBack,
  onClearAllBookmarks
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 animate-in fade-in duration-200">
      
      {/* Header Bar */}
      <div className="mb-6 flex items-center justify-between gap-3 border-b border-neutral-900 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Back"
            className="inline-flex items-center justify-center p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          </button>
          
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-white fill-white" />
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Bookmarks
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono">
              {bookmarks.length}
            </span>
          </div>
        </div>

        {bookmarks.length > 0 && onClearAllBookmarks && (
          <button
            onClick={onClearAllBookmarks}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-red-900 text-neutral-400 hover:text-red-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Clear all bookmarks"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        )}
      </div>

      {/* Bookmarks Catalog */}
      {bookmarks.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-neutral-950 border border-neutral-900 flex items-center justify-center text-neutral-600">
            <Bookmark className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white">No Bookmarks Saved</h3>
            <p className="text-xs text-neutral-400 max-w-sm mt-1">
              Click the bookmark icon under any movie to save it here for quick access anytime.
            </p>
          </div>
          <button
            onClick={onBack}
            className="mt-2 px-4 py-2 rounded-lg bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Browse Movies</span>
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-3 px-0.5 flex items-center justify-between">
            <p className="text-xs text-neutral-400">
              Showing {bookmarks.length} saved {bookmarks.length === 1 ? 'movie' : 'movies'}
            </p>
          </div>

          {/* 5 columns grid matching main catalog */}
          <div className="grid grid-cols-5 gap-y-3.5 sm:gap-y-5 gap-x-1.5 sm:gap-x-3 md:gap-x-4">
            {bookmarks.map((movie) => (
              <div key={movie.id} className="relative group/bm">
                <MovieCard
                  movie={movie}
                  onSelect={onSelectMovie}
                />
                {/* Remove bookmark overlay button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveBookmark(movie.id);
                  }}
                  title="Remove from bookmarks"
                  className="absolute top-1 right-1 p-1.5 rounded-full bg-black/80 hover:bg-red-950/90 text-neutral-400 hover:text-red-400 border border-neutral-800 transition-colors z-20 cursor-pointer opacity-90 sm:opacity-0 sm:group-hover/bm:opacity-100"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
