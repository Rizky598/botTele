import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import winston from 'winston';
import { fileURLToPath } from 'url';
import moment from 'moment';
import config from './config.js';

// ======================== INISIALISASI ========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigurasi logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: path.join(__dirname, 'logs', 'combined.log') }),
        new winston.transports.File({ filename: path.join(__dirname, 'logs', 'error.log'), level: 'error' })
    ]
});

const conversationHistory = {};
const MEMORY_FILE = path.join(__dirname, 'otak.json');
const USER_CACHE_FILE = path.join(__dirname, 'user_cache.json');
let userCache = new Set();

// Konfigurasi dari file
const { token: TELEGRAM_TOKEN, adminId: ADMIN_ID } = config.telegram;
const GOOGLE_AI_API_KEY = config.google.aiKey;
const GOOGLE_AI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";
const BOT_CONFIG = config.bot;

// Inisialisasi bot
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// ======================== MANAJEMEN MEMORI ========================
function loadConversationHistory() {
    if (fs.existsSync(MEMORY_FILE)) {
        try {
            const data = fs.readFileSync(MEMORY_FILE, 'utf8');
            const parsedData = JSON.parse(data);
            
            for (const chatId in parsedData) {
                conversationHistory[chatId] = parsedData[chatId]
                    .filter(msg => msg.role && msg.content)
                    .map(msg => ({
                        ...msg,
                        timestamp: msg.timestamp || Date.now()
                    }));
            }
            logger.info('Memori percakapan berhasil dimuat');
        } catch (error) {
            logger.error(`Error memuat memori: ${error.message}`);
            // Backup file corrupt
            fs.renameSync(MEMORY_FILE, `${MEMORY_FILE}.corrupted-${Date.now()}`);
        }
    }
}

function saveConversationHistory() {
    try {
        const validData = {};
        for (const chatId in conversationHistory) {
            validData[chatId] = conversationHistory[chatId].filter(
                msg => msg.role && msg.content
            );
        }
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(validData, null, 2), 'utf8');
    } catch (error) {
        logger.error(`Error menyimpan memori: ${error.message}`);
    }
}

function loadUserCache() {
    if (fs.existsSync(USER_CACHE_FILE)) {
        try {
            const data = fs.readFileSync(USER_CACHE_FILE, 'utf8');
            userCache = new Set(JSON.parse(data));
            logger.info('Cache pengguna berhasil dimuat');
        } catch (error) {
            logger.error(`Error memuat cache pengguna: ${error.message}`);
        }
    }
}

function saveUserCache() {
    try {
        fs.writeFileSync(USER_CACHE_FILE, JSON.stringify([...userCache]), 'utf8');
    } catch (error) {
        logger.error(`Error menyimpan cache pengguna: ${error.message}`);
    }
}

function getRelevantConversationContext(chatId, maxTokens = 900) {
    if (!conversationHistory[chatId]?.length) return [];
    
    let currentTokens = 0;
    const relevantMessages = [];
    
    // Iterasi dari pesan terbaru
    for (let i = conversationHistory[chatId].length - 1; i >= 0; i--) {
        const msg = conversationHistory[chatId][i];
        const messageTokens = msg.content.length + 10; // Estimasi token
        
        if (currentTokens + messageTokens <= maxTokens) {
            relevantMessages.unshift(msg);
            currentTokens += messageTokens;
        } else {
            break;
        }
    }
    return relevantMessages;
}

// ======================== FUNGSI AI ========================
async function getAIResponse(chatId, message) {
    // Inisialisasi memori jika belum ada
    if (!conversationHistory[chatId]) {
        conversationHistory[chatId] = [];
        
        // Tambahkan system message jika ada
        if (BOT_CONFIG.defaultPersonality) {
            const personality = BOT_CONFIG.personalities[BOT_CONFIG.defaultPersonality];
            if (personality) {
                conversationHistory[chatId].push({
                    role: 'system',
                    content: personality.systemMessage,
                    timestamp: Date.now()
                });
            }
        }
    }
    
    // Tambahkan pesan user
    conversationHistory[chatId].push({ 
        role: 'user', 
        content: message, 
        timestamp: Date.now() 
    });
    
    try {
        const relevantMessages = getRelevantConversationContext(chatId);
        const formattedMessages = relevantMessages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));
        
        const response = await axios.post(
            `${GOOGLE_AI_API_URL}?key=${GOOGLE_AI_API_KEY}`,
            { contents: formattedMessages },
            { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
        );
        
        const aiResponse = response.data.candidates[0].content.parts[0].text;
        
        // Tambahkan respon AI
        conversationHistory[chatId].push({ 
            role: 'assistant', 
            content: aiResponse, 
            timestamp: Date.now() 
        });
        
        // Simpan memori secara async
        setImmediate(saveConversationHistory);
        
        return aiResponse;
    } catch (error) {
        logger.error(`Error AI: ${error.response?.data || error.message}`);
        
        // Hapus pesan user yang gagal diproses
        conversationHistory[chatId].pop();
        
        return BOT_CONFIG.errorMessages.apiFailure;
    }
}

