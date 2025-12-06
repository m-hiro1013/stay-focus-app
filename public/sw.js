// Service Worker - Stay Focus App
const CACHE_NAME = 'stay-focus-v1'
const OFFLINE_URL = '/offline.html'

// キャッシュするファイル
const STATIC_ASSETS = [
    '/',
    '/offline.html',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
]

// インストール時（初回のみ実行）
self.addEventListener('install', (event) => {
    console.log('[Service Worker] インストール中...')

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] 静的ファイルをキャッシュ')
            return cache.addAll(STATIC_ASSETS)
        })
    )

    // 即座に有効化
    self.skipWaiting()
})

// アクティベート時（更新時に実行）
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] アクティベート中...')

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // 古いキャッシュを削除
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] 古いキャッシュを削除:', cacheName)
                        return caches.delete(cacheName)
                    }
                })
            )
        })
    )

    // すべてのクライアントを即座に制御
    self.clients.claim()
})

// フェッチ時（リクエストごとに実行）
self.addEventListener('fetch', (event) => {
    // Supabase APIリクエストの場合
    if (event.request.url.includes('supabase.co')) {
        // Network First（常に最新データを取得）
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // 成功したらキャッシュに保存
                    const responseClone = response.clone()
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone)
                    })
                    return response
                })
                .catch(() => {
                    // オフライン時はキャッシュから取得
                    return caches.match(event.request)
                })
        )
        return
    }

    // 静的ファイルの場合
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Cache First（高速表示優先）
            if (cachedResponse) {
                return cachedResponse
            }

            // キャッシュになければネットワークから取得
            return fetch(event.request)
                .then((response) => {
                    // 有効なレスポンスの場合のみキャッシュ
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response
                    }

                    const responseClone = response.clone()
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone)
                    })

                    return response
                })
                .catch(() => {
                    // ネットワークエラー時はオフラインページを表示
                    if (event.request.mode === 'navigate') {
                        return caches.match(OFFLINE_URL)
                    }
                })
        })
    )
})
