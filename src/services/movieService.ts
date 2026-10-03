import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Movie } from '../types';

const MOVIES_PATH = 'movies';

export function subscribeToGlobalMovies(onMoviesChange: (movies: Movie[]) => void): () => void {
  try {
    const q = query(collection(db, MOVIES_PATH), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedMovies: Movie[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedMovies.push({
            id: docSnap.id,
            title: data.title || 'Untitled',
            year: data.year || new Date().getFullYear(),
            rating: data.rating || 8.5,
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
        });
        onMoviesChange(fetchedMovies);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, MOVIES_PATH);
      }
    );

    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, MOVIES_PATH);
    return () => {};
  }
}

export async function publishMovieToFirestore(movie: Movie): Promise<void> {
  const docRef = doc(db, MOVIES_PATH, movie.id);
  const payload = {
    title: movie.title,
    year: movie.year,
    rating: movie.rating || 8.5,
    duration: movie.duration || '2h 30m',
    quality: movie.quality || '4K UHD',
    genre: movie.genre || ['Action'],
    director: movie.director || 'Director',
    cast: movie.cast || [],
    languages: movie.languages || ['Telugu'],
    synopsis: movie.synopsis || '',
    posterUrl: movie.posterUrl,
    backdropUrl: movie.backdropUrl || movie.posterUrl,
    videoSampleUrl: movie.videoSampleUrl || '',
    downloadSizes: movie.downloadSizes || {
      '4K': '3.8 GB',
      '1080p': '1.8 GB',
      '720p': '900 MB',
      '480p': '450 MB',
    },
    downloadLinks: movie.downloadLinks || {},
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