// ======================== UTILITAS ========================
async function notifyAdmin(message) {
    try {
        await bot.sendMessage(ADMIN_ID, `🔔 ADMIN NOTIFIKASI:\n${message}`);
    } catch (error) {
        logger.error(`Gagal mengirim notifikasi admin: ${error.message}`);
    }
}

function formatMessage(text, context = {}) {
    return text
        .replace(/{name}/g, context.name || 'Pengguna')
        .replace(/{botName}/g, BOT_CONFIG.name || 'Bot AI')
        .replace(/{userId}/g, context.userId || 'N/A');
}

// ======================== HANDLER PESAN UTAMA ========================
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;
    const userId = msg.from.id;
    const userName = msg.from.first_name || 'Pengguna';
    
    // Abaikan command dan pesan kosong
    if (!messageText || messageText.startsWith('/')) return;
    
    logger.info(`Pesan dari [${userName} (${userId})]: ${messageText}`);
    
    // Deteksi user baru
    if (userId != ADMIN_ID && !userCache.has(userId)) {
        userCache.add(userId);
        saveUserCache();
        await notifyAdmin(`👤 USER BARU:\n${userName} (${userId})\nPesan: "${messageText}"`);
    }
    
    try {
        await bot.sendChatAction(chatId, 'typing');
        const aiResponse = await getAIResponse(chatId, messageText);
        await bot.sendMessage(chatId, aiResponse);
        logger.info(`Respons untuk [${userName}]: ${aiResponse.substring(0, 50)}...`);
    } catch (error) {
        logger.error(`Error memproses pesan: ${error.message}`);
        await bot.sendMessage(chatId, BOT_CONFIG.errorMessages.general);
    }
});

