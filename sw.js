const CACHE_NAME = 'worldcup-biorhythm-v6';

// Static UI assets
const STATIC_ASSETS = [
  './',
  'index.html',
  'posicionesfinalesotabla.html',
  'resultadosyestadistica.html',
  'fasefinalllavesresultadosygoles.html',
  'goleadores.html',
  'premios.html',
  'planteles_argentina.html',
  'mundialdefutbol2022.html',
  'eliminatorias.html',
  'css/style.css',
  'js/app.js',
  'manifest.json'
];

// All years that have JSON data available
const DATA_YEARS = [
  '1930','1934','1938','1950','1954','1958','1962','1966',
  '1970','1974','1978','1982','1986','1990','1994','1998',
  '2002','2006','2010','2014','2018','2022','2026'
];

// Build list of JSON data URLs for pre-caching
const JSON_BASE = 'worldcup.json-master/worldcup.json-master';
const DATA_ASSETS = [];

DATA_YEARS.forEach(year => {
  // Main matches file — always present
  DATA_ASSETS.push(`${JSON_BASE}/${year}/worldcup.json`);
});

// Extra files for 2026 specifically
DATA_ASSETS.push(`${JSON_BASE}/2026/worldcup.teams.json`);
DATA_ASSETS.push(`${JSON_BASE}/2026/worldcup.stadiums.json`);
DATA_ASSETS.push(`${JSON_BASE}/2026/worldcup.quali_playoffs.json`);
DATA_ASSETS.push(`${JSON_BASE}/2022/worldcup.groups.json`);
DATA_ASSETS.push(`${JSON_BASE}/2022/worldcup.stadiums.json`);

// Install Event — pre-cache all static assets + critical JSON
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(async () => {
        // Cache JSON files individually so one failure doesn't break all
        const cache = await caches.open(CACHE_NAME);
        for (const url of DATA_ASSETS) {
          try {
            await cache.add(url);
          } catch (e) {
            console.warn('[SW] Could not pre-cache (may be offline):', url);
          }
        }
      })
      .then(() => {
        console.log('[SW] All assets cached. Ready for offline use.');
        return self.skipWaiting();
      })
  );
});

// Activate Event — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Clearing outdated cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event — smart caching strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin requests (fonts, etc.)
  if (event.request.method !== 'GET') return;

  // JSON data files: Network-First (update cache if online, serve from cache if offline)
  if (url.pathname.includes('.json') && !url.pathname.includes('manifest.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          console.log('[SW] Serving JSON from cache (offline):', url.pathname);
          return caches.match(event.request).then(cached => {
            if (cached) return cached;
            return new Response(JSON.stringify({ error: 'offline', matches: [] }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Google Fonts: Cache-First (fast, permanent)
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Static HTML/CSS/JS assets: Network-First (guarantees latest updates when online, falls back to cache offline)
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        console.log('[SW] Serving static asset from cache (offline):', url.pathname);
        return caches.match(event.request);
      })
  );
});
