// =====================================================
// manual-sw.js  —  기숙사 매뉴얼 서비스워커
// 오프라인 캐시: 인터넷 없이도 매뉴얼 열람 가능
// 업데이트 시 버전 숫자를 1씩 올려주세요 (v1 → v2 → v3 ...)
// =====================================================

const CACHE_NAME = 'dormitory-manual-v1';

// 오프라인에서도 사용할 파일 목록
const FILES_TO_CACHE = [
  './index.html',
  './manual-manifest.json',
  './manual-icon-192.png',
  './manual-icon-512.png',
];

// ── 설치: 파일 캐시 저장 ──
self.addEventListener('install', event => {
  console.log('[매뉴얼 SW] 설치 중...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[매뉴얼 SW] 파일 캐시 저장');
      return cache.addAll(FILES_TO_CACHE);
    }).catch(err => console.log('[매뉴얼 SW] 캐시 저장 오류:', err))
  );
  self.skipWaiting();
});

// ── 활성화: 오래된 캐시 삭제 ──
self.addEventListener('activate', event => {
  console.log('[매뉴얼 SW] 활성화');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[매뉴얼 SW] 오래된 캐시 삭제:', key);
          return caches.delete(key);
        }
      }))
    )
  );
  self.clients.claim();
});

// ── 요청 처리: 캐시 우선 → 없으면 네트워크 ──
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => {
        return caches.match('./index.html');
      });
    })
  );
});
