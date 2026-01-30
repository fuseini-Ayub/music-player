import { StyleSheet, View, Text, TextInput, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchYouTubeMusic, getSuggestions } from '../../services/youtubeService';
import { TrackListItem } from '../../components/TrackListItem';
import { Track } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../../store/playerStore';

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Track[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { setQueue } = usePlayerStore();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    // Use YouTube Service instead of mock
    const data = await searchYouTubeMusic(query);
    setResults(data);
    setLoading(false);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const id = setTimeout(async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      const s = await getSuggestions(query);
      setSuggestions(s);
      setShowSuggestions(s.length > 0);
    }, 250);
    return () => clearTimeout(id);
  }, [query]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="Songs, Artists, Albums"
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        {showSuggestions && (
          <View style={styles.suggestionBox}>
            {suggestions.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionItem}
                onPress={() => { setQuery(s); setShowSuggestions(false); setTimeout(handleSearch, 0); }}
              >
                <Ionicons name="search" size={16} color="#aaa" style={{ marginRight: 8 }} />
                <Text style={styles.suggestionText} numberOfLines={1}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <TrackListItem 
              track={item} 
              onPress={() => setQueue(results, index)} 
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {query ? 'No results found' : 'Search for music'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#151718',
  },
  header: {
    padding: 15,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  suggestionBox: {
    backgroundColor: '#1f2022',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  suggestionText: {
    color: '#ddd',
    fontSize: 14,
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 80, // Space for MiniPlayer
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
});
