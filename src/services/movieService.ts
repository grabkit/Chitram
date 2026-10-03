import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Movie } from '../types';

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
              videoSampleUrl: data.videoSampleUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
              downloadSizes: data.downloadSizes || {
                '4K': '3.8 GB',
                '1080p': '1.8 GB',
                '720p': '900 MB',
                '480p': '450 MB',
              },
              downloadLinks: data.downloadLinks || {},
              isCustom: true
            });
          }
        });

        // Client-side sorting by creation time (most recent first)
        fetchedMovies.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        
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

  // Strictly sanitize download links so no undefined exists
  const cleanLinks: Record<string, string> = {};
  if (movie.downloadLinks) {
    for (const [k, v] of Object.entries(movie.downloadLinks)) {
      if (v && typeof v === 'string' && v.trim()) {
        cleanLinks[k] = v.trim();
      }
    }
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
    videoSampleUrl: String(movie.videoSampleUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'),
    downloadSizes: movie.downloadSizes || {
      '4K': '3.8 GB',
      '1080p': '1.8 GB',
      '720p': '900 MB',
      '480p': '450 MB',
    },
    downloadLinks: cleanLinks,
    createdAt: Date.now()
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
