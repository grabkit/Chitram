import React from 'react';
import { Movie, MovieRow } from '../types';
import { MovieCard } from './MovieCard';

interface MovieRowSectionProps {
  row: MovieRow;
  index: number;
  onSelect: (movie: Movie) => void;
  onStream: (movie: Movie) => void;
  onDownload: (movie: Movie) => void;
}

export const MovieRowSection: React.FC<MovieRowSectionProps> = ({
  row,
  onSelect,
  onStream,
  onDownload
}) => {
  return (
    <section className="py-3.5 border-b border-neutral-900">
      
      {/* Clean Category Title - No Row Numbers/Texts (Row 1, 2, 3 removed as requested) */}
      <div className="mb-2 px-0.5">
        <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
          {row.title}
        </h2>
      </div>

      {/* Strictly 5 Movie Posters in each row - Identical on Mobile and Desktop */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-3 md:gap-4">
        {row.movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onSelect={onSelect}
            onStream={onStream}
            onDownload={onDownload}
          />
        ))}
      </div>

    </section>
  );
};
