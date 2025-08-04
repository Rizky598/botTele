const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");
const axios = require('axios');
const config = require('./config');

// --- KONFIGURASI & INISIALISASI ---

const conversationHistory = {};
const MEMORY_FILE = path.join(__dirname, "otak.json");

// Ambil konfigurasi dari config.js
const TELEGRAM_TOKEN = config.telegram.token;
const ADMIN_ID = config.telegram.adminId;
const BLACKBOX_API_BASE = 'https://api.siputzx.my.id/api/ai/blackboxai';

// Inisialisasi bot
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// --- MANAJEMEN MEMORI PERCAKAPAN ---

// Muat riwayat percakapan dari file
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

// Simpan riwayat percakapan ke file
function saveConversationHistory() {
    try {
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(conversationHistory, null, 2), "utf8");
        console.log("💾 Memori percakapan berhasil disimpan.");
    } catch (error) {
        console.error("❌ Error menyimpan memori percakapan:", error);
    }
}

// --- FUNGSI UTAMA BOT ---

// Fungsi untuk memanggil AI API
async function getAIResponse(chatId, message) {
    try {
        if (!conversationHistory[chatId]) {
            conversationHistory[chatId] = [];
        }

        conversationHistory[chatId].push({ role: "user", content: message });
        const recentMessages = conversationHistory[chatId].slice(-5);
        const formattedMessages = recentMessages.map(msg => `${msg.role}: ${msg.content}`).join("\n");
        let fullMessage = `${config.bot.systemMessage}\n\n${formattedMessages}`;

        if (fullMessage.length > 900) {
            const lastMessage = conversationHistory[chatId].slice(-1);
            const shortFormattedMessages = lastMessage.map(msg => `${msg.role}: ${msg.content}`).join("\n");
            fullMessage = `${config.bot.systemMessage}\n\n${shortFormattedMessages}`;
            if (fullMessage.length > 900) {
                fullMessage = `${config.bot.systemMessage}\n\nuser: ${message}`;
            }
        }

        const response = await axios.get(`${BLACKBOX_API_BASE}?content=${encodeURIComponent(fullMessage)}`);
        const aiResponse = response.data.data;

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

// --- HANDLER PESAN & COMMAND ---

// Handler untuk pesan masuk umum
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;
    const userName = msg.from.first_name || 'User';
    const userId = msg.from.id;

    if (!messageText || messageText.startsWith('/')) {
        return;
    }

    console.log(`📨 Pesan dari ${userName} (${chatId}): ${messageText}`);

    if (userId !== ADMIN_ID) {
        const isNewUser = !bot.userCache || !bot.userCache.has(userId);
        if (isNewUser) {
            if (!bot.userCache) bot.userCache = new Set();
            bot.userCache.add(userId);
            await notifyAdmin(`User baru: ${userName} (ID: ${userId})\nPesan: ${messageText}`);
        }
    }

    try {
        await bot.sendChatAction(chatId, 'typing');
        const aiResponse = await getAIResponse(chatId, messageText);
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

    if (userId !== ADMIN_ID) {
        await notifyAdmin(`${userName} (ID: ${userId}) memulai bot`);
    }
});

// Handler untuk command /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, config.bot.helpMessage);
});

// Handler untuk command /stats (khusus admin)
bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (userId !== ADMIN_ID) {
        await bot.sendMessage(chatId, 'Anda tidak memiliki akses ke command ini.');
        return;
    }

    const userCount = bot.userCache ? bot.userCache.size : 0;
    const statsMessage = `📊 Statistik Bot:\n👥 Total pengguna: ${userCount}\n🤖 Status: Aktif\n🔧 Admin ID: ${ADMIN_ID}`;
    await bot.sendMessage(chatId, statsMessage);
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
bot.onText(/\/pin(?: (.+))?/, async (msg, match) => {
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
            await bot.sendPhoto(chatId, imageUrls[0], { caption: `Hasil untuk: ${query}` });
        } else {
            await bot.sendMessage(chatId, `Tidak ditemukan gambar Pinterest untuk query: ${query}`);
        }
    } catch (error) {
        console.error('❌ Error saat memanggil API Pinterest:', error.response?.data || error.message);
        await bot.sendMessage(chatId, 'Maaf, terjadi kesalahan saat mencari gambar Pinterest.');
    }
});

