/**
 * Service Worker — Aulia Apotek Klinik
 */

// 1. TAMBAHKAN VARIABEL BASE INI
const BASE_PATH = '/klinik-apotek-aulia/';

const CACHE_NAME = 'aulia-apotek-klinik-v2';

// 2. TAMBAHKAN BASE_PATH DI DEPAN SETIAP URL
const urlsToCache = [
    BASE_PATH,
    BASE_PATH + 'index.html',
    BASE_PATH + 'manifest.json',
    BASE_PATH + 'css/style.css',
    BASE_PATH + 'js/app.js',
    BASE_PATH + 'js/auth.js',
    BASE_PATH + 'js/dashboard.js',
    BASE_PATH + 'js/apotek/obat.js',
    BASE_PATH + 'js/apotek/transaksi.js',
    BASE_PATH + 'js/apotek/pembelian.js',
    BASE_PATH + 'js/apotek/stockOpname.js',
    BASE_PATH + 'js/klinik/antrian.js',
    BASE_PATH + 'js/klinik/pasien.js',
    BASE_PATH + 'js/klinik/rekamMedis.js',
    BASE_PATH + 'js/klinik/resep.js',
    BASE_PATH + 'js/keuangan/akuntansi.js',
    BASE_PATH + 'js/keuangan/laporanKeuangan.js',
    BASE_PATH + 'js/keuangan/payroll.js',
    BASE_PATH + 'js/laporan/hutang.js',
    BASE_PATH + 'js/laporan/pengeluaran.js',
    BASE_PATH + 'js/laporan/piutang.js',
    BASE_PATH + 'js/manajemen/absensi.js',
    BASE_PATH + 'js/manajemen/karyawan.js',
    BASE_PATH + 'js/pengaturan/gaji.js',
    BASE_PATH + 'js/pengaturan/pembagian.js',
    BASE_PATH + 'js/pengaturan/profil.js',
    BASE_PATH + 'js/pengaturan/tindakan.js',
    BASE_PATH + 'js/pengaturan/users.js',
    BASE_PATH + 'icon-192.png',
    BASE_PATH + 'icon-512.png'
];

// ... biarkan kode event listener di bawahnya (install, activate, fetch) tetap sama seperti yang sudah saya perbaiki sebelumnya ...
self.addEventListener('install', function(event) {
    // FIX: jangan telan error addAll, supaya install benar-benar gagal jika cache shell rusak.
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            // addAll bersifat all-or-nothing; gunakan add per item agar 1 file gagal tidak menghancurkan install.
            return Promise.all(urlsToCache.map(function(url) {
                return cache.add(url).catch(function(err) {
                    console.warn('[SW] Gagal cache:', url, err);
                });
            }));
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; })
                                   .map(function(k) { return caches.delete(k); }));
        }).then(function() { return self.clients.claim(); })
    );
});

self.addEventListener('fetch', function(event) {
    var req = event.request;
    if (req.method !== 'GET') return;

    var url = new URL(req.url);
    // Jangan cache Firestore/Auth dynamic API
    if (url.hostname.indexOf('firestore') !== -1 ||
        url.hostname.indexOf('googleapis.com') !== -1 ||
        url.hostname.indexOf('identitytoolkit') !== -1) {
        return; // biarkan network handle
    }

    event.respondWith(
        caches.match(req).then(function(cached) {
            var fetchPromise = fetch(req).then(function(networkRes) {
                // FIX: izinkan basic, cors, dan opaque (CDN) untuk di-cache.
                if (networkRes && (networkRes.type === 'basic' || networkRes.type === 'cors' || networkRes.type === 'opaque')) {
                    var clone = networkRes.clone();
                    caches.open(CACHE_NAME).then(function(cache) { cache.put(req, clone); });
                }
                return networkRes;
            }).catch(function() { return cached; });
            // stale-while-revalidate
            return cached || fetchPromise;
        })
    );
});
