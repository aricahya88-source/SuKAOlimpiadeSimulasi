# Mode Frame-Only + Netlify

Semua 9 simulasi sekarang selalu tampil sebagai **frame simulasi penuh**.
Saat URL simulasi dibuka langsung atau dimasukkan ke `<iframe>`, tidak ada header,
judul halaman, keterangan luar, analisis luar, legenda, atau footer.

Yang tetap terlihat di dalam frame:
- viewport/animasi;
- HUD yang memang bagian dari simulasi;
- tombol `⚙ Parameter`;
- kontrol variabel yang muncul sebagai panel overlay di dalam viewport.

Netlify:
- Build command diatur oleh `netlify.toml`.
- Publish directory: `site`.
- `scripts/prepare-netlify.mjs` menggabungkan 9 hasil build ke satu folder publish.