// ======================== HANDLER COMMAND ========================
const commandHandlers = {
    start: async (msg) => {
        const chatId = msg.chat.id;
        const userName = msg.from.first_name || 'Pengguna';
        const userId = msg.from.id;
        
        const welcomeMessage = formatMessage(BOT_CONFIG.welcomeMessage, {
            name: userName,
            userId: userId
        });
        
        await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
        logger.info(`[${userName}] memulai bot`);
        
        if (userId != ADMIN_ID) {
            await notifyAdmin(`${userName} (${userId}) memulai bot`);
        }
    },
    
    help: (msg) => {
        bot.sendMessage(
            msg.chat.id, 
            formatMessage(BOT_CONFIG.helpMessage), 
            { parse_mode: 'Markdown' }
        );
    },
    
    stats: async (msg) => {
        const chatId = msg.chat.id;
        if (msg.from.id != ADMIN_ID) {
            return bot.sendMessage(chatId, BOT_CONFIG.errorMessages.adminOnly);
        }
        
        const statsMessage = `
📊 *STATISTIK BOT*
• 👥 Pengguna: ${userCache.size}
• 💬 Percakapan aktif: ${Object.keys(conversationHistory).length}
• 🧠 Ukuran memori: ${Math.round(fs.statSync(MEMORY_FILE)?.size / 1024 || 0)} KB
• ⚙️ Versi: ${BOT_CONFIG.version}
        `.trim();
        
        await bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
    },
    
    clear: async (msg) => {
        const chatId = msg.chat.id;
        conversationHistory[chatId] = [];
        saveConversationHistory();
        await bot.sendMessage(chatId, '🧹 Memori percakapan berhasil dihapus!');
        logger.info(`[${chatId}] hapus memori`);
    },
    
    pin: async (msg, match) => {
        const chatId = msg.chat.id;
        const query = match[1];
        
        if (!query) {
            return bot.sendMessage(
                chatId, 
                formatMessage(BOT_CONFIG.errorMessages.invalidQuery), 
                { parse_mode: 'Markdown' }
            );
        }
        
        try {
            await bot.sendChatAction(chatId, 'upload_photo');
            const response = await axios.get(
                `https://api.vreden.my.id/api/pinterest?query=${encodeURIComponent(query)}`,
                { timeout: 10000 }
            );
            
            const imageUrls = response.data?.result || [];
            if (imageUrls.length > 0) {
                await bot.sendPhoto(chatId, imageUrls[0], { 
                    caption: `📌 Hasil untuk: *${query}*`,
                    parse_mode: 'Markdown'
                });
            } else {
                await bot.sendMessage(chatId, `❌ Tidak ditemukan gambar untuk "${query}"`);
            }
        } catch (error) {
            logger.error(`Pinterest error: ${error.message}`);
            await bot.sendMessage(chatId, BOT_CONFIG.errorMessages.apiFailure);
        }
    },
    
    bot: async (msg) => {
        const chatId = msg.chat.id;
        const randomImage = BOT_CONFIG.botImages[
            Math.floor(Math.random() * BOT_CONFIG.botImages.length)
        ];
        
        await bot.sendPhoto(chatId, randomImage, {
            caption: '⚙️ *PANEL KONTROL BOT*',
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '✨ Atur Kepribadian', callback_data: 'set_personality' },
                        { text: '🔄 Reset Percakapan', callback_data: 'reset_conversation' }
                    ],
                    [
                        { text: 'ℹ️ Info Bot', callback_data: 'bot_info' }
                    ]
                ]
            }
        });
    },
    
    play: async (msg, match) => {
        const chatId = msg.chat.id;
        const query = match[1];
        
        if (!query) {
            return bot.sendMessage(
                chatId, 
                '🎵 Berikan judul lagu!\nContoh: `/play DJ malam pagi slowed`', 
                { parse_mode: 'Markdown' }
            );
        }
        
        try {
            await bot.sendChatAction(chatId, 'typing');
            const response = await axios.get(
                `https://api.vreden.my.id/api/ytplaymp3?query=${encodeURIComponent(query)}`,
                { timeout: 15000 }
            );
            
            const result = response.data?.result;
            if (!result?.metadata) {
                throw new Error('Data tidak valid');
            }
            
            const { title, url, image } = result.metadata;
            await bot.sendPhoto(chatId, image, {
                caption: `🎶 *${title}*\n🔗 [Tonton di YouTube](${url})`,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        { 
                            text: '⬇️ Unduh MP3', 
                            callback_data: `download_mp3_${encodeURIComponent(url)}`
                        }
                    ]]
                }
            });
        } catch (error) {
            logger.error(`Play error: ${error.message}`);
            await bot.sendMessage(chatId, '🚫 Lagu tidak ditemukan atau server error');
        }
    }
};

// Daftarkan handler command
bot.onText(/\/start/, commandHandlers.start);
bot.onText(/\/help/, commandHandlers.help);
bot.onText(/\/stats/, commandHandlers.stats);
bot.onText(/\/clear/, commandHandlers.clear);
bot.onText(/\/pin(?: (.+))?/, commandHandlers.pin);
bot.onText(/\/bot/, commandHandlers.bot);
bot.onText(/\/play(?: (.+))?/, commandHandlers.play);

