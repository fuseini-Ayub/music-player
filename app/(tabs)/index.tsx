import { StyleSheet, ScrollView, View, Text, Image, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getHomeData } from '../../services/musicService';
import { TrackListItem } from '../../components/TrackListItem';
import { Playlist, Track } from '../../types';
import { usePlayerStore } from '../../store/playerStore';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ featured: Playlist[], newReleases: Track[], trendingSongs: Track[], trendingAlbums: Playlist[], news: { title: string; link: string; }[] } | null>(null);
  const { playTrack, setQueue } = usePlayerStore();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const result = await getHomeData();
    setData(result);
    setLoading(false);
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    setQueue(playlist.tracks);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Listen Now</Text>

        <Text style={styles.sectionTitle}>Featured Playlists</Text>
        <FlatList
          horizontal
          data={data?.featured}
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/playlist', params: { title: item.title, data: encodeURIComponent(JSON.stringify(item.tracks)) } })}>
              <Image source={{ uri: item.cover }} style={styles.cardImage} />
              <Text style={styles.cardTitle}>{item.title}</Text>
            </TouchableOpacity>
          )}
        />

        <Text style={styles.sectionTitle}>New Releases</Text>
        <View style={styles.verticalList}>
          {data?.newReleases.map(track => (
            <TrackListItem key={track.id} track={track} />
          ))}
        </View>
        
        <Text style={styles.sectionTitle}>Trending Songs</Text>
        <View style={styles.verticalList}>
          {data?.trendingSongs.map(track => (
            <TrackListItem key={track.id} track={track} />
          ))}
        </View>
        
        <Text style={styles.sectionTitle}>Trending Albums</Text>
        <FlatList
          horizontal
          data={data?.trendingAlbums}
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/playlist', params: { title: item.title, data: encodeURIComponent(JSON.stringify(item.tracks || [])) } })}>
              <Image source={{ uri: item.cover }} style={styles.cardImage} />
              <Text style={styles.cardTitle}>{item.title}</Text>
            </TouchableOpacity>
          )}
        />
        
        <Text style={styles.sectionTitle}>Music News</Text>
        <View style={styles.newsList}>
          {data?.news.map(n => (
            <View key={n.link} style={styles.newsItem}>
              <Text style={styles.newsText} numberOfLines={2}>{n.title}</Text>
            </View>
          ))}
        </View>
        
        {/* Spacer for MiniPlayer */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#151718',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#151718',
  },
  scrollContent: {
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    paddingHorizontal: 15,
    marginBottom: 15,
    marginTop: 10,
  },
  horizontalList: {
    paddingHorizontal: 15,
  },
  card: {
    marginRight: 15,
    width: 140,
  },
  cardImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#333',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  newsList: {
    paddingHorizontal: 15,
    gap: 8,
    marginTop: 8,
  },
  newsItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  newsText: {
    color: '#ddd',
    fontSize: 14,
  },
  verticalList: {
    paddingHorizontal: 0,
  },
});
