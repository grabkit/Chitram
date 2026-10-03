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
  downloadSizes: {
    '4K': string;
    '1080p': string;
    '720p': string;
    '480p': string;
  };
  downloadLinks?: {
    '4K'?: string;
    '1080p'?: string;
    '720p'?: string;
    '480p'?: string;
  };
  videoSampleUrl: string;
  trailerTitle?: string;
  isCustom?: boolean;
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
  quality: '4K' | '1080p' | '720p' | '480p';
  size: string;
  language: string;
  progress: number;
  speed: string;
  status: 'downloading' | 'completed' | 'paused';
  timestamp: number;
}
