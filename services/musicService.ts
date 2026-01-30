import { Track, Playlist } from '../types';

const MOCK_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Midnight City',
    artist: 'M83',
    artwork: 'https://upload.wikimedia.org/wikipedia/en/d/d0/M83_-_Midnight_City.jpg',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 243,
    album: "Hurry Up, We're Dreaming"
  },
  {
    id: '2',
    title: 'Starboy',
    artist: 'The Weeknd',
    artwork: 'https://upload.wikimedia.org/wikipedia/en/3/39/The_Weeknd_-_Starboy.png',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 230,
    album: 'Starboy'
  },
  {
    id: '3',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    artwork: 'https://upload.wikimedia.org/wikipedia/en/e/e6/The_Weeknd_-_Blinding_Lights.png',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 200,
    album: 'After Hours'
  },
  {
    id: '4',
    title: 'Levitating',
    artist: 'Dua Lipa',
    artwork: 'https://upload.wikimedia.org/wikipedia/en/f/f5/Dua_Lipa_-_Levitating.png',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration: 203,
    album: 'Future Nostalgia'
  },
  {
    id: '5',
    title: 'Hotline Bling',
    artist: 'Drake',
    artwork: 'https://upload.wikimedia.org/wikipedia/en/5/53/Drake_-_Hotline_Bling.png',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    duration: 267,
    album: 'Views'
  },
  {
    id: '6',
    title: 'Hello',
    artist: 'Adele',
    artwork: 'https://upload.wikimedia.org/wikipedia/en/1/1b/Adele_-_Hello_%28Official_Single_Cover%29.png',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    duration: 295,
    album: '25'
  },
  {
    id: '7',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    artwork: 'https://upload.wikimedia.org/wikipedia/en/4/45/Shape_Of_You_%28Official_Single_Cover%29_by_Ed_Sheeran.png',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    duration: 233,
    album: '÷'
  },
  {
    id: '8',
    title: 'Love Story',
    artist: 'Taylor Swift',
    artwork: 'https://upload.wikimedia.org/wikipedia/en/d/dc/Taylor_Swift_-_Love_Story.png',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    duration: 235,
    album: 'Fearless'
  },
  {
    id: '9',
    title: 'Billie Jean',
    artist: 'Michael Jackson',
    artwork: 'https://upload.wikimedia.org/wikipedia/en/9/93/Michael_Jackson_-_Billie_Jean.png',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    duration: 294,
    album: 'Thriller'
  }
];

const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: 'p1',
    title: 'Top Hits',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    tracks: [MOCK_TRACKS[2], MOCK_TRACKS[7], MOCK_TRACKS[9], MOCK_TRACKS[4]]
  },
  {
    id: 'p2',
    title: 'Chill Vibes',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    tracks: [MOCK_TRACKS[0], MOCK_TRACKS[3]]
  },
  {
    id: 'p3',
    title: 'Views',
    cover: 'https://upload.wikimedia.org/wikipedia/en/5/5e/Drake_-_Views_cover.jpg',
    tracks: [MOCK_TRACKS[4]]
  },
  {
    id: 'p4',
    title: '25',
    cover: 'https://upload.wikimedia.org/wikipedia/en/1/1b/Adele_-_25_%28Official_Album_Cover%29.png',
    tracks: [MOCK_TRACKS[5]]
  },
  {
    id: 'p5',
    title: 'After Hours',
    cover: 'https://upload.wikimedia.org/wikipedia/en/a/a5/The_Weeknd_-_After_Hours.png',
    tracks: [MOCK_TRACKS[2]]
  }
];

export const getHomeData = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const trendingSongs = await getTrendingSongs();
  const trendingAlbums = await getTrendingAlbums();
  const news = await getMusicNews();
  const newReleases = await getNewReleasesSongs();
  return {
    featured: MOCK_PLAYLISTS,
    newReleases,
    trendingSongs,
    trendingAlbums,
    news,
  };
};

export const searchMusic = async (query: string) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const q = query.toLowerCase().trim();
  const trackMatches = MOCK_TRACKS.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.artist.toLowerCase().includes(q) ||
    (t.album || '').toLowerCase().includes(q)
  );
  const playlistMatches = MOCK_PLAYLISTS
    .filter(p => p.title.toLowerCase().includes(q))
    .flatMap(p => p.tracks);
  const byId = new Map<string, Track>();
  [...trackMatches, ...playlistMatches].forEach(t => byId.set(t.id, t));
  return Array.from(byId.values());
};

export const getTrendingSongs = async (): Promise<Track[]> => {
  try {
    const res = await fetch('https://rss.applemarketingtools.com/api/v2/us/music/most-played/25/songs.json');
    const data = await res.json();
    const items = data?.feed?.results || [];
    return items.map((it: any, idx: number) => ({
      id: `trend-song-${it.id || idx}`,
      title: it.name,
      artist: it.artistName,
      artwork: it.artworkUrl100?.replace('100x100bb', '600x600bb'),
      url: '', // stream will be resolved via YouTube service on play
      duration: 0,
      album: it.collectionName || it.name,
    }));
  } catch {
    return MOCK_TRACKS.slice(0, 6);
  }
};

export const getTrendingAlbums = async (): Promise<Playlist[]> => {
  try {
    const res = await fetch('https://rss.applemarketingtools.com/api/v2/us/music/top-albums/25/albums.json');
    const data = await res.json();
    const items = data?.feed?.results || [];
    return items.map((it: any, idx: number) => ({
      id: `trend-album-${it.id || idx}`,
      title: it.name,
      cover: it.artworkUrl100?.replace('100x100bb', '600x600bb'),
      tracks: [], // could be populated via a secondary search when opened
    }));
  } catch {
    return MOCK_PLAYLISTS.slice(0, 2);
  }
};

export const getMusicNews = async (): Promise<{ title: string; link: string; }[]> => {
  try {
    const res = await fetch('https://www.theguardian.com/music/rss');
    const xml = await res.text();
    const items: { title: string; link: string; }[] = [];
    const regex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<\/item>/g;
    let match;
    while ((match = regex.exec(xml)) && items.length < 8) {
      items.push({ title: match[1], link: match[2] });
    }
    return items;
  } catch {
    return [
      { title: 'New releases this week', link: 'https://www.billboard.com/' },
      { title: 'Artists announce tours', link: 'https://www.rollingstone.com/music/music-news/' },
    ];
  }
};

export const getNewReleasesSongs = async (): Promise<Track[]> => {
  try {
    const res = await fetch('https://rss.applemarketingtools.com/api/v2/us/music/hot-tracks/25/songs.json');
    const data = await res.json();
    const items = data?.feed?.results || [];
    return items.slice(0, 12).map((it: any, idx: number) => ({
      id: `new-song-${it.id || idx}`,
      title: it.name,
      artist: it.artistName,
      artwork: it.artworkUrl100?.replace('100x100bb', '600x600bb'),
      url: '',
      duration: 0,
      album: it.collectionName || it.name,
    }));
  } catch {
    return MOCK_TRACKS.slice(0, 6);
  }
};
