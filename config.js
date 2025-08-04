module.exports = {
    // Telegram Bot Configuration
    telegram: {
        token: '7943940179:AAHcd6jZ5Wt-jg9bxKU-YgQQbjlXRK6cqgU',
        adminId: 7693829809  // ID admin untuk notifikasi khusus
    },
    // Bot Settings
    bot: {
        systemMessage: `Kamu adalah asisten AI yang santai, humoris, dan suka melawak. Jawab pertanyaan dengan bahasa Indonesia yang natural, informatif, dan sisipkan lelucon atau gaya bahasa yang kocak. Jangan terlalu formal dan buat suasana percakapan jadi menyenangkan.`, // Default personality
        personalities: {
            santai_humor: `Kamu adalah asisten AI yang santai, humoris, dan suka melawak. Jawab pertanyaan dengan bahasa Indonesia yang natural, informatif, dan sisipkan lelucon atau gaya bahasa yang kocak. Jangan terlalu formal dan buat suasana percakapan jadi menyenangkan.`, 
            formal_informatif: `Kamu adalah asisten AI yang formal dan informatif. Jawab pertanyaan dengan bahasa Indonesia yang lugas, jelas, dan berdasarkan fakta. Hindari humor atau gaya bahasa yang terlalu santai.`, 
            kreatif_imajinatif: `Kamu adalah asisten AI yang kreatif dan imajinatif. Jawab pertanyaan dengan bahasa Indonesia yang unik, inovatif, dan penuh ide. Gunakan metafora, analogi, atau cerita untuk menjelaskan konsep.`
        },
        welcomeMessage: `Halo! 👋\n\nSaya adalah bot AI yang siap membantu Anda. Kirimkan pesan apa saja dan saya akan merespons menggunakan kecerdasan buatan.\n\nContoh yang bisa Anda tanyakan:\n• Pertanyaan umum\n• Minta bantuan menulis\n• Diskusi topik tertentu\n• Dan masih banyak lagi!\n\nSilakan mulai dengan mengirim pesan Anda. 😊`,
        helpMessage: `🤖 Bantuan Bot AI\n\nCara menggunakan:\n• Kirim pesan apa saja dan saya akan merespons\n• Tidak perlu menggunakan command khusus\n• Bot akan otomatis membalas setiap pesan Anda\n\nCommand yang tersedia:\n/start - Memulai percakapan\n/help - Menampilkan bantuan ini\n/pin <query> - Mencari gambar dari Pinterest\n/clear - Menghapus memori percakapan\n/bot - Mengatur kepribadian bot dan mereset percakapan\n\nBot ini menggunakan AI untuk memberikan respons yang natural dan membantu. Silakan bertanya apa saja! 😊`,
        botImages: [
            "https://i.pinimg.com/736x/ad/da/22/adda223342ccd8396360bfe3a7923ab0.jpg",
            "https://i.pinimg.com/736x/a2/a5/83/a2a583044d2f80a41281395b56e11b31.jpg",
            "https://i.pinimg.com/736x/15/23/76/152376c92b3c1c23f17df58e20865aee.jpg",
            "https://i.pinimg.com/736x/04/61/a6/0461a654a1f6bbf4349b01fa1648e8e8.jpg",
            "https://i.pinimg.com/736x/93/e7/4a/93e74a51bb4ba2c16df44a4564a013af.jpg",
            "https://i.pinimg.com/736x/13/8a/19/138a19ab27d216ffc16eacfc45db7421.jpg",
            "https://i.pinimg.com/736x/0d/64/df/0d64df22e5fc22c132da0d2e3cac98ea.jpg",
            "https://i.pinimg.com/736x/1d/f0/e5/1df0e5ea3c3631fde75922c690a4cf36.jpg",
            "https://i.pinimg.com/736x/93/43/98/93439882ac6b9a155e7d480a0738240a.jpg",
            "https://i.pinimg.com/736x/0a/37/1e/0a371ee75f5c74f4abd1859970320c9e.jpg",
            "https://i.pinimg.com/736x/fc/0c/aa/fc0caa6a7e00ced3ba926ada284a5d80.jpg",
            "https://i.pinimg.com/736x/03/84/1d/03841db9e2c015fb7712db6c6ba18912.jpg",
            "https://i.pinimg.com/736x/97/ac/da/97acda7d6733c9d81564e126fd89044c.jpg",
            "https://i.pinimg.com/736x/72/80/ab/7280ab849c9cacc853eee1c7e137060a.jpg",
            "https://i.pinimg.com/736x/ea/18/f9/ea18f97107c5a450a63ff3ea14e6c77f.jpg",
            "https://i.pinimg.com/736x/2e/be/d4/2ebed47660577bba6f6e5881179134b4.jpg"
        ]
    }
};

