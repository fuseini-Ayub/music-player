import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { usePlayerStore } from '../store/playerStore';

export function PlayerController() {
  const { currentTrack, isPlaying, setDuration, setPosition, playNext, setIsPlaying, seekTarget, resetSeekTarget } = usePlayerStore();
  const soundRef = useRef<Audio.Sound | null>(null);

  // Initial Audio Setup
  useEffect(() => {
    async function setupAudio() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.error('Audio setup failed', e);
      }
    }
    setupAudio();
  }, []);

  // Handle Track Change
  useEffect(() => {
    let isMounted = true;
    
    async function loadSound() {
      if (!currentTrack || !currentTrack.url) return;

      try {
        // Unload previous sound
        if (soundRef.current) {
          try {
            await soundRef.current.unloadAsync();
          } catch (e) {
            console.warn('Failed to unload previous sound', e);
          }
        }

        const loadPromise = Audio.Sound.createAsync(
          { uri: currentTrack.url },
          { shouldPlay: isPlaying },
          onPlaybackStatusUpdate
        );
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Load timeout')), 15000)
        );

        const result: any = await Promise.race([loadPromise, timeoutPromise]);
        const { sound } = result;

        if (isMounted) {
          soundRef.current = sound;
        } else {
          sound.unloadAsync();
        }
      } catch (e) {
        console.error('Failed to load sound', e);
        // If loading fails, we might want to try next track or just stop
        if (isMounted) setIsPlaying(false);
      }
    }

    loadSound();

    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [currentTrack?.id, currentTrack?.url]); // Reload when URL becomes available

  // Handle Play/Pause
  useEffect(() => {
    async function updatePlayback() {
      if (!soundRef.current) return;
      
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;

      if (isPlaying && !status.isPlaying) {
        await soundRef.current.playAsync();
      } else if (!isPlaying && status.isPlaying) {
        await soundRef.current.pauseAsync();
      }
    }
    updatePlayback();
  }, [isPlaying]);

  // Handle Seeking
  useEffect(() => {
    async function seek() {
      if (seekTarget !== null && soundRef.current) {
        await soundRef.current.setPositionAsync(seekTarget);
        resetSeekTarget();
      }
    }
    seek();
  }, [seekTarget]);

  const onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) return;

    if (status.durationMillis) {
      setDuration(status.durationMillis);
    }
    
    if (status.positionMillis) {
      setPosition(status.positionMillis);
    }

    if (status.didJustFinish && !status.isLooping) {
      playNext();
    }
  };

  return null; // Logic only component
}
