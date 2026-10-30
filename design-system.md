---
inclusion: always
---

# Design System — Expense & Budget Visualizer

Steering file ini mendokumentasikan keputusan desain utama proyek.
Selalu ikuti panduan ini saat melakukan perubahan pada `css/style.css` atau `js/app.js`.

---

## Warna & Tema

### Background Utama
- **Light mode:** Merah maroon `#6b1a1a` (body background)
- **Dark mode:** Merah maroon gelap `#1a0a0a`

### Brand Color (Primary)
- **Light:** `#1a1a1a` (hitam)
- **Dark:** `#444444` (abu gelap untuk kontras di background gelap)

### Header & Footer
- **Light:** `#4a0f0f` (maroon sangat gelap)
- **Dark:** `#0f0505`

### Cards
- **Light:** `#ffffff`
- **Dark:** `#2d1b1b`

---

## Dark / Light Mode

- Toggle diimplementasikan via `data-theme` attribute di `<html>`.
- Semua warna didefinisikan dengan CSS Custom Properties di `:root` (light) dan `[data-theme="dark"]`.
- Preferensi disimpan di `localStorage` dengan key `expense_theme`.
- Logika toggle ada di modul `Theme` dalam `js/app.js`.
- Tombol toggle ada di header (kanan atas), menampilkan ikon 🌙 / ☀️.

---

## Struktur File

| File | Tanggung Jawab |
|------|----------------|
| `index.html` | Markup semantik, satu-satunya HTML |
| `css/style.css` | Semua styling, mobile-first, satu file |
| `js/app.js` | Semua logika (Storage, State, Render, Form, Events, Theme) |

**Jangan tambah file CSS atau JS baru.** Semua perubahan styling masuk ke `style.css`, semua logika masuk ke `app.js`.

---

## Konvensi Kode

- Gunakan **CSS Custom Properties** untuk semua warna — jangan hardcode hex langsung di luar `:root`.
- Semua input user wajib di-escape dengan `escapeHTML()` sebelum dimasukkan ke DOM.
- `localStorage` selalu dibungkus `try/catch` via modul `Storage`.
- Format mata uang menggunakan `formatCurrency()` (IDR, `Intl.NumberFormat`).
- Tidak ada framework — Vanilla JS saja.

---

## Deployment

- Static files, tidak ada build step.
- Bisa di-deploy langsung via **GitHub Pages** (branch `main`, root `/`).
- URL GitHub Pages: `https://firhanarief.github.io/CodingCamp-26October26-FIRHAN/`
