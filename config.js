// =============================================
// 🤖 Gemini AI Telegram Bot Configuration
// =============================================
// File ini berisi semua konfigurasi bot: token, API key,
// pengaturan bot, daftar kepribadian, pesan bawaan, dan template error.
// =============================================
export default {
    // ==========================
    // 🔹 Telegram Bot Settings
    // ==========================
    telegram: {
        token: '7943940179:AAHcd6jZ5Wt-jg9bxKU-YgQQbjlXRK6cqgU', // Token dari BotFather
        adminId: '7693829809' // ID Telegram admin utama
    },
    // ==========================
    // 🔹 Google AI API Settings
    // ==========================
    google: {
        aiKey: 'AIzaSyBmdFvEobyMBRttJhfBcKyL62YwxY5aHXY' // API Key Google Gemini AI
    },
    // ==========================
    // 🔹 Panel API Settings
    // ==========================
    panel: {
        url: 'https://panel.example.com', // URL panel utama
        port: '8080', // Port panel
        apiUrl: 'https://panel.example.com/api/users', // URL API untuk membuat user
        apiKey: 'your_panel_api_key_here' // API Key untuk akses panel
    },
    // ==========================
    // 🔹 Bot General Settings
    // ==========================
    bot: {
        name: "Gemini AI Bot", // Nama bot
        version: "3.0.0", // Versi bot
        description: "Bot Telegram yang menggunakan Google Gemini AI untuk berinteraksi",
        lastUpdate: "2024-06-15", // Tanggal update terakhir
        // --------------------------
        // 🎭 Personality System
        // --------------------------
        defaultPersonality: "santai_humor", // Mode bawaan
        personalities: {
            santai_humor: {
                name: "Santai & Humor",
                description: "Mode percakapan santai dengan humor",
                systemMessage: `Kamu adalah asisten AI yang santai, humoris, dan suka melawak...`,
                buttonLabel: "😎 Santai & Humor"
            },
            formal_informatif: {
                name: "Formal & Informatif",
                description: "Mode profesional dan informatif",
                systemMessage: `Kamu adalah asisten AI yang formal dan informatif...`,
                buttonLabel: "🧐 Formal & Informatif"
            },
            kreatif_imajinatif: {
                name: "Kreatif & Imajinatif",
                description: "Mode kreatif dengan ide-ide unik",
                systemMessage: `Kamu adalah asisten AI yang kreatif dan imajinatif...`,
                buttonLabel: "🎨 Kreatif & Imajinatif"
            },
            bijak_filosofis: {
                name: "Bijak & Filosofis",
                description: "Mode percakapan mendalam dengan sudut pandang filosofis",
                systemMessage: `Kamu adalah asisten AI yang bijak dan filosofis...`,
                buttonLabel: "🤔 Bijak & Filosofis"
            },
            humoris_receh: {
                name: "Humoris Receh",
                description: "Mode humor ringan dan receh",
                systemMessage: `Kamu adalah asisten AI yang humoris dan suka melontarkan lelucon receh...`,
                buttonLabel: "😂 Receh Banget"
            },
            motivator_inspiratif: {
                name: "Motivator & Inspiratif",
                description: "Memberikan motivasi dan semangat",
                systemMessage: `Kamu adalah asisten AI yang inspiratif...`,
                buttonLabel: "💪 Motivator Inspiratif"
            },
            sarkas_sinis: {
                name: "Sarkas & Sinis",
                description: "Mode percakapan dengan sindiran halus",
                systemMessage: `Kamu adalah asisten AI yang sarkas dan sinis...`,
                buttonLabel: "😒 Sarkas & Sinis"
            },
            romantis_puitis: {
                name: "Romantis & Puitis",
                description: "Mode romantis penuh metafora",
                systemMessage: `Kamu adalah asisten AI yang romantis dan puitis...`,
                buttonLabel: "💕 Romantis & Puitis"
            },
            gaul_kekinian: {
                name: "Gaul & Kekinian",
                description: "Bahasa anak muda & trend",
                systemMessage: `Kamu adalah asisten AI yang gaul dan kekinian...`,
                buttonLabel: "🔥 Gaul & Kekinian"
            },
            profesional_ekspert: {
                name: "Profesional Ekspert",
                description: "Analisis mendalam dan data akurat",
                systemMessage: `Kamu adalah asisten AI yang profesional dan ahli...`,
                buttonLabel: "👔 Profesional Ekspert"
            }
        },
        // --------------------------
        // 💬 Default Messages
        // --------------------------
        welcomeMessage: `
╭─⊷ 👋 Selamat Datang {name}!
│Aku 𓆩۞𓆪𝐑𝐢𝐳𝐤𝐲-𝐀𝐢𓆩۞𓆪
│bot AI powered by Google Gemini 🤖  
│Siap nemenin kamu kapan aja! 😄  
│
│ ✨ Fitur Utama:
│ ├ Chat AI pintar  
│ ├ Gambar dari Pinterest  
│ ├ Download musik YouTube  
│ ├ Download video TikTok tanpa WM  
│ ├ Screenshot website  
│ ├ Kepribadian fleksibel  
│ ├ Ingat obrolan kamu 🧠  
│ └ /hentai 🔞 (fitur dewasa)
│
│ 🚀 Kirim pesan untuk mulai ngobrol  
│ 📌 /bot untuk menu fitur  
│ 📖 /help untuk info lainnya
╰─⊷`,
        helpMessage: `
╭─🤖 BOT HELP CENTER ─╮
🔹 Command:
├ /start – Mulai bot  
├ /help – Bantuan  
├ /bot – Menu fitur  
├ /clear – Reset percakapan  
├ /ssweb [url] – Screenshot web  
├ /tiktok [link] – Download TikTok
└ /createpanel – Buat akun panel

🔹 Fitur AI:
├ Chat pintar  
├ Ingat obrolan  
├ Kepribadian fleksibel  
└ /hentai 🔞 (dewasa)

🔹 Media:
├ /pin [judul] – Gambar Pinterest  
└ /play [judul] – Musik YouTube

🔹 Panel:
└ /createpanel – Membuat akun panel dengan berbagai paket

🔹 Contoh:
• /pin anime girl  
• /play lofi chill  
• /ssweb https://example.com  
• /tiktok https://vm.tiktok.com/xxxxx
• /createpanel
╰────────────────╯`,
        // --------------------------
        // ⚠️ Error Messages
        // --------------------------
        errorMessages: {
            general: "⚠️ Terjadi kesalahan sistem. Silakan coba lagi nanti.",
            adminOnly: "⛔ Perintah ini hanya untuk admin!",
            invalidQuery: "❌ Format query tidak valid. Contoh: `/pin sunset pantai`",
            apiFailure: "🔌 Gangguan koneksi ke layanan eksternal",
            aiDisabled: "Maaf, AI sedang dinonaktifkan. Silakan aktifkan kembali untuk melanjutkan percakapan."
        },
        // --------------------------
        // 👥 Group Messages
        // --------------------------
    groupMessages: {
    botAddedMessage: "🤖 Halo semua! Terima kasih sudah mengundang saya ke grup ini 🎉 Tenang... saya cuma bot, nggak bakal minta traktir kopi kok ☕😆 Siap membantu 24/7 tanpa lembur!", // Pesan saat bot ditambahkan ke grup
    welcomeMessage: "👋 Selamat datang, {name}! Selamat bergabung di 👑𝐑𝐈𝐙𝐊𝐘 𝐀𝐏𝐏 𝐒𝐓𝐎𝐑𝐄👑 🚀 Anggap aja ini rumah sendiri... tapi jangan bawa kulkas pulang ya 😜", // Pesan sambutan anggota baru
    farewellMessage: "👋 Sampai jumpa, {name}... Kami akan merindukanmu di 👑𝐑𝐈𝐙𝐊𝐘 𝐀𝐏𝐏 𝐒𝐓𝐎𝐑𝐄👑 Ingat... pintu selalu terbuka, tapi jendela jangan dibuka, nanti nyamuk masuk 🦟😂" // Pesan perpisahan anggota keluar
       }
    }
};
