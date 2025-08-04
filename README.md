# Bot Telegram AI 🤖

Bot Telegram dengan respons otomatis menggunakan AI dari aimlapi.com. Bot ini akan merespons setiap pesan yang dikirim dengan jawaban yang dihasilkan oleh AI.

## ✨ Fitur

- 🔄 **Respons Otomatis**: Bot akan otomatis membalas setiap pesan yang diterima
- 🧠 **AI Powered**: Menggunakan GPT-3.5-turbo dari aimlapi.com untuk respons yang natural
- 💬 **Bahasa Indonesia**: Bot dikonfigurasi untuk merespons dalam bahasa Indonesia
- ⚡ **Real-time**: Respons langsung tanpa delay
- 🛡️ **Error Handling**: Penanganan error yang baik untuk stabilitas bot
- 👤 **Admin Features**: Notifikasi admin dan command khusus
- 📊 **Statistics**: Tracking pengguna dan statistik bot

## 📋 Prasyarat

- Node.js (versi 14 atau lebih baru)
- npm atau yarn

## 🚀 Cara Setup

### 1. Install Dependencies

```bash
cd telegram-ai-bot
npm install
```

### 2. Konfigurasi (Opsional)

Semua konfigurasi sudah siap di file `config.js`:
- ✅ Token bot Telegram sudah dikonfigurasi
- ✅ API Key aimlapi.com sudah dikonfigurasi  
- ✅ Admin ID sudah dikonfigurasi

Jika ingin mengubah konfigurasi, edit file `config.js`.

### 3. Jalankan Bot

```bash
npm start
```

## 📱 Cara Menggunakan

1. Setelah bot berjalan, buka Telegram
2. Cari bot: **@your_bot_username** (sesuai yang dikonfigurasi)
3. Kirim perintah `/start` untuk memulai
4. Kirim pesan apa saja dan bot akan merespons otomatis

## 🔧 Konfigurasi

### File config.js

```javascript
module.exports = {
    telegram: {
        token: 'YOUR_BOT_TOKEN',
        adminId: YOUR_ADMIN_ID
    },
    aiml: {
        apiKey: 'YOUR_API_KEY',
        apiBase: 'https://api.aimlapi.com/v1',
        model: 'gpt-3.5-turbo'
    }
};
```

### Kustomisasi AI

Anda dapat mengubah perilaku AI dengan mengedit `systemMessage` di file `config.js`:

```javascript
systemMessage: 'Kamu adalah asisten AI yang ramah dan membantu...'
```

## 📁 Struktur Proyek

```
telegram-ai-bot/
├── bot.js              # File utama bot
├── config.js           # Konfigurasi bot (token, API key, dll)
├── package.json        # Konfigurasi npm
├── .gitignore         # Git ignore file
└── README.md          # Dokumentasi ini
```

## 🎯 Command Bot

### Command Umum
- `/start` - Memulai percakapan dengan bot
- `/help` - Menampilkan bantuan

### Command Admin
- `/stats` - Menampilkan statistik bot (hanya admin)

## 👤 Fitur Admin

Bot memiliki fitur khusus untuk admin:
- 🔔 **Notifikasi**: Admin mendapat notifikasi saat ada user baru
- 📊 **Statistik**: Command `/stats` untuk melihat data bot
- 🚀 **Status**: Notifikasi saat bot mulai/berhenti

## 🔍 Troubleshooting

### Bot tidak merespons
1. Pastikan bot sudah dijalankan dengan `npm start`
2. Cek console untuk pesan error
3. Pastikan token di `config.js` sudah benar

### Error API
1. Pastikan koneksi internet stabil
2. Cek apakah API key aimlapi.com masih valid
3. Lihat log error di console

### Bot berhenti sendiri
1. Cek log error di console
2. Pastikan tidak ada syntax error di kode
3. Restart bot dengan `npm start`

## 🚀 Deployment

### Menjalankan di Server

1. Upload semua file ke server
2. Install Node.js di server
3. Install dependencies: `npm install`
4. Jalankan dengan PM2 untuk auto-restart:

```bash
npm install -g pm2
pm2 start bot.js --name "telegram-ai-bot"
pm2 startup
pm2 save
```

### Menjalankan 24/7

Untuk menjalankan bot 24/7, Anda bisa menggunakan:
- VPS (Virtual Private Server)
- Heroku
- Railway
- Render
- Atau layanan cloud lainnya

## 📝 Catatan

- Bot ini menggunakan polling mode, jadi akan terus berjalan dan mengecek pesan baru
- Setiap pesan akan diproses dan dikirim ke AI untuk mendapatkan respons
- Bot akan menampilkan indikator "sedang mengetik" saat memproses pesan
- Log aktivitas akan ditampilkan di console
- Admin akan mendapat notifikasi untuk aktivitas penting

## 🔒 Keamanan

- Token dan API key disimpan di file `config.js`
- Jangan share file `config.js` ke publik
- Gunakan `.gitignore` jika menggunakan Git

## 🤝 Kontribusi

Jika Anda ingin mengembangkan bot ini lebih lanjut, Anda bisa:
- Menambah fitur baru
- Memperbaiki bug
- Meningkatkan performa
- Menambah command baru

## 📄 Lisensi

ISC License

---

**Selamat menggunakan Bot Telegram AI! 🎉**

