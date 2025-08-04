const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const config = require("./config");

// --- KONFIGURASI & INISIALISASI ---
const conversationHistory = {};
const MEMORY_FILE = path.join(__dirname, "otak.json");

// Ambil konfigurasi dari config.js
const TELEGRAM_TOKEN = config.telegram.token;
const ADMIN_ID = config.telegram.adminId;
const GOOGLE_AI_API_KEY = "AIzaSyDhmCzfIJ7YbUpl1m0uIvHuEvt2yf-FC6A";
const GOOGLE_AI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

// Inisialisasi bot
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// --- MANAJEMEN MEMORI PERCAKAPAN ---
// Muat riwayat percakapan dari file
function loadConversationHistory() {
    if (fs.existsSync(MEMORY_FILE)) {
        try {
            const data = fs.readFileSync(MEMORY_FILE, "utf8");
            const parsedData = JSON.parse(data);
            // Pastikan setiap pesan memiliki timestamp
            for (const chatId in parsedData) {
                conversationHistory[chatId] = parsedData[chatId].map(msg => ({
                    ...msg,
                    timestamp: msg.timestamp || Date.now() // Tambahkan timestamp jika belum ada
                }));
            }
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

// Fungsi untuk mendapatkan konteks percakapan yang relevan
function getRelevantConversationContext(chatId, maxTokens = 900) {
    if (!conversationHistory[chatId]) {
        return [];
    }

    let currentTokens = 0;
    const relevantMessages = [];
    // Ambil pesan terbaru terlebih dahulu
    for (let i = conversationHistory[chatId].length - 1; i >= 0; i--) {
        const msg = conversationHistory[chatId][i];
        const messageContent = `${msg.role}: ${msg.content}\n`;
        const messageTokens = messageContent.length; // Estimasi token berdasarkan panjang karakter

        if (currentTokens + messageTokens <= maxTokens) {
            relevantMessages.unshift(msg); // Tambahkan ke depan array untuk menjaga urutan
            currentTokens += messageTokens;
        } else {
            break; // Berhenti jika melebihi batas token
        }
    }
    return relevantMessages;
}

// --- FUNGSI UTAMA BOT ---
// Fungsi untuk memanggil AI API
async function getAIResponse(chatId, message) {
    try {
        if (!conversationHistory[chatId]) {
            conversationHistory[chatId] = [];
        }
        // Tambahkan pesan pengguna dengan timestamp
        conversationHistory[chatId].push({ role: "user", content: message, timestamp: Date.now() });

        const relevantMessages = getRelevantConversationContext(chatId);
        const formattedMessages = relevantMessages.map(msg => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }]
        }));

        const requestBody = {
            contents: formattedMessages
        };

        const response = await axios.post(
            `${GOOGLE_AI_API_URL}?key=${GOOGLE_AI_API_KEY}`,
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        const aiResponse = response.data.candidates[0].content.parts[0].text;

        // Tambahkan respons AI dengan timestamp
        conversationHistory[chatId].push({ role: "assistant", content: aiResponse, timestamp: Date.now() });
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
        console.error("❌ Error mengirim notifikasi ke admin:", error.message);
    }
}

// --- HANDLER PESAN & COMMAND ---
// Handler untuk pesan masuk umum
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;
    const userName = msg.from.first_name || "User";
    const userId = msg.from.id;

    if (!messageText || messageText.startsWith("/")) {
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
        await bot.sendChatAction(chatId, "typing");
        const aiResponse = await getAIResponse(chatId, messageText);
        await bot.sendMessage(chatId, aiResponse);
        console.log(`✅ Respons terkirim ke ${userName}: ${aiResponse.substring(0, 50)}...`);
    } catch (error) {
        console.error("❌ Error saat memproses pesan:", error);
        await bot.sendMessage(chatId, "Maaf, terjadi kesalahan saat memproses pesan Anda.");
    }
});

// Handler untuk command /start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || "User";
    const userId = msg.from.id;
    const welcomeMessage = config.bot.welcomeMessage.replace("Halo!", `Halo ${userName}!`);

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
        await bot.sendMessage(chatId, "Anda tidak memiliki akses ke command ini.");
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
    await bot.sendMessage(chatId, "Memori percakapan telah dihapus.");
    console.log(`🗑️ Memori percakapan untuk chat ${chatId} telah dihapus.`);
});

