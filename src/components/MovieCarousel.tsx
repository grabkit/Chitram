import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '../types';

interface MovieCarouselProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
}

export const MovieCarousel: React.FC<MovieCarouselProps> = ({
  movies,
  onSelectMovie
}) => {
  // Only take the last 3 published movies (or fewer if fewer than 3 exist)
  const carouselMovies = movies.slice(0, 3);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  const total = carouselMovies.length;

  // Auto-advance every 5 seconds unless hovered/interacting
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 5000);

    return () => clearInterval(timer);
  }, [total, isPaused]);

  if (total === 0) return null;

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
    touchStartXRef.current = null;
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 select-none">
      {/* Carousel Card Stage Container */}
      <div
        className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-950 border border-neutral-900 shadow-2xl group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Aspect Ratio Container (Cinema Banner Aspect: ~21/9 on desktop, ~16/9 on mobile) */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[21/9] md:aspect-[2.4/1] overflow-hidden">
          {carouselMovies.map((movie, index) => {
            const isActive = index === currentIndex;
            const bgImage = movie.backdropUrl || movie.posterUrl;

            return (
              <div
                key={movie.id}
                onClick={() => onSelectMovie(movie)}
                className={`absolute inset-0 cursor-pointer transition-all duration-700 ease-out ${
                  isActive
                    ? 'opacity-100 scale-100 pointer-events-auto z-10'
                    : 'opacity-0 scale-105 pointer-events-none z-0'
                }`}
              >
                {/* Background Poster Image */}
                <img
                  src={bgImage}
                  alt={movie.title}
                  className="w-full h-full object-cover object-center"
                />

                {/* Soft Bottom Vignette for Clear Movie Name Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl sm:rounded-3xl" />

                {/* Movie Name Only (Clean & Simple) */}
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 md:p-10 flex items-end justify-between">
                  <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight line-clamp-1 drop-shadow-md">
                    {movie.title}
                  </h2>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Navigation Arrows */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous slide"
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 text-white flex items-center justify-center backdrop-blur-md transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 hover:scale-105 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next slide"
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 text-white flex items-center justify-center backdrop-blur-md transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 hover:scale-105 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </>
        )}

        {/* Carousel Indicators (3 clean dots) */}
        {total > 1 && (
          <div className="absolute bottom-3 sm:bottom-5 right-4 sm:right-8 z-20 flex items-center gap-1.5 sm:gap-2">
            {carouselMovies.map((m, idx) => {
              const active = idx === currentIndex;
              return (
                <button
                  key={`dot-${m.id}-${idx}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    active
                      ? 'w-6 sm:w-7 h-1.5 sm:h-2 bg-white shadow-sm'
                      : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