// ======================== HANDLER CALLBACK ========================
bot.on('callback_query', async (callbackQuery) => {
    const { message, data } = callbackQuery;
    const chatId = message.chat.id;
    
    await bot.answerCallbackQuery(callbackQuery.id);

    try {
        if (data === 'reset_conversation') {
            conversationHistory[chatId] = [];
            saveConversationHistory();
            await bot.sendMessage(chatId, '🧹 Memori percakapan direset!');
        }
        else if (data === 'set_personality') {
            const keyboard = [];
            
            // Buat tombol untuk setiap kepribadian
            for (const [key, personality] of Object.entries(BOT_CONFIG.personalities)) {
                keyboard.push([{
                    text: personality.buttonLabel,
                    callback_data: `set_personality_${key}`
                }]);
            }
            
            keyboard.push([{ text: '🔙 Kembali', callback_data: 'back_to_main' }]);
            
            await bot.editMessageReplyMarkup({
                inline_keyboard: keyboard
            }, {
                chat_id: chatId,
                message_id: message.message_id
            });
        }
        else if (data.startsWith('set_personality_')) {
            const personalityKey = data.split('_')[2];
            const personality = BOT_CONFIG.personalities[personalityKey];
            
            if (personality) {
                // Set kepribadian baru sebagai system message
                conversationHistory[chatId] = [{
                    role: 'system',
                    content: personality.systemMessage,
                    timestamp: Date.now()
                }];
                
                saveConversationHistory();
                
                await bot.sendMessage(
                    chatId, 
                    `🎭 *Kepribadian Diatur:* ${personality.name}\n\n${personality.description}`,
                    { parse_mode: 'Markdown' }
                );
            }
        }
        else if (data === 'back_to_main') {
            await bot.editMessageReplyMarkup({
                inline_keyboard: [
                    [
                        { text: '✨ Atur Kepribadian', callback_data: 'set_personality' },
                        { text: '🔄 Reset Percakapan', callback_data: 'reset_conversation' }
                    ],
                    [
                        { text: 'ℹ️ Info Bot', callback_data: 'bot_info' }
                    ]
                ]
            }, {
                chat_id: chatId,
                message_id: message.message_id
            });
        }
        else if (data === 'bot_info') {
            const infoMessage = `
🤖 *${BOT_CONFIG.name}*
${BOT_CONFIG.description}

⚙️ *Spesifikasi:*
• Versi: ${BOT_CONFIG.version}
• Pembaruan terakhir: ${BOT_CONFIG.lastUpdate}
• Memori: ${Object.keys(conversationHistory).length} percakapan
• Pengguna: ${userCache.size} orang

🔧 *Fitur Utama:*
- Obrolan cerdas dengan AI Google Gemini
- Pencarian gambar Pinterest
- Download musik YouTube
- Multiple personalities
            `.trim();
            
            await bot.sendMessage(chatId, infoMessage, { parse_mode: 'Markdown' });
        }
        else if (data.startsWith('download_mp3_')) {
            const videoUrl = decodeURIComponent(data.replace('download_mp3_', ''));
            await bot.sendChatAction(chatId, 'upload_audio');
            
            const response = await axios.get(
                `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(videoUrl)}`,
                { timeout: 30000 }
            );
            
            const result = response.data?.result;
            if (result?.download?.url) {
                await bot.sendAudio(
                    chatId,
                    result.download.url,
                    {
                        title: result.metadata?.title || 'Audio',
                        performer: 'YouTube Downloader',
                        caption: `🎵 ${result.metadata?.title || 'Audio'}`,
                        parse_mode: 'Markdown'
                    }
                );
            } else {
                throw new Error('URL download tidak valid');
            }
        }
    } catch (error) {
        logger.error(`Callback error: ${error.message}`);
        await bot.sendMessage(chatId, '⚠️ Terjadi kesalahan saat memproses permintaan');
    }
});

// ======================== MANAJEMEN PROSES ========================
bot.on('error', error => logger.error(`Bot error: ${error.message}`));
bot.on('polling_error', error => logger.error(`Polling error: ${error.message}`));

async function gracefulShutdown() {
    logger.info('🛑 Menghentikan bot...');
    saveConversationHistory();
    saveUserCache();
    await notifyAdmin('🔴 Bot dimatikan!');
    process.exit(0);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// ======================== INISIALISASI BOT ========================
(async () => {
    try {
        // Buat folder logs jika belum ada
        if (!fs.existsSync('logs')) {
            fs.mkdirSync('logs');
        }
        
        // Load data
        loadConversationHistory();
        loadUserCache();
        
        // Verifikasi koneksi bot
        const botInfo = await bot.getMe();
        logger.info(`
🚀 Bot berhasil dijalankan!
🤖 ${botInfo.first_name} (@${botInfo.username})
📆 ${new Date().toLocaleString()}
        `.trim());
        
        await notifyAdmin(`🚀 Bot aktif! ${botInfo.first_name} siap melayani`);
        
        // Backup otomatis setiap 24 jam
        setInterval(() => {
            logger.info('⏰ Memulai backup terjadwal');
            import('child_process').then(({ exec }) => {
                exec('npm run backup', (error) => {
                    if (error) {
                        logger.error(`❌ Backup error: ${error.message}`);
                        return;
                    }
                    logger.info('✅ Backup terjadwal berhasil');
                });
            });
        }, 24 * 60 * 60 * 1000); // 24 jam
        
         // Backup data setiap 5 menit
        setInterval(() => {
            saveConversationHistory();
            saveUserCache();
            logger.info('💾 Backup data otomatis');
        }, 5 * 60 * 1000); // 5 menit
    } catch (error) {
        logger.error(`Gagal memulai bot: ${error.message}`);
        process.exit(1);
    }
})();
        
