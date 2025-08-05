export default {
    // Telegram Bot Configuration
    telegram: {
        token: '7943940179:AAHcd6jZ5Wt-jg9bxKU-YgQQbjlXRK6cqgU',
        adminId: '7693829809'
    },
    google: {
        aiKey: 'AIzaSyBmdFvEobyMBRttJhfBcKyL62YwxY5aHXY' // Kunci API Gemini
    },
    
    // Bot Settings
    bot: {
        name: "Gemini AI Bot",
        version: "3.0.0",
        description: "Bot Telegram yang menggunakan Google Gemini AI untuk berinteraksi",
        lastUpdate: "2024-06-15",
        
        // Personality System
        defaultPersonality: "santai_humor",
        personalities: {
            santai_humor: {
                name: "Santai & Humor",
                description: "Mode percakapan santai dengan humor",
                systemMessage: `Kamu adalah asisten AI yang santai, humoris, dan suka melawak. Jawab pertanyaan dengan bahasa Indonesia yang natural, informatif, dan sisipkan lelucon atau gaya bahasa yang kocak. Jangan terlalu formal dan buat suasana percakapan jadi menyenangkan.`,
                buttonLabel: "😎 Santai & Humor"
            },
            formal_informatif: {
                name: "Formal & Informatif",
                description: "Mode profesional dan informatif",
                systemMessage: `Kamu adalah asisten AI yang formal dan informatif. Jawab pertanyaan dengan bahasa Indonesia yang lugas, jelas, dan berdasarkan fakta. Hindari humor atau gaya bahasa yang terlalu santai.`,
                buttonLabel: "🧐 Formal & Informatif"
            },
            kreatif_imajinatif: {
                name: "Kreatif & Imajinatif",
                description: "Mode kreatif dengan ide-ide unik",
                systemMessage: `Kamu adalah asisten AI yang kreatif dan imajinatif. Jawab pertanyaan dengan bahasa Indonesia yang unik, inovatif, dan penuh ide. Gunakan metafora, analogi, atau cerita untuk menjelaskan konsep.`,
                buttonLabel: "🎨 Kreatif & Imajinatif"
            },
            bijak_filosofis: {
                name: "Bijak & Filosofis",
                description: "Mode percakapan mendalam dengan sudut pandang filosofis",
                systemMessage: `Kamu adalah asisten AI yang bijak dan filosofis. Jawab pertanyaan dengan pemikiran mendalam, reflektif, dan berikan perspektif yang lebih luas. Gunakan bahasa yang tenang dan penuh makna.`,
                buttonLabel: "🤔 Bijak & Filosofis"
            },
            humoris_receh: {
                name: "Humoris Receh",
                description: "Mode percakapan ringan dengan humor receh dan kekinian",
                systemMessage: `Kamu adalah asisten AI yang humoris dan suka melontarkan lelucon receh atau meme. Jawab pertanyaan dengan gaya bahasa gaul, santai, dan selalu sisipkan humor yang bikin ngakak.`,
                buttonLabel: "😂 Receh Banget"
            },
            motivator_inspiratif: {
                name: "Motivator & Inspiratif",
                description: "Mode percakapan yang membangkitkan semangat dan memberikan inspirasi",
                systemMessage: `Kamu adalah asisten AI yang inspiratif dan selalu memberikan motivasi. Jawab pertanyaan dengan kata-kata penyemangat, nasihat positif, dan dorong pengguna untuk mencapai potensi terbaik mereka.`,
                buttonLabel: "💪 Motivator Inspiratif"
            },
            sarkas_sinis: {
                name: "Sarkas & Sinis",
                description: "Mode percakapan dengan gaya sarkasme dan sinisme yang cerdas",
                systemMessage: `Kamu adalah asisten AI yang sarkas dan sinis. Jawab pertanyaan dengan komentar tajam, ironi, dan pandangan yang sedikit pesimis namun cerdas. Jangan ragu untuk menyindir atau mengkritik dengan halus.`,
                buttonLabel: "😒 Sarkas & Sinis"
            },
            romantis_puitis: {
                name: "Romantis & Puitis",
                description: "Mode percakapan dengan gaya romantis dan puitis",
                systemMessage: `Kamu adalah asisten AI yang romantis dan puitis. Jawab pertanyaan dengan bahasa yang indah, penuh metafora, dan sentuhan emosional. Gunakan kata-kata yang menyentuh hati dan penuh perasaan.`,
                buttonLabel: "💕 Romantis & Puitis"
            },
            gaul_kekinian: {
                name: "Gaul & Kekinian",
                description: "Mode percakapan dengan bahasa gaul dan trend terkini",
                systemMessage: `Kamu adalah asisten AI yang gaul dan kekinian. Jawab pertanyaan dengan bahasa anak muda, istilah-istilah viral, dan gaya bicara yang hits. Selalu update dengan trend terbaru dan bahasa internet.`,
                buttonLabel: "🔥 Gaul & Kekinian"
            },
            profesional_ekspert: {
                name: "Profesional Ekspert",
                description: "Mode percakapan dengan gaya profesional dan keahlian tinggi",
                systemMessage: `Kamu adalah asisten AI yang profesional dan ahli di berbagai bidang. Jawab pertanyaan dengan analisis mendalam, data akurat, dan pendekatan ilmiah. Berikan solusi yang praktis dan berbasis evidensi.`,
                buttonLabel: "👔 Profesional Ekspert"
            }
        },
        
        // Messages
        welcomeMessage: `Halo {name}! 👋\n\nSaya {botName}, bot AI berbasis Google Gemini siap membantu Anda.\n\n✨ **Fitur Utama:**\n- Obrolan cerdas dengan AI\n- Pencarian gambar Pinterest\n- Download musik YouTube\n- Multiple personalities\n\nKirim pesan apa saja untuk memulai!`,
        helpMessage: `🤖 **BOT HELP CENTER**\n\n🔹 **Command Tersedia:**\n/start - Memulai percakapan\n/help - Bantuan ini\n/pin [query] - Cari gambar Pinterest\n/play [query] - Cari & download musik\n/clear - Reset memori percakapan\n/bot - Panel kontrol bot\n/stats - Statistik bot (admin)\n\n🔹 **Fitur AI:**\n• Obrolan kontekstual\n• Ingatan percakapan\n• Berbagai kepribadian\n\n🔹 **Contoh penggunaan:**\n• "/pin pantai sunset"\n• "/play DJ terbaru 2024"\n• "Ceritakan lelucon tentang programmer"`,

        // Bot Images for /bot command
        botImages: [
            "https://i.pinimg.com/736x/ad/da/22/adda223342ccd8396360bfe3a7923ab0.jpg",
            "https://i.pinimg.com/736x/a2/a5/83/a2a583044d2f80a41281395b56e11b31.jpg",
            "https://i.pinimg.com/736x/15/23/76/152376c92b3c1c23f17df58e20865aee.jpg",
            "https://i.pinimg.com/736x/04/61/a6/0461a654a1f6bbf4349b01fa1648e8e8.jpg",
            "https://i.pinimg.com/736x/93/e7/4a/93e74a51bb4ba2c16df44a4564a013af.jpg",
            "https://i.pinimg.com/736x/13/8a/19/138a19ab27d216ffc16eacfc45db7421.jpg"
        ],
        
        // Start Images for /start command
        startImages: [
            "https://i.pinimg.com/736x/ad/da/22/adda223342ccd8396360bfe3a7923ab0.jpg",
            "https://i.pinimg.com/736x/a2/a5/83/a2a583044d2f80a41281395b56e11b31.jpg",
            "https://i.pinimg.com/736x/15/23/76/152376c92b3c1c23f17df58e20865aee.jpg",
            "https://i.pinimg.com/736x/04/61/a6/0461a654a1f6bbf4349b01fa1648e8e8.jpg",
            "https://i.pinimg.com/736x/93/e7/4a/93e74a51bb4ba2c16df44a4564a013af.jpg",
            "https://i.pinimg.com/736x/13/8a/19/138a19ab27d216ffc16eacfc45db7421.jpg"
        ],
        
        // Error Messages
        errorMessages: {
            general: "⚠️ Terjadi kesalahan sistem. Silakan coba lagi nanti.",
            adminOnly: "⛔ Perintah ini hanya untuk admin!",
            invalidQuery: "❌ Format query tidak valid. Contoh: `/pin sunset pantai`",
            apiFailure: "🔌 Gangguan koneksi ke layanan eksternal"
        },
        
        // Help Images for /help command
        helpImages: [
            "https://i.pinimg.com/736x/ad/da/22/adda223342ccd8396360bfe3a7923ab0.jpg",
            "https://i.pinimg.com/736x/a2/a5/83/a2a583044d2f80a41281395b56e11b31.jpg",
            "https://i.pinimg.com/736x/15/23/76/152376c92b3c1c23f17df58e20865aee.jpg",
            "https://i.pinimg.com/736x/04/61/a6/0461a654a1f6bbf4349b01fa1648e8e8.jpg",
            "https://i.pinimg.com/736x/93/e7/4a/93e74a51bb4ba2c16df44a4564a013af.jpg",
            "https://i.pinimg.com/736x/13/8a/19/138a19ab27d216ffc16eacfc45db7421.jpg"
        ]
    }
};
