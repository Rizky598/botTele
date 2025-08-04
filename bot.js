const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

const conversationHistory = {};
const MEMORY_FILE = path.join(__dirname, "otak.json");

// Load conversation history from file
function loadConversationHistory() {
    if (fs.existsSync(MEMORY_FILE)) {
        try {
            const data = fs.readFileSync(MEMORY_FILE, "utf8");
            Object.assign(conversationHistory, JSON.parse(data));
            console.log("🧠 Memori percakapan berhasil dimuat.");
        } catch (error) {
            console.error("❌ Error memuat memori percakapan:", error);
        }
    }
}

// Save conversation history to file
function saveConversationHistory() {
    try {
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(conversationHistory, null, 2), "utf8");
        console.log("💾 Memori percakapan berhasil disimpan.");
    } catch (error) {
        console.error("❌ Error menyimpan memori percakapan:", error);
    }
}

// Panggil saat bot dimulai
loadConversationHistory();

// Panggil saat bot dihentikan
process.on("SIGINT", () => {
    saveConversationHistory();
    console.log("\n🛑 Bot dihentikan...");
    bot.stopPolling();
    process.exit(0);
});

process.on("SIGTERM", () => {
    saveConversationHistory();
    console.log("\n🛑 Bot dihentikan...");
    bot.stopPolling();
    process.exit(0);
});


const axios = require('axios');
const config = require('./config');

// Ambil konfigurasi dari config.js
const TELEGRAM_TOKEN = config.telegram.token;
const ADMIN_ID = config.telegram.adminId;
const BLACKBOX_API_BASE = 'https://api.siputzx.my.id/api/ai/blackboxai';

// Inisialisasi bot
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

console.log('🤖 Bot Telegram AI sedang berjalan...');
console.log('📡 Menunggu pesan masuk...');


