import { create } from 'zustand';
import { Track } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { getAudioUrl, searchYouTubeMusic } from '../services/youtubeService';

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  queueIndex: number;
  duration: number;
  position: number;
  seekTarget: number | null;
  
  // Library / Offline
  library: Track[];
  loadLibrary: () => Promise<void>;
  saveToLibrary: (track: Track) => Promise<void>;
  removeFromLibrary: (trackId: string) => Promise<void>;
  isOffline: (trackId: string) => boolean;

  // Actions
  setQueue: (tracks: Track[], startIndex?: number) => void;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  playNext: () => void;
  playPrev: () => void;
  seekTo: (position: number) => void;
  setDuration: (duration: number) => void;
  setPosition: (position: number) => void;
  resetSeekTarget: () => void;
}

const LIBRARY_KEY = 'music_library_v1';
const MUSIC_DIR = FileSystem.documentDirectory + 'music/';

async function ensureDirExists() {
  const dirInfo = await FileSystem.getInfoAsync(MUSIC_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(MUSIC_DIR, { intermediates: true });
  }
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  queue: [],
  queueIndex: -1,
  duration: 0,
  position: 0,
  seekTarget: null,
  library: [],

  loadLibrary: async () => {
    try {
      const stored = await AsyncStorage.getItem(LIBRARY_KEY);
      if (stored) {
        set({ library: JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load library', e);
    }
  },

  saveToLibrary: async (track) => {
    try {
      await ensureDirExists();
      // Sanitize ID to be safe for filenames
      const safeId = track.id.replace(/[^a-z0-9]/gi, '_');
      const filename = `${safeId}.mp3`;
      const fileUri = MUSIC_DIR + filename;
      
      console.log(`Starting download for ${track.title} to ${fileUri}`);
      
      // If we were really downloading from YouTube, we'd need a direct link.
      // Since our mock URLs are direct MP3s, we can download them.
      // In a real YT scenario, this step requires getting the stream URL first.
      
      const downloadRes = await FileSystem.downloadAsync(track.url, fileUri);
      
      console.log('Download finished', downloadRes);

      if (downloadRes.status !== 200) {
        throw new Error(`Download failed with status ${downloadRes.status}`);
      }

      const newTrack = { ...track, url: fileUri, isOffline: true };
      const { library } = get();
      
      // Avoid duplicates
      const newLibrary = [...library.filter(t => t.id !== track.id), newTrack];
      
      await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(newLibrary));
      set({ library: newLibrary });
      console.log('Saved to library:', newTrack.title);
    } catch (e) {
      console.error('Failed to save track', e);
      // In a real app, we'd show a toast here
    }
  },

  removeFromLibrary: async (trackId) => {
    try {
      const { library } = get();
      const trackToRemove = library.find(t => t.id === trackId);
      
      if (trackToRemove && trackToRemove.url.startsWith('file://')) {
        await FileSystem.deleteAsync(trackToRemove.url, { idempotent: true });
      }

      const newLibrary = library.filter(t => t.id !== trackId);
      await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(newLibrary));
      set({ library: newLibrary });
    } catch (e) {
      console.error('Failed to remove track', e);
    }
  },

  isOffline: (trackId) => {
    return get().library.some(t => t.id === trackId);
  },

  setQueue: (tracks, startIndex = 0) => {
    const start = tracks[startIndex] || null;
    set({ 
      queue: tracks, 
      queueIndex: startIndex, 
      currentTrack: start,
      isPlaying: true 
    });
    if (start && !start.url) {
      (async () => {
        let url = await getAudioUrl(start.id);
        if (!url) {
          const q = `${start.artist} ${start.title}`;
          const candidates = await searchYouTubeMusic(q);
          const best = candidates[0];
          if (best) {
            url = await getAudioUrl(best.id);
            if (url) {
              const { currentTrack } = get();
              if (currentTrack?.id === start.id) {
                set({ currentTrack: { ...start, id: best.id, artwork: start.artwork || best.artwork, url } });
              }
              return;
            }
          }
        }
        if (url) {
          const { currentTrack } = get();
          if (currentTrack?.id === start.id) {
            set({ currentTrack: { ...start, url } });
          }
        }
      })();
    }
  },

  playTrack: (track) => {
    // Check if we have an offline version
    const { library } = get();
    const offlineTrack = library.find(t => t.id === track.id);
    let trackToPlay = offlineTrack || track;
    // Resolve streaming URL lazily for faster search results
    if (!trackToPlay.url && !offlineTrack) {
      // Fire-and-forget resolution; update currentTrack when resolved
      (async () => {
        let url = await getAudioUrl(track.id);
        if (!url) {
          const q = `${track.artist} ${track.title}`;
          const candidates = await searchYouTubeMusic(q);
          const best = candidates[0];
          if (best) {
            url = await getAudioUrl(best.id);
            if (url) {
              const { currentTrack } = get();
              if (currentTrack?.id === track.id) {
                set({ currentTrack: { ...track, id: best.id, artwork: track.artwork || best.artwork, url } });
              }
              return;
            }
          }
        }
        if (url) {
          const { currentTrack } = get();
          if (currentTrack?.id === track.id) {
            set({ currentTrack: { ...track, url } });
          }
        }
      })();
    }

    set({ 
      currentTrack: trackToPlay, 
      isPlaying: true,
      queue: [trackToPlay],
      queueIndex: 0
    });
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  setIsPlaying: (isPlaying) => set({ isPlaying }),

  playNext: () => {
    const { queue, queueIndex } = get();
    if (queueIndex < queue.length - 1) {
      const next = queue[queueIndex + 1];
      set({ 
        queueIndex: queueIndex + 1, 
        currentTrack: next,
        isPlaying: true 
      });
      if (next && !next.url) {
        (async () => {
          let url = await getAudioUrl(next.id);
          if (!url) {
            const q = `${next.artist} ${next.title}`;
            const candidates = await searchYouTubeMusic(q);
            const best = candidates[0];
            if (best) {
              url = await getAudioUrl(best.id);
              if (url) {
                const { currentTrack } = get();
                if (currentTrack?.id === next.id) {
                  set({ currentTrack: { ...next, id: best.id, artwork: next.artwork || best.artwork, url } });
                }
                return;
              }
            }
          }
          if (url) {
            const { currentTrack } = get();
            if (currentTrack?.id === next.id) {
              set({ currentTrack: { ...next, url } });
            }
          }
        })();
      }
    } else {
      set({ isPlaying: false });
    }
  },

  playPrev: () => {
    const { queue, queueIndex, position } = get();
    if (position > 3000) {
       // Ideally we should just seek to 0, but for now this logic is fine
    }
    
    if (queueIndex > 0) {
      const prev = queue[queueIndex - 1];
      set({ 
        queueIndex: queueIndex - 1, 
        currentTrack: prev,
        isPlaying: true 
      });
      if (prev && !prev.url) {
        (async () => {
          let url = await getAudioUrl(prev.id);
          if (!url) {
            const q = `${prev.artist} ${prev.title}`;
            const candidates = await searchYouTubeMusic(q);
            const best = candidates[0];
            if (best) {
              url = await getAudioUrl(best.id);
              if (url) {
                const { currentTrack } = get();
                if (currentTrack?.id === prev.id) {
                  set({ currentTrack: { ...prev, id: best.id, artwork: prev.artwork || best.artwork, url } });
                }
                return;
              }
            }
          }
          if (url) {
            const { currentTrack } = get();
            if (currentTrack?.id === prev.id) {
              set({ currentTrack: { ...prev, url } });
            }
          }
        })();
      }
    }
  },

  seekTo: (position) => set({ seekTarget: position, position }), // Optimistic update
  
  setDuration: (duration) => set({ duration }),
  
  setPosition: (position) => set({ position }),

  resetSeekTarget: () => set({ seekTarget: null }),
}));
