# OpenLiftingMobile

OpenLiftingMobile is an Expo + React Native app for browsing OpenPowerlifting data on mobile.

It includes:
- A leaderboard with filtering, sorting, and infinite scroll
- Lifter search with recent history
- Athlete profile details with personal bests and meet history
- Meet results with individual attempts
- Unit toggle (kg/lbs) in user preferences

## Tech Stack

- Expo SDK 54
- React Native 0.81
- React 19
- Expo Router (file-based routing)
- TanStack Query (server state + caching)
- Zustand (client state)
- TypeScript

## Data Source

The app reads data from OpenPowerlifting public endpoints:
- Rankings API
- Search API
- Lifter CSV
- Meet CSV

There is no custom backend in this project.

## Prerequisites

- Node.js >= 20 and < 23
- npm
- Expo Go app (for physical device testing), or Android/iOS emulator

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run start
```

3. Run on a platform:

```bash
npm run android
npm run ios
npm run web
```

### Stable Scripts (Windows-focused)

If Metro worker threads are unstable in your environment, use:

```bash
npm run start:stable
npm run android:stable
npm run ios:stable
```

## Scripts

- npm run start: Start Expo dev server
- npm run start:stable: Start with conservative Metro settings
- npm run android: Launch Android target
- npm run android:stable: Android with conservative Metro settings
- npm run ios: Launch iOS target
- npm run ios:stable: iOS with conservative Metro settings
- npm run web: Launch web target
- npm run tunnel: Start Expo with tunnel mode

## Project Structure

```text
app/
  _layout.tsx                # Root providers and stack routes
  (tabs)/
    _layout.tsx              # Bottom tabs
    leaderboard.tsx          # Leaderboard screen
    search.tsx               # Lifter search + history
    profile.tsx              # Preferences (unit toggle)
  athlete/[slug].tsx         # Athlete profile modal
  meet/[federation]/[meetId].tsx  # Meet results screen
hooks/
  useRankings.ts             # Rankings query mapping + pagination
lib/
  api.ts                     # OpenPowerlifting API/CSV integration and parsing
  format.ts                  # Number formatting helpers
  units.ts                   # kg/lbs conversion helpers
stores/
  useFilterStore.ts          # Leaderboard filter state
  useRecentLiftersStore.ts   # Search history state
  useUnitStore.ts            # Unit preference state
```

## Routing Overview

- Tabs:
  - Leaderboard
  - Search
  - Preferences
- Stack/modals:
  - athlete/[slug]
  - meet/[federation]/[meetId]

## Configuration

### Optional: Web CORS Proxy

For web builds, direct browser requests to OpenPowerlifting can fail due to CORS. The app falls back to a default proxy.

You can override the proxy by setting:

- EXPO_PUBLIC_OPL_CORS_PROXY

Supported formats:
- Full template with placeholder: https://your-proxy.example/?url={url}
- Base URL without placeholder: https://your-proxy.example/proxy

Example (PowerShell):

```powershell
$env:EXPO_PUBLIC_OPL_CORS_PROXY="https://your-proxy.example/?url={url}"
npm run web
```

## Notes

- Search uses rankings index lookup and fetches the exact ranking row.
- Meet results display individual attempts plus total and Dots.
- Age values in meet rows are truncated to integer display when numeric.

## Troubleshooting

- If TypeScript commands fail from the parent folder, run them from the app root first:

```bash
cd OpenLiftingMobile
npx tsc --noEmit
```

- If Expo cache causes stale behavior:

```bash
npx expo start --clear
```

## License

This project is licensed under the MIT License.
See the LICENSE file for details.
