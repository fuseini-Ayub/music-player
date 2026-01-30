# StickerSmash Music Player

A professional music player built with Expo Router. It provides full‑length playback via multi‑backend YouTube stream resolution, typeahead search, offline library, trending content, and a MiniPlayer with playback controls.

## Features
- Full‑song playback (YouTube audio streams with multi‑instance fallback)
- Fast search with typeahead suggestions
- Queue, next/previous, seek and pause/play
- Offline library (download to device storage)
- Home: Featured playlists, real New Releases (Apple Hot Tracks), Trending Songs, Trending Albums, Music News
- MiniPlayer and full player screen

## Requirements
- Node 18+ and npm
- Expo CLI (installed via npx automatically)
- Expo Go app on your phone (for mobile testing)
- Optional: Android Studio or SDK Platform Tools (for `adb` and emulator)

## Install
```bash
npm install
```

## Run
### Web
```bash
npm run web
```

### Phone (Expo Go)
Preferred: Tunnel (works through most networks)
```bash
npx expo start --tunnel
```
Open Expo Go and scan the QR.

LAN (faster, same Wi‑Fi required)
```bash
npx expo start --lan
```
Ensure PC and phone are on the same network, VPN is off, and Windows Firewall allows Node.js/Expo. Press `s` to show QR and scan in Expo Go.

## Search & Playback
- Search shows results quickly. Audio stream is resolved when you tap a track for full‑length playback.
- Artist searches try multiple YouTube (Piped) instances and fall back to Invidious for channels/playlists.
- If public instances are slow, iTunes search is used for visible results; playback still resolves to full streams on tap.

## Offline Library
- Tap the download icon on any track to save it to device storage.
- Library tab shows saved tracks; offline items play directly from local file paths.

## Troubleshooting
- Tunnel error (ERR_NGROK_3200): restart tunnel `npx expo start --tunnel --clear`.
- “No results found” for artist: public proxies may be slow. Try again; fallback is enabled. Playback resolves streams on tap.
- Full playback not starting: wait briefly; the player loads when the URL resolves. Next/previous navigate the current queue.
- Android SDK/adb missing:
  - Install Android Studio or Platform Tools.
  - Set `ANDROID_SDK_ROOT` to your SDK path and add `%ANDROID_SDK_ROOT%\platform-tools` to PATH.

## Notes
- expo‑av is deprecated in SDK 54. Migration to `expo-audio` is planned. Current app runs with expo‑av; avoid upgrading SDK until migration is complete.

