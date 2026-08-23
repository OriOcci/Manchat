// sw.js
const CACHE_NAME = 'manchat-cache-v1';

// 오프라인 상태에서도 반드시 열려야 하는 핵심 정적 파일
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon-180x180.png',
  // DB 파일 (파일명이 database.csv인 경우)
  '/database.csv' 
];

// 1. 서비스 워커 설치 및 핵심 리소스 프리캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. 오래된 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      )
    }).then(() => self.clients.claim())
  );
});

// 3. 네트워크 요청 처리 (Network First, Cache Fallback Strategy)
self.addEventListener('fetch', (event) => {
  // GET 요청 및 HTTP(S) 통신만 캐싱
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // 응답이 정상적인 경우 캐시에 복사본 저장 (표지 이미지 및 API 결과 포함)
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // 네트워크 연결 실패(오프라인) 시 캐시된 자원 반환
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // HTML 페이지 요청인데 오프라인이고 캐시도 없다면 기본 index.html 제공
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
      })
  );
});
