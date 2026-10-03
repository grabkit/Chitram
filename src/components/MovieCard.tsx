import React from 'react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
  onStream?: (movie: Movie) => void;
  onDownload?: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onSelect
}) => {
  return (
    <div 
      className="flex flex-col cursor-pointer select-none"
      onClick={() => onSelect(movie)}
    >
      {/* Clean Poster with Border Radius - No Labels (No 4K, No Chitram label), No Hover Buttons/Effects */}
      <div className="relative aspect-[2/3] w-full rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Clean Movie Title & Year below poster */}
      <div className="mt-1 px-0.5">
        <h3 className="text-[11px] sm:text-xs font-semibold text-neutral-300 truncate">
          {movie.title}
        </h3>
        <p className="text-[9px] sm:text-[11px] text-neutral-500 truncate">
          {movie.year}
        </p>
      </div>
    </div>
  );
};
