export interface DownloadOption {
  id: string;
  quality: string;
  size: string;
  url?: string;
}

export interface Movie {
  id: string;
  title: string;
  teluguTitle?: string;
  year: number;
  genre: string[];
  rating: number;
  duration: string;
  quality: '4K UHD' | '1080p' | 'IMAX 4K';
  posterUrl: string;
  backdropUrl: string;
  synopsis: string;
  director: string;
  cast: string[];
  languages: string[];
  downloadSizes: Record<string, string>;
  downloadLinks?: Record<string, string | undefined>;
  downloadOptions?: DownloadOption[];
  extraDownloadOptions?: DownloadOption[];
  videoSampleUrl: string;
  trailerTitle?: string;
  isCustom?: boolean;
  createdAt?: number;
}

export interface MovieRow {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  movies: Movie[];
}

export interface DownloadItem {
  id: string;
  movie: Movie;
  quality: string;
  size: string;
  language: string;
  progress: number;
  speed: string;
  status: 'downloading' | 'completed' | 'paused';
  timestamp: number;
}
