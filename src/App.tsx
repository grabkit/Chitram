import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { MovieCard } from './components/MovieCard';
import { MovieDetailScreen } from './components/MovieDetailScreen';
import { UploadMovieScreen } from './components/UploadMovieScreen';
import { DownloadsDrawer } from './components/DownloadsDrawer';
import { Footer } from './components/Footer';
import { ALL_CATALOG_MOVIES } from './data/movies';
import { Movie, DownloadItem } from './types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  subscribeToGlobalMovies, 
  publishMovieToFirestore, 
  deleteMovieFromFirestore 
} from './services/movieService';

const MOVIES_PER_PAGE = 50;

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isUploadScreenOpen, setIsUploadScreenOpen] = useState(false);
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Real-time Cloud Movies from Firestore (Visible to EVERY user worldwide)
  const [cloudMovies, setCloudMovies] = useState<Movie[]>([]);

  // User uploaded custom movies persistence (local cache fallback)
  const [customMovies, setCustomMovies] = useState<Movie[]>(() => {
    try {
      const saved = localStorage.getItem('chitram_custom_movies');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((m: any) => ({
        ...m,
        id: m.id || `custom-${Date.now()}-${Math.random()}`,
        title: m.title || 'Untitled Movie',
        year: typeof m.year === 'number' ? m.year : 2024,
        rating: typeof m.rating === 'number' ? m.rating : 8.5,
        duration: m.duration || '2h 30m',
        quality: m.quality || '4K UHD',
        genre: Array.isArray(m.genre) ? m.genre : ['Action'],
        director: m.director || 'Director',
        cast: Array.isArray(m.cast) ? m.cast : [],
        languages: Array.isArray(m.languages) ? m.languages : ['Telugu'],
        synopsis: m.synopsis || '',
        posterUrl: m.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=700&q=80',
        backdropUrl: m.backdropUrl || m.posterUrl || '',
        videoSampleUrl: m.videoSampleUrl || 'https://www.youtube.com/embed/g3JUbg4v6gc',
        downloadSizes: m.downloadSizes || {
          '4K': '3.8 GB',
          '1080p': '1.8 GB',
          '720p': '900 MB',
          '480p': '450 MB',
        },
        downloadLinks: m.downloadLinks || {},
        downloadOptions: Array.isArray(m.downloadOptions) ? m.downloadOptions : undefined,
        extraDownloadOptions: Array.isArray(m.extraDownloadOptions) ? m.extraDownloadOptions : undefined,
        isCustom: true,
        createdAt: Number(m.createdAt) || (typeof m.id === 'string' && m.id.match(/movie-(\d+)/) ? Number(m.id.match(/movie-(\d+)/)[1]) : 0)
      }));
    } catch (e) {
      console.warn('Error reading custom movies from storage:', e instanceof Error ? e.message : String(e));
      return [];
    }
  });

  // Real-time Firestore synchronization for all worldwide users
  useEffect(() => {
    const unsubscribe = subscribeToGlobalMovies((fetchedCloudMovies) => {
      setCloudMovies(fetchedCloudMovies);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('chitram_custom_movies', JSON.stringify(customMovies));
    } catch (err) {
      console.warn('LocalStorage save failed:', err instanceof Error ? err.message : String(err));
    }
  }, [customMovies]);

  // Combined full catalog: Cloud Firestore movies + Local published cache + Default catalog
  // CRITICAL: Uploaded movies are strictly sorted so LATEST VIDEO IS ALWAYS AT THE VERY TOP
  const allMovies = useMemo(() => {
    const moviesMap = new Map<string, Movie>();

    // 1. Add local custom movies
    customMovies.forEach(m => moviesMap.set(m.id, m));

    // 2. Merge with cloud movies (preserving downloadOptions and updating)
    cloudMovies.forEach(m => {
      const existing = moviesMap.get(m.id);
      if (existing) {
        moviesMap.set(m.id, {
          ...existing,
          ...m,
          createdAt: m.createdAt || existing.createdAt || 0,
          downloadOptions: (m.downloadOptions && m.downloadOptions.length > 0) ? m.downloadOptions : existing.downloadOptions,
          downloadLinks: { ...existing.downloadLinks, ...m.downloadLinks }
        });
      } else {
        moviesMap.set(m.id, m);
      }
    });

    const userUploadedMovies = Array.from(moviesMap.values());

    // 3. Sort user uploaded movies with LATEST FIRST (highest timestamp at index 0)
    userUploadedMovies.sort((a, b) => {
      const timeA = Number(a.createdAt) || (typeof a.id === 'string' && a.id.match(/movie-(\d+)/) ? Number(a.id.match(/movie-(\d+)/)![1]) : 0);
      const timeB = Number(b.createdAt) || (typeof b.id === 'string' && b.id.match(/movie-(\d+)/) ? Number(b.id.match(/movie-(\d+)/)![1]) : 0);
      return timeB - timeA;
    });

    // Latest user-uploaded movies appear at the very TOP of the catalog, followed by defaults
    return [...userUploadedMovies, ...ALL_CATALOG_MOVIES];
  }, [cloudMovies, customMovies]);

  // Downloads persistence (safe parsing & saving)
  const [downloads, setDownloads] = useState<DownloadItem[]>(() => {
    try {
      const saved = localStorage.getItem('chitram_downloads');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('chitram_downloads', JSON.stringify(downloads));
    } catch (err) {
      console.warn('Failed to save downloads:', err instanceof Error ? err.message : String(err));
    }
  }, [downloads]);

  // Reset to page 1 and clear selected movie on new search
  const handleSearchChange = (query: string) => {
    if (query.trim() === 'Prems@3738') {
      setIsUploadScreenOpen(true);
      setSelectedMovie(null);
      setSearchQuery('');
      return;
    }

    setSearchQuery(query);
    setCurrentPage(1);
    if (query.trim()) {
      setSelectedMovie(null);
      setIsUploadScreenOpen(false);
    }
  };

  const handleOpenUpload = () => {
    setIsUploadScreenOpen(true);
    setSelectedMovie(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Publish movie both to global Firestore Cloud Database AND local cache
  const handlePublishMovie = async (newMovie: Movie) => {
    // 1. Save to local state for instantaneous feedback
    setCustomMovies(prev => [newMovie, ...prev.filter(m => m.id !== newMovie.id)]);
    
    // 2. Publish to Firebase Firestore so users worldwide can see it
    try {
      await publishMovieToFirestore(newMovie);
    } catch (err) {
      console.warn('Firebase publish error (local copy preserved):', err instanceof Error ? err.message : String(err));
      throw err;
    }
  };

  const handleDeleteCustomMovie = async (id: string) => {
    setCustomMovies(prev => prev.filter(m => m.id !== id));
    setCloudMovies(prev => prev.filter(m => m.id !== id));
    if (selectedMovie?.id === id) {
      setSelectedMovie(null);
    }

    try {
      await deleteMovieFromFirestore(id);
    } catch (err) {
      console.warn('Firebase delete warning:', err instanceof Error ? err.message : String(err));
    }
  };

  const handleAddDownload = (item: DownloadItem) => {
    setDownloads(prev => [item, ...prev.filter(d => d.id !== item.id)]);
  };

  const handleRemoveDownload = (id: string) => {
    setDownloads(prev => prev.filter(d => d.id !== id));
  };

  const handleClearAllDownloads = () => {
    setDownloads([]);
  };

  // Safe filter movies when search query is entered
  const filteredMovies = useMemo(() => {
    if (!searchQuery.trim()) return allMovies;
    const q = searchQuery.toLowerCase().trim();
    return allMovies.filter(m => {
      if (!m) return false;
      const titleMatch = typeof m.title === 'string' && m.title.toLowerCase().includes(q);
      const genreMatch = Array.isArray(m.genre) && m.genre.some(g => typeof g === 'string' && g.toLowerCase().includes(q));
      const castMatch = Array.isArray(m.cast) && m.cast.some(c => typeof c === 'string' && c.toLowerCase().includes(q));
      return titleMatch || genreMatch || castMatch;
    });
  }, [searchQuery, allMovies]);

  // Pagination calculations (50 movies per page = 10 rows of 5 movies)
  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / MOVIES_PER_PAGE));
  const startIndex = (currentPage - 1) * MOVIES_PER_PAGE;
  const currentMovies = useMemo(() => {
    return filteredMovies.slice(startIndex, startIndex + MOVIES_PER_PAGE);
  }, [filteredMovies, startIndex]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsUploadScreenOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCatalog = () => {
    setSelectedMovie(null);
    setIsUploadScreenOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Combined creator list of movies (sorted latest first)
  const creatorMoviesList = useMemo(() => {
    const map = new Map<string, Movie>();
    customMovies.forEach(m => map.set(m.id, m));
    cloudMovies.forEach(m => {
      const existing = map.get(m.id);
      if (existing) {
        map.set(m.id, {
          ...existing,
          ...m,
          createdAt: m.createdAt || existing.createdAt || 0,
          downloadOptions: (m.downloadOptions && m.downloadOptions.length > 0) ? m.downloadOptions : existing.downloadOptions,
          downloadLinks: { ...existing.downloadLinks, ...m.downloadLinks }
        });
      } else {
        map.set(m.id, m);
      }
    });
    const list = Array.from(map.values());
    list.sort((a, b) => {
      const timeA = Number(a.createdAt) || (typeof a.id === 'string' && a.id.match(/movie-(\d+)/) ? Number(a.id.match(/movie-(\d+)/)![1]) : 0);
      const timeB = Number(b.createdAt) || (typeof b.id === 'string' && b.id.match(/movie-(\d+)/) ? Number(b.id.match(/movie-(\d+)/)![1]) : 0);
      return timeB - timeA;
    });
    return list;
  }, [cloudMovies, customMovies]);

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col font-sans selection:bg-white selection:text-black">
      
      {/* Top Navigation Bar */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={handleSearchChange}
        onHomeClick={handleBackToCatalog}
        onOpenUpload={handleOpenUpload}
      />

      <main className="flex-1">
        
        {/* VIEW 1: Secret Creator Upload Screen ("Prems@3738") */}
        {isUploadScreenOpen ? (
          <UploadMovieScreen
            onBack={handleBackToCatalog}
            onPublishMovie={handlePublishMovie}
            customMovies={creatorMoviesList}
            onDeleteCustomMovie={handleDeleteCustomMovie}
          />
        ) : selectedMovie ? (
          /* VIEW 2: Dedicated Movie Detail & Player Screen */
          <MovieDetailScreen
            movie={selectedMovie}
            onBack={handleBackToCatalog}
            onSelectMovie={handleSelectMovie}
            onAddDownload={handleAddDownload}
            trendingMovies={allMovies}
          />
        ) : (
          /* VIEW 3: Standard Home & Trending Catalog */
          <>
            {/* Main Heading "Chitram" title and description */}
            {!searchQuery && <HeroSection />}

            {/* Search Results Notice */}
            {searchQuery && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-1">
                <div className="flex items-center justify-between text-xs text-neutral-300 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                  <span>Showing results for: <strong className="text-white">"{searchQuery}"</strong> ({filteredMovies.length} found)</span>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-white underline hover:text-neutral-300"
                  >
                    Clear Search
                  </button>
                </div>
              </div>
            )}

            {/* Single Section: "Trending" */}
            <section ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              
              <div className="mb-3 px-0.5">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Trending
                </h2>
              </div>

              {currentMovies.length === 0 ? (
                <div className="py-16 text-center text-neutral-500">
                  <p className="text-sm font-semibold text-neutral-300">No movies found for "{searchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-3 text-xs bg-neutral-900 border border-neutral-800 text-white px-3 py-1.5 rounded-lg hover:bg-neutral-800"
                  >
                    Reset Search
                  </button>
                </div>
              ) : (
                /* Exactly 5 movies posters per row across all devices (Mobile & Desktop) */
                <div className="grid grid-cols-5 gap-y-3.5 sm:gap-y-5 gap-x-1.5 sm:gap-x-3 md:gap-x-4">
                  {currentMovies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      onSelect={handleSelectMovie}
                    />
                  ))}
                </div>
              )}

              {/* 🌟 PAGINATION CONTROLS (Displayed when movies exceed 50) 🌟 */}
              {totalPages > 1 && (
                <div className="mt-8 pt-4 flex items-center justify-center">
                  {/* Navigation Page Numbers */}
                  <div className="flex items-center gap-1.5">
                    {/* Previous Page */}
                    <button
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600 disabled:opacity-30 disabled:pointer-events-none transition-colors text-xs flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Prev</span>
                    </button>

                    {/* Page Number Buttons */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      const isActive = currentPage === page;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-colors ${
                            isActive
                              ? 'bg-white text-black'
                              : 'bg-neutral-950 border border-neutral-800 text-neutral-300 hover:border-neutral-600 hover:text-white'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    {/* Next Page */}
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600 disabled:opacity-30 disabled:pointer-events-none transition-colors text-xs flex items-center gap-1"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

            </section>
          </>
        )}

      </main>

      {/* Simple Footer with Original Border */}
      <Footer />

      {/* Downloads Drawer (Accessible anytime from top bar) */}
      <DownloadsDrawer
        isOpen={isDownloadsOpen}
        onClose={() => setIsDownloadsOpen(false)}
        downloads={downloads}
        onPlayMovie={(movie) => {
          setIsDownloadsOpen(false);
          handleSelectMovie(movie);
        }}
        onRemoveDownload={handleRemoveDownload}
        onClearAll={handleClearAllDownloads}
      />

    </div>
  );
}
