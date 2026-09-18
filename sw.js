// Service Worker của Trạm Điều Phối — cache toàn bộ app để mở được khi mất mạng.
// Tăng số CACHE_NAME (v2, v3...) mỗi khi muốn ép trình duyệt tải bản mới thay vì dùng cache cũ.
const CACHE_NAME = 'tram-dieu-phoi-v1';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Chiến lược: network-first cho file trong app (luôn ưu tiên bản mới nhất khi có mạng,
// tự động lưu lại cache), rơi về cache khi mất mạng. Không can thiệp request ra ngoài
// domain khác (Google Fonts, nhạc GitHub) — để trình duyệt tự xử lý bình thường.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
  );
});
