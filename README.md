# SuKa Olimpiade Fisika — Simulasi

Satu repository berisi **sembilan** simulasi fisika interaktif berbasis Three.js. Setiap simulasi dibangun sebagai aplikasi mandiri dan diterbitkan pada alamatnya sendiri di GitHub Pages. Antarmuka utama menggunakan mode terang, sedangkan viewport simulasi tetap gelap.

## Simulasi

| Simulasi | URL setelah deploy |
|---|---|
| Gerak parabola | `/parabola/` |
| Gaya gesek bidang miring | `/bidang-miring/` |
| Tumbukan | `/tumbukan/` |
| Gerak melingkar | `/melingkar/` |
| Hukum Hooke | `/hooke/` |
| Venturi-Bernoulli | `/venturi/` |
| Bandul matematis | `/bandul/` |
| Gelombang berjalan & stasioner | `/gelombang/` |
| Kalor & perubahan wujud | `/kalor/` |

> Simulasi GGL/induksi elektromagnetik telah dihapus dari paket sesuai revisi.

## Revisi animasi utama

- **Bandul Matematis:** dilengkapi atap/penyangga, titik gantung, garis setimbang, jejak, serta parameter diameter bandul.
- **Gelombang:** tersedia Gelombang Berjalan, Gelombang Stasioner Ujung Terikat, dan Gelombang Stasioner Ujung Bebas dengan visual kondisi batas yang berbeda.
- **Kalor:** wadah transparan, pemanas, partikel termal, es, proses mencair, air cair, mendidih/menguap, dan uap. Model menggunakan kalor sensibel dan kalor laten sehingga suhu tertahan pada 0 °C dan 100 °C saat perubahan wujud.


## Mode iframe untuk sistem soal

Seluruh **pengubah variabel** pada sembilan simulasi sekarang berada **di dalam viewport simulasi** melalui panel **⚙ Parameter**. Saat URL simulasi dibuka di dalam `<iframe>`, aplikasi otomatis masuk mode embed:

- viewport memenuhi area iframe;
- header, footer, analisis luar, legenda, dan bagian non-esensial disembunyikan;
- semua slider, select, tombol mode, Terapkan/Jeda, dan parameter fisika tetap tersedia sebagai overlay di dalam frame;
- pada frame sempit panel parameter dapat dibuka/ditutup agar animasi tetap terlihat;
- tidak perlu membuat URL khusus untuk embed karena mode iframe terdeteksi otomatis.

Parameter URL opsional:

- `?embed=1` memaksa mode embed walaupun dibuka langsung di browser;
- `?controls=open` memaksa panel parameter terbuka;
- `?controls=closed` memaksa panel parameter tertutup saat awal.

Contoh untuk sistem soal:

```html
<iframe
  src="https://aricahya88-source.github.io/SuKAOlimpiadeSimulasi/tumbukan/"
  style="width:100%;aspect-ratio:16/9;border:0"
  allowfullscreen
></iframe>
```

## Deploy otomatis

1. Unggah seluruh isi folder ini ke repository GitHub (termasuk `.github`).
2. Pastikan branch utama bernama `main` atau `master`.
3. Buka **Settings → Pages → Build and deployment → Source**, pilih **GitHub Actions**.
4. Push perubahan. Workflow `.github/workflows/deploy.yml` akan memasang dependency, membangun sembilan aplikasi, lalu menerbitkannya sebagai satu GitHub Pages site.

## Lokal

```bash
npm install
npm run build
```

Untuk pengembangan satu aplikasi, jalankan misalnya:

```bash
npm run dev --prefix apps/bandul
```
