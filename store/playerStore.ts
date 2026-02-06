import { create } from 'zustand';
import { Track } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { getAudioUrl, searchYouTubeMusic, findBestStreamMatch } from '../services/youtubeService';

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
      
      let urlToDownload = track.url;
      let durationToSave = track.duration;

      // Check if we need to resolve the URL before downloading
      const isPreview = track.duration === 30 || (track.url && track.url.includes('apple.com'));
      if (!urlToDownload || isPreview) {
          console.log(`Resolving URL for download: ${track.title}`);
          const query = `${track.artist} - ${track.title}`;
          const match = await findBestStreamMatch(query);
          if (match) {
             const resolvedUrl = await getAudioUrl(match.id);
             if (resolvedUrl) {
                 urlToDownload = resolvedUrl;
                 durationToSave = match.duration || track.duration;
             }
          }
      }

      if (!urlToDownload) throw new Error("Could not resolve URL for download");

      // Sanitize ID to be safe for filenames
      const safeId = track.id.replace(/[^a-z0-9]/gi, '_');
      const filename = `${safeId}.mp3`;
      const fileUri = MUSIC_DIR + filename;
      
      console.log(`Starting download for ${track.title} to ${fileUri}`);
      
      const downloadRes = await FileSystem.downloadAsync(urlToDownload, fileUri);
      
      console.log('Download finished', downloadRes);

      if (downloadRes.status !== 200) {
        throw new Error(`Download failed with status ${downloadRes.status}`);
      }

      const newTrack = { ...track, url: fileUri, isOffline: true, duration: durationToSave };
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
    
    // Helper to resolve track if needed
    const resolveIfNeeded = async (t: Track) => {
       const isPreview = t.duration === 30 || (t.url && t.url.includes('apple.com'));
       if ((!t.url || isPreview) && !t.isOffline) {
          // 1. Try direct ID resolution first if it looks like a YouTube ID
          if (t.id && t.id.length === 11) {
             const url = await getAudioUrl(t.id);
             if (url) {
                return { ...t, url, duration: t.duration, id: t.id };
             }
          }
          
          // 2. Fallback to search
          const query = `${t.artist} - ${t.title}`;
          const match = await findBestStreamMatch(query);
          if (match) {
             const url = await getAudioUrl(match.id);
             if (url) {
                return { ...t, url, duration: match.duration || t.duration, id: match.id };
             }
          }
       }
       return null;
    };

    if (start) {
      (async () => {
        const resolved = await resolveIfNeeded(start);
        if (resolved) {
           const { currentTrack } = get();
           // Only update if the current track hasn't changed
           if (currentTrack?.title === start.title) {
              set({ currentTrack: resolved });
           }
        }
      })();
    }
  },

  playTrack: async (track) => {
    const { library } = get();
    const offlineTrack = library.find(t => t.id === track.id);
    let trackToPlay = offlineTrack || track;

    // Check if we need to resolve the URL.
    const isPreview = trackToPlay.duration === 30 || (trackToPlay.url && trackToPlay.url.includes('apple.com'));
    const needsResolution = !trackToPlay.url || isPreview;

    if (needsResolution && !trackToPlay.isOffline) {
      console.log(`Needs resolution for: ${trackToPlay.title}`);
      let resolvedUrl: string | null = null;
      let newDuration = trackToPlay.duration;

      // 1. If ID looks like a YouTube ID (11 chars), try direct resolution first
      if (trackToPlay.id && trackToPlay.id.length === 11) {
         console.log(`Trying direct resolution for ID: ${trackToPlay.id}`);
         resolvedUrl = await getAudioUrl(trackToPlay.id);
      }

      // 2. If direct resolution failed, OR if it's not a YouTube ID, search by name
      if (!resolvedUrl) {
         const query = `${trackToPlay.artist} - ${trackToPlay.title}`;
         console.log(`Resolving stream via search for: ${query}`);
         const match = await findBestStreamMatch(query);
         if (match) {
            resolvedUrl = await getAudioUrl(match.id);
            if (resolvedUrl) {
               newDuration = match.duration || trackToPlay.duration;
            }
         }
      }

      if (resolvedUrl) {
         trackToPlay = { 
           ...trackToPlay, 
           url: resolvedUrl,
           duration: newDuration
         };
      } else {
         console.warn('Failed to resolve URL');
      }
    }

    set({ currentTrack: trackToPlay, isPlaying: true });
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
          let url = null;
          // 1. Try ID if it looks like YouTube ID
          if (next.id && next.id.length === 11) {
             url = await getAudioUrl(next.id);
          }
          
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
