const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const config = require('./config');

// Ambil konfigurasi dari config.js
const TELEGRAM_TOKEN = config.telegram.token;
const ADMIN_ID = config.telegram.adminId;
const AIML_API_KEY = config.aiml.apiKey;
const AIML_API_BASE = config.aiml.apiBase;
const AI_MODEL = config.aiml.model;
const MAX_TOKENS = config.aiml.maxTokens;
const TEMPERATURE = config.aiml.temperature;

// Inisialisasi bot
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

console.log('🤖 Bot Telegram AI sedang berjalan...');
console.log('📡 Menunggu pesan masuk...');
console.log(`👤 Admin ID: ${ADMIN_ID}`);

// Fungsi untuk memanggil AI API
async function getAIResponse(message) {
    try {
        const response = await axios.post(`${AIML_API_BASE}/chat/completions`, {
            model: AI_MODEL,
            messages: [
                {
                    role: 'system',
                    content: config.bot.systemMessage
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            max_tokens: MAX_TOKENS,
            temperature: TEMPERATURE
        }, {
            headers: {
                'Authorization': `Bearer ${AIML_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('❌ Error saat memanggil AI API:', error.response?.data || error.message);
        return 'Maaf, saya sedang mengalami gangguan. Silakan coba lagi nanti.';
    }
}

// Fungsi untuk mengirim notifikasi ke admin
async function notifyAdmin(message) {
    try {
        await bot.sendMessage(ADMIN_ID, `🔔 Admin Notification:\n${message}`);
    } catch (error) {
        console.error('❌ Error mengirim notifikasi ke admin:', error.message);
    }
}

// Handler untuk pesan masuk
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;
    const userName = msg.from.first_name || 'User';
    const userId = msg.from.id;

    // Skip jika pesan adalah command bot
    if (messageText && messageText.startsWith('/')) {
        return;
    }

    // Skip jika bukan pesan teks
    if (!messageText) {
        return;
    }

    console.log(`📨 Pesan dari ${userName} (${chatId}): ${messageText}`);

    // Notifikasi ke admin jika ada user baru
    if (userId !== ADMIN_ID) {
        const isNewUser = !bot.userCache || !bot.userCache.has(userId);
        if (isNewUser) {
            if (!bot.userCache) bot.userCache = new Set();
            bot.userCache.add(userId);
            await notifyAdmin(`User baru: ${userName} (ID: ${userId})\nPesan: ${messageText}`);
        }
    }

    try {
        // Kirim indikator "sedang mengetik"
        await bot.sendChatAction(chatId, 'typing');

        // Dapatkan respons dari AI
        const aiResponse = await getAIResponse(messageText);

        // Kirim respons ke user
        await bot.sendMessage(chatId, aiResponse);

        console.log(`✅ Respons terkirim ke ${userName}: ${aiResponse.substring(0, 50)}...`);
    } catch (error) {
        console.error('❌ Error saat memproses pesan:', error);
        await bot.sendMessage(chatId, 'Maaf, terjadi kesalahan saat memproses pesan Anda.');
    }
});

// Handler untuk command /start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || 'User';
    const userId = msg.from.id;
    
    const welcomeMessage = config.bot.welcomeMessage.replace('Halo!', `Halo ${userName}!`);

    await bot.sendMessage(chatId, welcomeMessage);
    console.log(`👋 User: ${userName} (${chatId}) memulai bot`);

    // Notifikasi ke admin
    if (userId !== ADMIN_ID) {
        await notifyAdmin(`${userName} (ID: ${userId}) memulai bot`);
    }
});

// Handler untuk command /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, config.bot.helpMessage);
});

// Command khusus admin /stats
bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Hanya admin yang bisa menggunakan command ini
    if (userId !== ADMIN_ID) {
        await bot.sendMessage(chatId, 'Anda tidak memiliki akses ke command ini.');
        return;
    }

    const userCount = bot.userCache ? bot.userCache.size : 0;
    const statsMessage = `📊 Statistik Bot:
👥 Total pengguna: ${userCount}
🤖 Status: Aktif
⚡ Model AI: ${AI_MODEL}
🔧 Admin ID: ${ADMIN_ID}`;

    await bot.sendMessage(chatId, statsMessage);
});

// Error handler
bot.on('error', (error) => {
    console.error('❌ Bot error:', error);
});

// Handler saat bot mulai polling
bot.on('polling_error', (error) => {
    console.error('❌ Polling error:', error);
});

// Notifikasi saat bot mulai
(async () => {
    try {
        const botInfo = await bot.getMe();
        console.log(`✅ Bot berhasil terhubung: @${botInfo.username}`);
        await notifyAdmin(`🚀 Bot ${botInfo.first_name} (@${botInfo.username}) telah aktif!`);
    } catch (error) {
        console.error('❌ Error saat memulai bot:', error);
    }
})();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Bot dihentikan...');
    await notifyAdmin('🛑 Bot telah dihentikan');
    bot.stopPolling();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Bot dihentikan...');
    await notifyAdmin('🛑 Bot telah dihentikan');
    bot.stopPolling();
    process.exit(0);
});

