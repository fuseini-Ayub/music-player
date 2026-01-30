export interface Track {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  url: string; // Stream URL (mocked or real)
  duration: number; // in seconds
  album?: string;
}

export interface Playlist {
  id: string;
  title: string;
  cover: string;
  tracks: Track[];
}

export type RepeatMode = 'off' | 'track' | 'queue';
