# Bot Telegram AI dengan Sistem Memori Percakapan

Bot Telegram pintar dengan AI respons otomatis dan sistem memori percakapan yang ditingkatkan.

## Fitur Utama

- 🤖 **AI Respons Otomatis** menggunakan BlackBox AI
- 🧠 **Memori Percakapan Jangka Panjang** dengan timestamp
- 🎭 **Kepribadian yang Dapat Diatur** (Santai & Humor, Formal & Informatif, Kreatif & Imajinatif)
- 📌 **Pencarian Gambar Pinterest** dengan command `/pin`
- 🗑️ **Reset Memori** dengan command `/clear`
- 📊 **Statistik Bot** untuk admin
- 🔔 **Notifikasi Admin** untuk user baru

## Instalasi dan Penggunaan

### 1. Ekstrak File
```bash
unzip bot_telegram_fixed_files.zip
cd telegram-ai-bot
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Konfigurasi Bot
Edit file `config.js` dan sesuaikan:
- `telegram.token`: Token bot Telegram Anda
- `telegram.adminId`: ID Telegram admin

### 4. Jalankan Bot
```bash
npm start
```

## Command yang Tersedia

- `/start` - Memulai percakapan dengan bot
- `/help` - Menampilkan bantuan
- `/pin <query>` - Mencari gambar dari Pinterest
- `/clear` - Menghapus memori percakapan
- `/bot` - Mengatur kepribadian bot dan reset percakapan
- `/stats` - Menampilkan statistik bot (khusus admin)

## Sistem Memori yang Ditingkatkan

Bot ini menggunakan sistem memori percakapan yang canggih:

- **Konteks Dinamis**: Menggunakan batas token (900 karakter) bukan jumlah pesan tetap
- **Timestamp**: Setiap pesan memiliki timestamp untuk tracking waktu
- **Memori Jangka Panjang**: Dapat mengingat percakapan yang lebih panjang
- **Efisiensi Token**: Menghindari overflow API dengan manajemen token yang dinamis

## Struktur File

```
telegram-ai-bot/
├── bot.js              # File utama bot
├── config.js           # Konfigurasi bot
├── package.json        # Dependensi dan scripts
├── package-lock.json   # Lock file dependensi
├── README.md           # Dokumentasi ini
└── otak.json          # File memori percakapan (dibuat otomatis)
```

## Troubleshooting

### Bot tidak merespons
- Pastikan token bot sudah benar di `config.js`
- Cek koneksi internet
- Pastikan API AI eksternal berfungsi

### Error saat install
```bash
npm cache clean --force
npm install
```

### Menjalankan dalam mode development
```bash
npm run dev
```

## Kontribusi

Jika Anda ingin berkontribusi pada pengembangan bot ini, silakan buat pull request atau laporkan bug melalui issues.

## Lisensi

ISC License - Bebas digunakan dan dimodifikasi.

