# Bot Telegram AI

Bot Telegram ini telah diperbarui dengan fitur baru dan peningkatan AI.

## Fitur Baru

### `/pin <query>`
Fitur ini memungkinkan Anda mencari gambar dari Pinterest. Cukup ketik `/pin` diikuti dengan kata kunci pencarian Anda. Contoh:

`/pin kucing lucu`

Bot akan mengembalikan gambar Pinterest yang relevan dengan query Anda.

### `/bot`
Fitur ini memungkinkan Anda mengatur kepribadian AI bot dan mereset percakapan. Ketika Anda mengetik `/bot`, bot akan:

-   Mengirimkan gambar acak dari koleksi yang telah disediakan.
-   Menampilkan tombol-tombol berikut:
    -   **✨ Atur Kepribadian ✨** dan **🔄 Reset Percakapan 🔄** akan ditampilkan dalam satu baris.
    -   Pilihan kepribadian (Santai & Humor, Formal & Informatif, Kreatif & Imajinatif) akan ditampilkan dalam dua baris, diikuti dengan tombol **🔄 Reset Percakapan 🔄** di baris terpisah untuk kerapian.

## Peningkatan AI (Blackbox AI)

Bot sekarang menggunakan API Blackbox AI untuk respons yang lebih cerdas dan relevan. Masalah batasan karakter pada API telah diatasi dengan penyesuaian pada kode bot. Ini akan membuat percakapan dengan bot terasa lebih alami dan informatif.

## Perubahan Kepribadian AI

Kepribadian AI bot telah diubah menjadi lebih santai, humoris, dan suka melawak secara default. Anda dapat mengubahnya melalui command `/bot`.

## Cara Menjalankan Bot

1.  **Ekstrak file:** Pastikan Anda telah mengekstrak semua file bot ke dalam satu folder.
2.  **Instal dependensi:** Buka terminal di dalam folder bot dan jalankan perintah berikut:
    ```bash
    npm install
    ```
3.  **Konfigurasi Bot:** Buka file `config.js` dan pastikan `TELEGRAM_TOKEN` dan `ADMIN_ID` sudah sesuai dengan bot Anda.
4.  **Jalankan Bot:** Setelah dependensi terinstal, jalankan bot dengan perintah:
    ```bash
    node bot.js
    ```

Bot akan mulai berjalan dan siap menerima pesan di Telegram.

## Troubleshooting

Jika Anda mengalami masalah, pastikan:
-   Koneksi internet stabil.
-   `TELEGRAM_TOKEN` di `config.js` sudah benar.
-   Semua dependensi telah terinstal dengan benar (`npm install`).

Jika masalah berlanjut, periksa log di terminal untuk pesan error lebih lanjut.


