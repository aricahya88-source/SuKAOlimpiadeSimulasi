# Simulasi Fisika

Satu repository berisi sepuluh simulasi fisika interaktif berbasis Three.js. Setiap simulasi dibangun sebagai aplikasi mandiri dan diterbitkan pada alamatnya sendiri di GitHub Pages.

## Simulasi

| Simulasi | URL setelah deploy |
|---|---|
| Gerak parabola | `/parabola/` |
| Gaya gesek bidang miring | `/bidang-miring/` |
| Tumbukan | `/tumbukan/` |
| Gerak melingkar | `/melingkar/` |
| Hukum Hooke | `/hooke/` |
| Venturi-Bernoulli | `/venturi/` |
| Bandul sederhana | `/bandul/` |
| Gelombang tali | `/gelombang/` |
| Kalor dan energi | `/kalor/` |
| Induksi elektromagnetik | `/induksi/` |

Alamat lengkap berbentuk `https://USERNAME.github.io/NAMA-REPOSITORY/parabola/`.

## Deploy otomatis

1. Buat repository baru di GitHub dan unggah seluruh isi folder ini (termasuk folder tersembunyi `.github`).
2. Pastikan branch utama bernama `main` atau `master`.
3. Buka **Settings → Pages → Build and deployment → Source**, pilih **GitHub Actions**.
4. Push perubahan. Workflow `.github/workflows/deploy.yml` akan memasang dependency, membangun sepuluh aplikasi, lalu menerbitkan semuanya sebagai satu GitHub Pages site.

Setelah workflow selesai, halaman utama menampilkan katalog tautan. Tidak ada server atau database yang diperlukan.

## Lokal

```bash
npm install
npm run build
```

Untuk pengembangan satu aplikasi, jalankan `npm run dev --prefix apps/parabola` (ganti slug sesuai tabel).
