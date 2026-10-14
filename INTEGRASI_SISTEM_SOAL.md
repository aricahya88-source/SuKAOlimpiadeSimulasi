# Integrasi Simulasi ke Sistem Soal

Versi ini dirancang agar simulasi dapat dimasukkan ke soal melalui iframe tanpa memisahkan kontrol variabel dari animasinya.

## Perilaku di iframe

Saat simulasi mendeteksi dirinya berada di dalam iframe, viewport otomatis memenuhi seluruh frame. Panel **⚙ Parameter** berada di dalam viewport. Dengan demikian peserta dapat mengubah variabel tanpa keluar dari area simulasi atau melakukan scroll ke panel di luar animasi.

## Contoh

```html
<div style="width:100%;max-width:1100px;aspect-ratio:16/9">
  <iframe
    src="https://aricahya88-source.github.io/SuKAOlimpiadeSimulasi/parabola/"
    title="Simulasi Gerak Parabola"
    style="width:100%;height:100%;border:0;border-radius:12px"
    loading="lazy"
    allowfullscreen
  ></iframe>
</div>
```

## URL simulasi

- `/parabola/`
- `/bidang-miring/`
- `/tumbukan/`
- `/melingkar/`
- `/hooke/`
- `/venturi/`
- `/bandul/`
- `/gelombang/`
- `/kalor/`

## Opsi panel

Tambahkan `?controls=open` jika soal mengharuskan panel langsung terlihat. Tambahkan `?controls=closed` jika ingin animasi lebih lapang pada awal. Tambahkan `?embed=1` untuk memaksa tampilan embed saat melakukan preview langsung.
