# Shwanspod Fitness — PWA

A multi-user workout tracker, hypertrophy programme, and meal planner that works as a Progressive Web App.

## Quick Start (Local — single device)

1. Put all files in a folder together:
   ```
   shwanspod-pwa/
   ├── index.html
   ├── manifest.json
   ├── sw.js
   └── icons/
       ├── icon-192.png
       ├── icon-512.png
       └── icon-maskable.png
   ```

2. Serve locally (for testing):
   ```bash
   # Python
   python3 -m http.server 8000

   # Node
   npx serve .
   ```

3. Open `http://localhost:8000` on your phone (same WiFi network).

## Install on Your Phone

### iPhone (Safari)
1. Open the URL in Safari
2. Tap the **Share** button (square with arrow)
3. Tap **"Add to Home Screen"**
4. The app appears as a native icon — full screen, no browser bar

### Android (Chrome)
1. Open the URL in Chrome
2. Tap the **three-dot menu** (⋮)
3. Tap **"Add to home screen"** or **"Install app"**

## Host Online (for multi-device / sharing with friends)

To access from any device and share with friends, host the files on any static hosting:

### GitHub Pages (free)
1. Create a GitHub repository
2. Upload all files
3. Go to Settings → Pages → Deploy from main branch
4. Share the URL: `https://yourusername.github.io/shwanspod-fitness/`

### Netlify (free)
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the folder
3. Get a live URL instantly

### Vercel (free)
1. `npm i -g vercel && vercel` from the folder

Once hosted, anyone with the link can open it, install it as a PWA, and create their own profile.

## Features

- **Multi-user profiles** — multiple people can track on the same device
- **4-day hypertrophy split** — Push / Pull / Legs / Upper
- **Meal planner** — 4 options per meal, live macro tracking
- **Session tracker** — log weight, reps, and rate sessions
- **Progress history** — weekly stats and session log
- **Leaderboard** — compete with friends
- **Offline support** — works without internet after first load
- **Data persistence** — saves to localStorage

## Tech

- Vanilla HTML/CSS/JS — zero dependencies
- Service Worker for offline caching
- Web App Manifest for native-like installation
- localStorage for data persistence