// Fungsi untuk memanggil AI API
async function getAIResponse(chatId, message) {
    try {
        if (!conversationHistory[chatId]) {
            conversationHistory[chatId] = [];
        }

        // Tambahkan pesan pengguna ke riwayat
        conversationHistory[chatId].push({ role: "user", content: message });

        // Batasi riwayat percakapan agar tidak terlalu panjang (misal, 5 pesan terakhir untuk menghindari batas karakter)
        const recentMessages = conversationHistory[chatId].slice(-5);

        const formattedMessages = recentMessages.map(msg => `${msg.role}: ${msg.content}`).join("\n");

        // Gabungkan system message dengan riwayat, tapi batasi total karakter
        let fullMessage = `${config.bot.systemMessage}\n\n${formattedMessages}`;
        
        // Jika pesan terlalu panjang, potong riwayat percakapan
        if (fullMessage.length > 900) {
            // Gunakan hanya pesan terakhir jika masih terlalu panjang
            const lastMessage = conversationHistory[chatId].slice(-1);
            const shortFormattedMessages = lastMessage.map(msg => `${msg.role}: ${msg.content}`).join("\n");
            fullMessage = `${config.bot.systemMessage}\n\n${shortFormattedMessages}`;
            
            // Jika masih terlalu panjang, gunakan hanya system message dan pesan user saat ini
            if (fullMessage.length > 900) {
                fullMessage = `${config.bot.systemMessage}\n\nuser: ${message}`;
            }
        }

        const response = await axios.get(`${BLACKBOX_API_BASE}?content=${encodeURIComponent(fullMessage)}`);
        const aiResponse = response.data.data;

        // Tambahkan respons AI ke riwayat
        conversationHistory[chatId].push({ role: "assistant", content: aiResponse });
        saveConversationHistory();

        return aiResponse;
    } catch (error) {
        console.error("❌ Error saat memanggil AI API:", error.response?.data || error.message);
        return "Maaf, saya sedang mengalami gangguan. Silakan coba lagi nanti.";
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
        const aiResponse = await getAIResponse(chatId, messageText);

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



// Handler untuk command /clear
bot.onText(/\/clear/, async (msg) => {
    const chatId = msg.chat.id;
    conversationHistory[chatId] = [];
    saveConversationHistory();
    await bot.sendMessage(chatId, 'Memori percakapan telah dihapus.');
    console.log(`🗑️ Memori percakapan untuk chat ${chatId} telah dihapus.`);
});




// Handler untuk command /pin
bot.onText(/\/pin (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const query = match[1];

    if (!query) {
        await bot.sendMessage(chatId, 'Harap berikan query untuk mencari gambar Pinterest. Contoh: /pin kucing lucu');
        return;
    }

    try {
        await bot.sendChatAction(chatId, 'upload_photo');
        const response = await axios.get(`https://api.vreden.my.id/api/pinterest?query=${encodeURIComponent(query)}`);
        const imageUrls = response.data.result;

        if (imageUrls && imageUrls.length > 0) {
            await bot.sendPhoto(chatId, imageUrls[0]);
        } else {
            await bot.sendMessage(chatId, `Tidak ditemukan gambar Pinterest untuk query: ${query}`);
        }
    } catch (error) {
        console.error('❌ Error saat memanggil API Pinterest:', error.response?.data || error.message);
        await bot.sendMessage(chatId, 'Maaf, terjadi kesalahan saat mencari gambar Pinterest. Silakan coba lagi nanti.');
    }
});

bot.onText(/\/pin/, async (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;
    if (messageText === '/pin') {
        await bot.sendMessage(chatId, 'Harap berikan query untuk mencari gambar Pinterest. Contoh: /pin kucing lucu');
    }
});




// Handler untuk command /bot
bot.onText(/\/bot/, async (msg) => {
    const chatId = msg.chat.id;

    // Pilih gambar acak dari daftar
    const randomImage = config.bot.botImages[Math.floor(Math.random() * config.bot.botImages.length)];

    // Kirim foto terlebih dahulu
    await bot.sendPhoto(chatId, randomImage);
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✨Atur Kepribadian', callback_data: 'set_personality' },
                    { text: '🔄Reset Percakapan', callback_data: 'reset_conversation' }
                ]
            ]
        }
    });
});




// Handler untuk callback query
bot.on("callback_query", async (callbackQuery) => {
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const data = callbackQuery.data;

    if (data === "reset_conversation") {
        conversationHistory[chatId] = [];
        saveConversationHistory();
        await bot.sendMessage(chatId, "Memori percakapan telah dihapus.");
        console.log(`🗑️ Memori percakapan untuk chat ${chatId} telah dihapus.`);
    } else if (data === "set_personality") {
            reply_markup: {
                inline_keyboard: [
                [
                    { text: "😎Santai & Humor", callback_data: "set_personality_santai_humor" },
                    { text: "🧐Formal & Informatif", callback_data: "set_personality_formal_informatif" }
                ],
                [
                    { text: "🎨Kreatif & Imajinatif", callback_data: "set_personality_kreatif_imajinatif" }
                ],
                [
                    { text: '🔄Reset Percakapan', callback_data: 'reset_conversation' }
                ]
            ]
            }
        });
    } else if (data.startsWith("set_personality_")) {
        const personalityKey = data.replace("set_personality_", "");
        const newSystemMessage = config.bot.personalities[personalityKey];
        if (newSystemMessage) {
            config.bot.systemMessage = newSystemMessage;
            // Optionally, save the updated config to file if you want persistence
            // fs.writeFileSync(path.join(__dirname, 'config.js'), `module.exports = ${JSON.stringify(config, null, 4)};`);
            await bot.sendMessage(chatId, `Kepribadian bot diatur ke: ${personalityKey.replace(/_/g, ' ').toUpperCase()}`);
            console.log(`✨ Kepribadian untuk chat ${chatId} diatur ke: ${personalityKey}`);
        } else {
            await bot.sendMessage(chatId, "Kepribadian tidak ditemukan.");
        }
    }
});