// Handler untuk command /bot
bot.onText(/\/bot/, async (msg) => {
    const chatId = msg.chat.id;
    const randomImage = config.bot.botImages[Math.floor(Math.random() * config.bot.botImages.length)];

    // Kirim foto dengan inline keyboard
    await bot.sendPhoto(chatId, randomImage, {
        caption: 'Atur bot sesuai keinginanmu!',
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

// --- HANDLER CALLBACK QUERY ---

bot.on("callback_query", async (callbackQuery) => {
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const data = callbackQuery.data;

    await bot.answerCallbackQuery(callbackQuery.id); // Memberi tahu Telegram bahwa callback sudah diterima

    if (data === "reset_conversation") {
        conversationHistory[chatId] = [];
        saveConversationHistory();
        await bot.sendMessage(chatId, "Memori percakapan telah dihapus.");
        console.log(`🗑️ Memori percakapan untuk chat ${chatId} telah dihapus.`);
    } else if (data === "set_personality") {
        await bot.editMessageReplyMarkup({
            inline_keyboard: [
                [{ text: "😎Santai & Humor", callback_data: "set_personality_santai_humor" }],
                [{ text: "🧐Formal & Informatif", callback_data: "set_personality_formal_informatif" }],
                [{ text: "🎨Kreatif & Imajinatif", callback_data: "set_personality_kreatif_imajinatif" }],
                [{ text: 'Kembali', callback_data: 'back_to_main' }]
            ]
        }, {
            chat_id: chatId,
            message_id: message.message_id
        });
    } else if (data.startsWith("set_personality_")) {
        const personalityKey = data.replace("set_personality_", "");
        const newSystemMessage = config.bot.personalities[personalityKey];
        if (newSystemMessage) {
            config.bot.systemMessage = newSystemMessage;
            await bot.sendMessage(chatId, `Kepribadian bot diatur ke: ${personalityKey.replace(/_/g, ' ').toUpperCase()}`);
            console.log(`✨ Kepribadian untuk chat ${chatId} diatur ke: ${personalityKey}`);
        } else {
            await bot.sendMessage(chatId, "Kepribadian tidak ditemukan.");
        }
    } else if (data === 'back_to_main') {
        await bot.editMessageReplyMarkup({
            inline_keyboard: [
                [
                    { text: '✨Atur Kepribadian', callback_data: 'set_personality' },
                    { text: '🔄Reset Percakapan', callback_data: 'reset_conversation' }
                ]
            ]
        }, {
            chat_id: chatId,
            message_id: message.message_id
        });
    }
});

// --- PENANGANAN ERROR & PROSES ---

bot.on('error', (error) => console.error('❌ Bot error:', error));
bot.on('polling_error', (error) => console.error('❌ Polling error:', error));

function gracefulShutdown() {
    saveConversationHistory();
    console.log('\n🛑 Bot dihentikan...');
    notifyAdmin('🛑 Bot telah dihentikan');
    bot.stopPolling().then(() => process.exit(0));
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// --- PROSES STARTUP ---

(async () => {
    try {
        loadConversationHistory();
        const botInfo = await bot.getMe();
        console.log('🤖 Bot Telegram AI sedang berjalan...');
        console.log(`✅ Bot berhasil terhubung: @${botInfo.username}`);
        console.log('📡 Menunggu pesan masuk...');
        await notifyAdmin(`🚀 Bot ${botInfo.first_name} (@${botInfo.username}) telah aktif!`);
    } catch (error) {
        console.error('❌ Error saat memulai bot:', error);
        process.exit(1);
    }
})();
