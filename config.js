// Konfigurasi Bot Telegram AI
module.exports = {
    // Telegram Bot Configuration
    telegram: {
        token: '8396236044:AAENTI6cW3h20j9lG1XTw_fpZZiVaSeX95Q',
        adminId: 7693829809  // ID admin untuk notifikasi khusus
    },
    
    // AI ML API Configuration
    aiml: {
        apiKey: 'a2b985f996974e8fae1c6d3855c48103',
        apiBase: 'https://api.aimlapi.com/v1',
        model: 'gpt-3.5-turbo',
        maxTokens: 1000,
        temperature: 0.7
    },
    
    // Bot Settings
    bot: {
        systemMessage: 'Kamu adalah asisten AI yang ramah dan membantu. Jawab pertanyaan dengan bahasa Indonesia yang natural dan informatif.',
        welcomeMessage: `Halo! 👋

Saya adalah bot AI yang siap membantu Anda. Kirimkan pesan apa saja dan saya akan merespons menggunakan kecerdasan buatan.

Contoh yang bisa Anda tanyakan:
• Pertanyaan umum
• Minta bantuan menulis
• Diskusi topik tertentu
• Dan masih banyak lagi!

Silakan mulai dengan mengirim pesan Anda. 😊`,
        
        helpMessage: `🤖 Bantuan Bot AI

Cara menggunakan:
• Kirim pesan apa saja dan saya akan merespons
• Tidak perlu menggunakan command khusus
• Bot akan otomatis membalas setiap pesan Anda

Command yang tersedia:
/start - Memulai percakapan
/help - Menampilkan bantuan ini

Bot ini menggunakan AI untuk memberikan respons yang natural dan membantu. Silakan bertanya apa saja! 😊`
    }
};

