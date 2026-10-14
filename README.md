# SuKa Olimpiade Fisika — 9 Simulasi

Versi **Frame-Only + Netlify**.

## Perilaku simulasi

Saat salah satu URL simulasi dibuka langsung maupun melalui iframe:
- hanya viewport/frame simulasi yang tampil;
- tidak ada header/judul halaman;
- tidak ada keterangan/analisis/legenda/footer di luar frame;
- seluruh pengubah variabel tersedia melalui tombol **⚙ Parameter** di dalam frame;
- pada layar lebar panel parameter terbuka otomatis, dan dapat ditutup;
- pada layar sempit panel dapat dibuka dari tombol di dalam frame.

## Daftar URL setelah deploy

- `/parabola/`
- `/bidang-miring/`
- `/tumbukan/`
- `/melingkar/`
- `/hooke/`
- `/venturi/`
- `/bandul/`
- `/gelombang/`
- `/kalor/`

## Netlify

`netlify.toml` sudah mengatur:
- build: `npm run build && node scripts/prepare-netlify.mjs`
- publish directory: `site`
- Node.js: 22

Jika Netlify UI masih menyimpan publish directory lama `dist`, ubah/clear agar tidak membingungkan. File `netlify.toml` dalam repo harus terbaca saat build.
