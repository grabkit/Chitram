import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Movie, DownloadOption } from '../types';

const MOVIES_PATH = 'movies';

export function subscribeToGlobalMovies(
  onMoviesChange: (movies: Movie[]) => void,
  onStatusChange?: (status: { connected: boolean; error?: string }) => void
): () => void {
  try {
    const collRef = collection(db, MOVIES_PATH);

    const unsubscribe = onSnapshot(
      collRef,
      (snapshot) => {
        const fetchedMovies: Movie[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.title) {
            const rawDownloadLinks = data.downloadLinks && typeof data.downloadLinks === 'object' ? data.downloadLinks : {};
            
            // Reconstruct downloadOptions array safely
            let options: DownloadOption[] | undefined = undefined;
            if (Array.isArray(data.downloadOptions) && data.downloadOptions.length > 0) {
              options = data.downloadOptions.map((opt: any, index: number) => ({
                id: String(opt.id || `opt-${index}`),
                quality: String(opt.quality || ''),
                size: String(opt.size || '1.5 GB'),
                url: String(opt.url || rawDownloadLinks[opt.quality] || '')
              }));
            }

            // Extract accurate timestamp (from data.createdAt or document ID timestamp)
            let timestamp = Number(data.createdAt);
            if (!timestamp || isNaN(timestamp)) {
              const match = docSnap.id.match(/movie-(\d+)/);
              timestamp = match && match[1] ? Number(match[1]) : 0;
            }

            fetchedMovies.push({
              id: docSnap.id,
              title: data.title || 'Untitled',
              year: Number(data.year) || new Date().getFullYear(),
              rating: Number(data.rating) || 8.5,
              duration: data.duration || '2h 30m',
              quality: data.quality || '4K UHD',
              genre: Array.isArray(data.genre) ? data.genre : ['Action'],
              director: data.director || 'Director',
              cast: Array.isArray(data.cast) ? data.cast : [],
              languages: Array.isArray(data.languages) ? data.languages : ['Telugu'],
              synopsis: data.synopsis || '',
              posterUrl: data.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=700&q=80',
              backdropUrl: data.backdropUrl || data.posterUrl || '',
              videoSampleUrl: data.videoSampleUrl || 'https://www.youtube.com/embed/g3JUbg4v6gc',
              downloadUrl: data.downloadUrl || data.downloadLink || (options && options[0]?.url) || undefined,
              downloadSizes: data.downloadSizes || {
                '4K': '3.8 GB',
                '1080p': '1.8 GB',
                '720p': '900 MB',
                '480p': '450 MB',
              },
              downloadLinks: rawDownloadLinks,
              downloadOptions: options,
              extraDownloadOptions: Array.isArray(data.extraDownloadOptions) ? data.extraDownloadOptions : undefined,
              isDubbed: Boolean(data.isDubbed),
              isCustom: true,
              createdAt: timestamp
            });
          }
        });

        // Client-side sorting by creation time: LATEST FIRST (descending)
        fetchedMovies.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
        
        onMoviesChange(fetchedMovies);
        onStatusChange?.({ connected: true });
      },
      (error) => {
        const msg = error instanceof Error ? error.message : String(error);
        console.warn('Firestore subscription status:', msg);
        onStatusChange?.({ connected: false, error: msg });
        handleFirestoreError(error, OperationType.LIST, MOVIES_PATH);
      }
    );

    return unsubscribe;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    onStatusChange?.({ connected: false, error: msg });
    handleFirestoreError(error, OperationType.LIST, MOVIES_PATH);
    return () => {};
  }
}

export async function publishMovieToFirestore(movie: Movie): Promise<void> {
  const docRef = doc(db, MOVIES_PATH, movie.id);

  // 1. Strictly sanitize download links map (no undefined values for Firestore)
  const cleanLinks: Record<string, string> = {};
  if (movie.downloadLinks && typeof movie.downloadLinks === 'object') {
    for (const [k, v] of Object.entries(movie.downloadLinks)) {
      if (v && typeof v === 'string' && v.trim()) {
        cleanLinks[k.trim()] = v.trim();
      }
    }
  }

  // 2. Also populate cleanLinks from downloadOptions
  if (Array.isArray(movie.downloadOptions)) {
    movie.downloadOptions.forEach(opt => {
      if (opt.quality && opt.url && typeof opt.url === 'string' && opt.url.trim()) {
        cleanLinks[opt.quality.trim()] = opt.url.trim();
      }
    });
  }

  // 3. Strictly sanitize downloadOptions array (NO undefined properties anywhere)
  const cleanOptions: Array<{ id: string; quality: string; size: string; url: string }> = [];
  if (Array.isArray(movie.downloadOptions)) {
    movie.downloadOptions.forEach((opt, idx) => {
      const q = String(opt.quality || '').trim();
      if (q) {
        cleanOptions.push({
          id: String(opt.id || `opt-${idx}`),
          quality: q,
          size: String(opt.size || '1.5 GB').trim(),
          url: String(opt.url || cleanLinks[q] || '').trim() // ALWAYS string, never undefined!
        });
      }
    });
  }

  const payload = {
    title: String(movie.title || 'Untitled'),
    year: Number(movie.year) || new Date().getFullYear(),
    rating: Number(movie.rating) || 8.5,
    duration: String(movie.duration || '2h 30m'),
    quality: String(movie.quality || '4K UHD'),
    genre: Array.isArray(movie.genre) && movie.genre.length > 0 ? movie.genre : ['Action'],
    director: String(movie.director || 'Director'),
    cast: Array.isArray(movie.cast) ? movie.cast : [],
    languages: Array.isArray(movie.languages) && movie.languages.length > 0 ? movie.languages : ['Telugu'],
    synopsis: String(movie.synopsis || ''),
    posterUrl: String(movie.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=700&q=80'),
    backdropUrl: String(movie.backdropUrl || movie.posterUrl || ''),
    videoSampleUrl: String(movie.videoSampleUrl || 'https://www.youtube.com/embed/g3JUbg4v6gc'),
    downloadUrl: String(movie.downloadUrl || (cleanOptions[0]?.url) || '').trim(),
    downloadSizes: movie.downloadSizes || {
      '4K': '3.8 GB',
      '1080p': '1.8 GB',
      '720p': '900 MB',
      '480p': '450 MB',
    },
    downloadLinks: cleanLinks,
    downloadOptions: cleanOptions,
    extraDownloadOptions: Array.isArray(movie.extraDownloadOptions) ? movie.extraDownloadOptions : [],
    isDubbed: Boolean(movie.isDubbed),
    createdAt: Number(movie.createdAt) || Date.now()
  };

  try {
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${MOVIES_PATH}/${movie.id}`);
    throw error;
  }
}

export async function deleteMovieFromFirestore(movieId: string): Promise<void> {
  const docRef = doc(db, MOVIES_PATH, movieId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${MOVIES_PATH}/${movieId}`);
    throw error;
  }
}