// Handler untuk command /pin
bot.onText(/\/pin(?: (.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const query = match[1];
    if (!query) {
        await bot.sendMessage(chatId, "Harap berikan query untuk mencari gambar Pinterest. Contoh: /pin kucing lucu");
        return;
    }
    try {
        await bot.sendChatAction(chatId, "upload_photo");
        const response = await axios.get(`https://api.vreden.my.id/api/pinterest?query=${encodeURIComponent(query)}`);
        const imageUrls = response.data.result;

        if (imageUrls && imageUrls.length > 0) {
            await bot.sendPhoto(chatId, imageUrls[0], { caption: `Hasil untuk: ${query}` });
        } else {
            await bot.sendMessage(chatId, `Tidak ditemukan gambar Pinterest untuk query: ${query}`);
        }
    } catch (error) {
        console.error("❌ Error saat memanggil API Pinterest:", error.response?.data || error.message);
        await bot.sendMessage(chatId, "Maaf, terjadi kesalahan saat mencari gambar Pinterest.");
    }
});

// Handler untuk command /bot
bot.onText(/\/bot/, async (msg) => {
    const chatId = msg.chat.id;
    const randomImage = config.bot.botImages[Math.floor(Math.random() * config.bot.botImages.length)];
    // Kirim foto dengan inline keyboard
    await bot.sendPhoto(chatId, randomImage, {
        caption: "Atur bot sesuai keinginanmu!",
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "✨Atur Kepribadian", callback_data: "set_personality" },
                    { text: "🔄Reset Percakapan", callback_data: "reset_conversation" }
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
                [{ text: "Kembali", callback_data: "back_to_main" }]
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
    } else if (data === "back_to_main") {
        await bot.editMessageReplyMarkup({
            inline_keyboard: [
                [
                    { text: "✨Atur Kepribadian", callback_data: "set_personality" },
                    { text: "🔄Reset Percakapan", callback_data: "reset_conversation" }
                ]
            ]
        }, {
            chat_id: chatId,
            message_id: message.message_id
        });
    }
});

// --- PENANGANAN ERROR & PROSES ---
bot.on("error", (error) => console.error("❌ Bot error:", error));
bot.on("polling_error", (error) => console.error("❌ Polling error:", error));

function gracefulShutdown() {
    saveConversationHistory();
    console.log("\n🛑 Bot dihentikan...");
    notifyAdmin("🛑 Bot telah dihentikan");
    bot.stopPolling().then(() => process.exit(0));
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// --- PROSES STARTUP ---
(async () => {
    try {
        loadConversationHistory();
        const botInfo = await bot.getMe();
        console.log("🤖 Bot Telegram AI sedang berjalan...");
        console.log(`✅ Bot berhasil terhubung: @${botInfo.username}`);
        console.log("📡 Menunggu pesan masuk...");
        await notifyAdmin(`🚀 Bot ${botInfo.first_name} (@${botInfo.username}) telah aktif!`);
    } catch (error) {
        console.error("❌ Error saat memulai bot:", error);
        process.exit(1);
    }
})();




// Handler untuk command /play
bot.onText(/\/play(?: (.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const query = match[1];
    if (!query) {
        await bot.sendMessage(chatId, "Harap berikan query untuk mencari musik YouTube. Contoh: /play DJ malam pagi slowed");
        return;
    }
    try {
        await bot.sendChatAction(chatId, "typing");
        const response = await axios.get(`https://api.vreden.my.id/api/ytplaymp3?query=${encodeURIComponent(query)}`);
        const result = response.data.result;

        if (result && result.metadata) {
            const videoTitle = result.metadata.title;
            const videoUrl = result.metadata.url;
            const thumbnailUrl = result.metadata.image;
            const downloadUrl = `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(videoUrl)}`;

            const message = `🎶 *${videoTitle}*\n\nURL: ${videoUrl}\n\nTekan tombol di bawah untuk mengunduh MP3.`;

            await bot.sendPhoto(chatId, thumbnailUrl, {
                caption: message,
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "Unduh MP3", callback_data: `download_mp3_${videoUrl}` }
                        ]
                    ]
                }
            });
        } else {
            await bot.sendMessage(chatId, `Tidak ditemukan musik YouTube untuk query: ${query}`);
        }
    } catch (error) {
        console.error("❌ Error saat memanggil API YouTube Play MP3:", error.response?.data || error.message);
        await bot.sendMessage(chatId, "Maaf, terjadi kesalahan saat mencari musik YouTube.");
    }
});




    } else if (data.startsWith("download_mp3_")) {
        const videoUrl = data.replace("download_mp3_", "");
        try {
            await bot.sendChatAction(chatId, "upload_audio");
            const response = await axios.get(`https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(videoUrl)}`);
            const result = response.data.result;

            if (result && result.download && result.download.url) {
                const audioUrl = result.download.url;
                const audioTitle = result.metadata.title || "Musik";
                const audioFilename = result.download.filename || "audio.mp3";

                await bot.sendAudio(chatId, audioUrl, {
                    caption: `🎵 Berhasil mengunduh: *${audioTitle}*`,
                    parse_mode: "Markdown",
                    title: audioTitle,
                    fileName: audioFilename
                });
            } else {
                await bot.sendMessage(chatId, "Maaf, gagal mengunduh MP3. URL tidak valid atau tidak ditemukan.");
            }
        } catch (error) {
            console.error("❌ Error saat mengunduh MP3:", error.response?.data || error.message);
            await bot.sendMessage(chatId, "Maaf, terjadi kesalahan saat mengunduh MP3.");
        }
    }


