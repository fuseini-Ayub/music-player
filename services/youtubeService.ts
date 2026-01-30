import { Track } from '../types';
import { searchMusic as fallbackSearch } from './musicService';

const INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://piped.video',
  'https://piped.us.projectsegfau.lt',
  'https://piped.mha.fi',
  'https://piped.projectsegfau.lt'
];

const INVIDIOUS = [
  'https://yewtu.be/api/v1',
  'https://inv.nadeko.net/api/v1',
  'https://invidious.tiekoetter.com/api/v1'
];

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function tryFetchJson(urls: string[]): Promise<any> {
  for (const url of urls) {
    try {
      return await fetchJson(url);
    } catch {
      continue;
    }
  }
  throw new Error('All endpoints failed');
}

function first<T>(arr: T[]): T | null {
  return Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
}

function extractChannelId(input?: string): string | null {
  if (!input) return null;
  const s = String(input);
  const m1 = s.match(/\/channel\/(UC[0-9A-Za-z_\-]+)/);
  if (m1 && m1[1]) return m1[1];
  const m2 = s.match(/(UC[0-9A-Za-z_\-]+)/);
  if (m2 && m2[1]) return m2[1];
  return null;
}

function isValidUrl(u: string | undefined | null): boolean {
  if (!u) return false;
  const s = String(u).trim();
  if (!/^https?:\/\//i.test(s)) return false;
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

async function resolveAudioUrl(instance: string, videoId: string): Promise<string | null> {
  const data = await fetchJson(`${instance}/streams/${encodeURIComponent(videoId)}`);
  const streams = data?.audioStreams || [];
  const preferred = streams.filter((s: any) => {
    const c = (s.container || '').toLowerCase();
    return c === 'm4a' || c === 'mp4';
  });
  const list = preferred.length ? preferred : streams;
  const best = list.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];
  const u = best?.url || best?.proxyUrl || null;
  return isValidUrl(u) ? (u as string) : null;
}

async function resolveAudioUrlAcrossInstances(videoId: string): Promise<string | null> {
  const attempts = INSTANCES.map(async (base) => {
    try {
      const url = await resolveAudioUrl(base, videoId);
      return isValidUrl(url) ? (url as string) : null;
    } catch {
      return null;
    }
  });
  const results = await Promise.all(attempts);
  return results.find((u) => !!u) || null;
}

async function fetchChannelVideos(instance: string, channelId: string): Promise<any[]> {
  const data = await fetchJson(`${instance}/channel/${encodeURIComponent(channelId)}`);
  const related = data?.relatedStreams || [];
  const latest = data?.latestVideos || [];
  return (related.length ? related : latest).filter((i: any) => {
    const t = String(i.type || 'stream').toLowerCase();
    return t === 'stream' || t === 'video';
  });
}

async function fetchPlaylistVideos(instance: string, playlistId: string): Promise<any[]> {
  const data = await fetchJson(`${instance}/playlist/${encodeURIComponent(playlistId)}`);
  const related = data?.relatedStreams || [];
  return related.filter((i: any) => {
    const t = String(i.type || 'stream').toLowerCase();
    return t === 'stream' || t === 'video';
  });
}

async function fetchChannelVideosAcrossInstances(channelId: string): Promise<any[]> {
  const calls = INSTANCES.map((base) => fetchChannelVideos(base, channelId));
  const settled = await Promise.allSettled(calls);
  for (const r of settled) {
    if (r.status === 'fulfilled' && Array.isArray(r.value) && r.value.length) {
      return r.value.slice(0, 25);
    }
  }
  return [];
}

async function fetchPlaylistVideosAcrossInstances(playlistId: string): Promise<any[]> {
  const calls = INSTANCES.map((base) => fetchPlaylistVideos(base, playlistId));
  const settled = await Promise.allSettled(calls);
  for (const r of settled) {
    if (r.status === 'fulfilled' && Array.isArray(r.value) && r.value.length) {
      return r.value.slice(0, 25);
    }
  }
  return [];
}

async function fetchInvidiousChannelVideos(channelId: string): Promise<any[]> {
  for (const base of INVIDIOUS) {
    try {
      const data = await fetchJson(`${base}/channels/${encodeURIComponent(channelId)}`);
      const vids = Array.isArray(data?.latestVideos) ? data.latestVideos : [];
      return vids;
    } catch {
      continue;
    }
  }
  return [];
}

async function searchInvidiousChannels(query: string): Promise<any[]> {
  for (const base of INVIDIOUS) {
    try {
      const data = await fetchJson(`${base}/search?q=${encodeURIComponent(query)}&type=channel`);
      const items = Array.isArray(data) ? data : [];
      if (items.length) return items;
    } catch {
      continue;
    }
  }
  return [];
}
async function pipedSearch(instance: string, q: string): Promise<any[]> {
  const primary = `${instance}/search?q=${encodeURIComponent(q)}`;
  try {
    const data = await fetchJson(primary);
    const items = Array.isArray(data) ? data : data.items || [];
    if (items.length) return items;
  } catch {}
  const endpoints = [
    `${instance}/search?q=${encodeURIComponent(q)}&filter=music_songs`,
    `${instance}/search?q=${encodeURIComponent(q)}&filter=music_albums`,
    `${instance}/search?q=${encodeURIComponent(q)}&filter=channels`,
  ];
  const res = await Promise.allSettled(endpoints.map(fetchJson));
  for (const r of res) {
    if (r.status === 'fulfilled') {
      const items = Array.isArray(r.value) ? r.value : r.value.items || [];
      if (items.length) return items;
    }
  }
  return [];
}

async function pipedSearchAcrossInstances(q: string): Promise<any[]> {
  const calls = INSTANCES.map((base) => pipedSearch(base, q));
  const settled = await Promise.allSettled(calls);
  const all: any[] = [];
  for (const r of settled) {
    if (r.status === 'fulfilled' && Array.isArray(r.value) && r.value.length) {
      all.push(...r.value);
    }
  }
  const seen = new Set<string>();
  const dedup = all.filter((i: any) => {
    const id = i.id || i.videoId || i.url || i.title;
    if (!id) return true;
    const key = String(id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return dedup;
}

function mapItemToTrack(instance: string, item: any): Track | null {
  const id = item.id || item.videoId || item.url?.split('=')[1];
  if (!id) return null;
  const title = item.title || '';
  const artist = item.uploaderName || item.author || item.channelName || 'Unknown Artist';
  const thumbnail = item.thumbnail || item.thumbnails?.[0]?.url || `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  const duration = item.duration || item.lengthSeconds || 0;
  return {
    id,
    title,
    artist,
    artwork: thumbnail,
    url: '',
    duration,
    album: item.album || undefined,
  };
}

function mapInvidiousItemToTrack(item: any): Track | null {
  const id = item.videoId || item.id;
  if (!id) return null;
  const title = item.title || '';
  const artist = item.author || 'Unknown Artist';
  const tn = Array.isArray(item.videoThumbnails) ? item.videoThumbnails[0]?.url : undefined;
  const thumbnail = tn || `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  const duration = item.lengthSeconds || item.duration || 0;
  return {
    id,
    title,
    artist,
    artwork: thumbnail,
    url: '',
    duration,
    album: undefined,
  };
}

async function searchInvidious(query: string): Promise<Track[]> {
  for (const base of INVIDIOUS) {
    try {
      const data = await fetchJson(`${base}/search?q=${encodeURIComponent(query)}&type=video`);
      const items = Array.isArray(data) ? data : [];
      const videos = items.filter((i: any) => (i.type || 'video') === 'video');
      if (!videos.length) continue;
      const mapped = videos.slice(0, 25).map(mapInvidiousItemToTrack).filter(Boolean) as Track[];
      return mapped;
    } catch {
      continue;
    }
  }
  return [];
}

async function searchITunes(query: string): Promise<Track[]> {
  try {
    const data = await fetchJson(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=25`);
    const items = Array.isArray(data?.results) ? data.results : [];
    const mapped = items.map((it: any) => {
      const id = String(it.trackId);
      const title = it.trackName;
      const artist = it.artistName;
      const artwork = (it.artworkUrl100 || '').replace('100x100bb.jpg', '600x600bb.jpg');
      const url = it.previewUrl || '';
      const duration = Math.round((it.trackTimeMillis || 0) / 1000);
      const album = it.collectionName;
      const t: Track = { id, title, artist, artwork, url, duration, album };
      return t;
    }).filter((t: Track) => !!t.url);
    return mapped;
  } catch {
    return [];
  }
}

export const searchYouTubeMusic = async (query: string): Promise<Track[]> => {
  const q = query.trim();
  if (!q) return [];

  let instance = first(INSTANCES) as string;
  for (const base of INSTANCES) {
    try {
      await fetchJson(`${base}/status`);
      instance = base;
      break;
    } catch {
      continue;
    }
  }

  let results: any = [];
  try {
    const items = await pipedSearchAcrossInstances(q);
    const typeOf = (i: any) => String(i.type || 'stream').toLowerCase();
    const streams = items.filter((i: any) => {
      const t = typeOf(i);
      return t === 'stream' || t === 'video';
    });
    const channels = items.filter((i: any) => typeOf(i) === 'channel');
    const playlists = items.filter((i: any) => typeOf(i) === 'playlist');

    if (streams.length) {
      results = streams.slice(0, 25);
    } else if (playlists.length) {
      const pl = playlists[0];
      const playlistId = pl.id || pl.playlistId || pl.url?.split('list=')[1];
      const plVideos = playlistId ? await fetchPlaylistVideosAcrossInstances(playlistId) : [];
      results = plVideos.slice(0, 25);
    } else if (channels.length) {
      const ch = channels[0];
      const channelId = ch.id || ch.channelId || extractChannelId(ch.url);
      let chVideos: any[] = [];
      if (channelId) {
        chVideos = await fetchChannelVideosAcrossInstances(channelId);
        if (!chVideos.length) {
          chVideos = await fetchInvidiousChannelVideos(channelId);
        }
      } else {
        const chItems = await searchInvidiousChannels(q);
        const cid = chItems[0]?.authorId || chItems[0]?.id;
        if (cid) chVideos = await fetchInvidiousChannelVideos(cid);
      }
      results = chVideos.slice(0, 25);
    } else {
      results = [];
    }
  } catch {
    results = [];
  }

  const mapped = results
    .map((item: any) => mapItemToTrack(instance, item))
    .filter(Boolean) as Track[];
  if (mapped.length) return mapped;

  const inv = await searchInvidious(q);
  if (inv.length) return inv;

  const apple = await searchITunes(q);
  if (apple.length) return apple;

  return await fallbackSearch(q);
};

export const getSuggestions = async (query: string): Promise<string[]> => {
  const q = query.trim();
  if (!q) return [];
  const suggestions = new Set<string>();
  try {
    const apple = await fetchJson(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song,musicArtist&limit=8`);
    const items = Array.isArray(apple?.results) ? apple.results : [];
    items.forEach((it: any) => {
      const artist = it.artistName;
      const title = it.trackName;
      if (artist && title) suggestions.add(`${artist} - ${title}`);
      if (artist) suggestions.add(artist);
    });
  } catch {}
  try {
    const instance = first(INSTANCES) as string;
    const data = await pipedSearch(instance, q);
    const channels = data.filter((i: any) => (i.type || '').toLowerCase() === 'channel');
    const playlists = data.filter((i: any) => (i.type || '').toLowerCase() === 'playlist');
    const videos = data.filter((i: any) => (i.type || 'video') === 'video');
    channels.slice(0, 5).forEach((c: any) => c.name && suggestions.add(c.name));
    playlists.slice(0, 5).forEach((p: any) => p.title && suggestions.add(p.title));
    videos.slice(0, 5).forEach((v: any) => v.title && suggestions.add(v.title));
  } catch {}
  return Array.from(suggestions).slice(0, 10);
};

export const getAudioUrl = async (videoId: string): Promise<string | null> => {
  return await resolveAudioUrlAcrossInstances(videoId);
};
