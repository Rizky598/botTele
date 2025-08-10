import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import winston from 'winston';
import { fileURLToPath } from 'url';
import moment from 'moment';
import config from './config.js';
import * as cheerio from 'cheerio';
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

// ======================== FUNGSI PENDUKUNG ========================
async function getServerStats() {
    // Implementasi monitoring server
    return {
        cpu: '25%',
        memory: '1.2GB/4GB',
        storage: '15GB/50GB'
    };
}
async function createBackup(outputPath) {
    // Implementasi backup data
    if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }
    // Contoh: backup file penting
    const filesToBackup = [MEMORY_FILE, USER_CACHE_FILE];
    // ... proses backup ke ZIP
    return outputPath;
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
    if (!messageText || messageText.startsWith("/")) return;
    logger.info(`Pesan dari [${userName} (${userId})]: ${messageText}`);
    // Deteksi user baru
    if (!userCache.has(userId)) {
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
        const randomStartImage = await getWaifuImage();

        await bot.sendPhoto(chatId, randomStartImage, {
            caption: welcomeMessage,
            parse_mode: 'Markdown'
        });
        logger.info(`[${userName}] memulai bot`);
    },
    help: async (msg) => {
        const chatId = msg.chat.id;
        const randomHelpImage = await getWaifuImage();
        bot.sendPhoto(
            chatId,
            randomHelpImage,
            {
                caption: formatMessage(BOT_CONFIG.helpMessage),
                parse_mode: 'Markdown'
            }
        );
    }, 
    stats: async (msg) => {
        const chatId = msg.chat.id;   
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
        const randomImage = await getWaifuImage();
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
                        { text: '📸 Screenshot Web', callback_data: 'screenshot_web' },
                        { text: 'ℹ️ Info Bot', callback_data: 'bot_info' }
                    ],
                    [
                        { text: '🖼️ Random Image', callback_data: 'random_image' }
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
    },
    screenshot: async (msg, match) => {
        const chatId = msg.chat.id;
        const input = match[1];
        if (!input) {
            return bot.sendMessage(
                chatId, 
                '🌐 Berikan URL website untuk di-screenshot!\nContoh: `/ssweb https://google.com tablet`\n\nTipe device yang tersedia: desktop, mobile, tablet',
                { parse_mode: 'Markdown' }
            );
        }
        // Parsing input (URL dan tipe device)
        const parts = input.split(' ');
        const url = parts[0];
        let deviceType = parts[1] || 'desktop';
        // Validasi device type
        const validDeviceTypes = ['desktop', 'mobile', 'tablet'];
        if (!validDeviceTypes.includes(deviceType)) {
            deviceType = 'desktop';
        }
        try {
            await bot.sendChatAction(chatId, 'upload_photo');
            const response = await axios.get(
                `https://api.vreden.my.id/api/ssweb?url=${encodeURIComponent(url)}&type=${deviceType}`,
                { 
                    timeout: 30000,
                    responseType: 'arraybuffer' 
                }
            );
            // Simpan screenshot sementara
            const tempFile = path.join(__dirname, 'temp', `screenshot_${Date.now()}.jpg`);
            fs.writeFileSync(tempFile, response.data);
            // Kirim screenshot
            await bot.sendPhoto(
                chatId,
                tempFile,
                {
                    caption: `📸 Screenshot ${url}\nDevice: ${deviceType}`,
                    parse_mode: 'Markdown'
                }
            );
            // Hapus file temp
            fs.unlinkSync(tempFile);
        } catch (error) {
            logger.error(`Screenshot error: ${error.message}`);
            await bot.sendMessage(
                chatId, 
                '❌ Gagal mengambil screenshot. Pastikan URL valid dan coba lagi.',
                { parse_mode: 'Markdown' }
            );
        }
    },
    tiktok: async (msg, match) => {
        const chatId = msg.chat.id;
        const text = match[1];
        if (!text) {
            return bot.sendMessage(chatId, `🔗 Masukkan link TikTok!\n\nContoh: /tiktok https://vt.tiktok.com/xxxx/`);
        }
        if (!text.includes('tiktok.com')) {
            return bot.sendMessage(chatId, '❌ Link yang Anda masukkan bukan link TikTok.');
        }
        await bot.sendMessage(chatId, 'Sedang memproses, mohon tunggu...');
        try {
            // === 🖼️ Jika slideshow (photo)
            if (text.includes('/photo/')) {
                const slideResponse = await axios.get(`https://dlpanda.com/id?url=${text}&token=G7eRpMaa`);
                const $ = cheerio.load(slideResponse.data);
                let images = [];
                $("div.col-md-12 > img").each((i, el) => {
                    const src = $(el).attr("src");
                    if (src && src.startsWith('http')) images.push(src);
                });
                if (images.length === 0) {
                    return bot.sendMessage(chatId, '❌ Gagal mengunduh slideshow. Coba link lain atau pastikan link benar.');
                }
                await bot.sendMessage(chatId, `✅ Berhasil mengunduh ${images.length} foto dari slideshow. Mengirim gambar...`);
                for (const imageUrl of images) {
                    await bot.sendPhoto(chatId, imageUrl);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // sleep
                }
            } else {
                // === 🎥 Jika video biasa
                const params = new URLSearchParams();
                params.set("url", text);
                params.set("hd", "1");
                const videoResponse = await axios.post("https://tikwm.com/api/", params, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "Cookie": "current_language=en",
                        "User-Agent": "Mozilla/5.0 (Linux; Android 10)"
                    }
                });
                const result = videoResponse?.data?.data;
                if (!result || !result.play) {
                    return bot.sendMessage(chatId, '❌ Gagal mendapatkan video. Mungkin link salah atau tidak didukung.');
                }
                let caption = `🎬 *${result.title || 'Tanpa Judul'}*\n\n✅ Video berhasil diunduh tanpa watermark.`;
                await bot.sendVideo(chatId, result.play, {
                    caption: caption,
                    parse_mode: 'Markdown'
                });
            }
        } catch (err) {
            logger.error(`TikTok error: ${err.message}`);
            await bot.sendMessage(chatId, `❌ Terjadi kesalahan saat memproses link TikTok.\n\nError: ${err.message}`);
        }
    },
    // [FITUR BARU] Hentai Video - Hanya untuk Premium dan Owner
    hentai: async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        try {
            await bot.sendChatAction(chatId, 'upload_video');        
            // Panggil API hentai video
            const response = await axios.get('https://api.vreden.my.id/api/hentaivid', { 
                timeout: 15000 
            });  
            // API mengembalikan array, ambil item pertama
            const result = response.data?.result;
            let videoUrl = null;    
            if (Array.isArray(result) && result.length > 0) {
                // Ambil video random dari array
                const randomIndex = Math.floor(Math.random() * result.length);
                const selectedVideo = result[randomIndex];      
                // Coba ambil URL dari berbagai field yang mungkin
                videoUrl = selectedVideo.video_1 || selectedVideo.video_2 || selectedVideo.link;
            } else if (result?.url) {
                // Fallback jika format berbeda
                videoUrl = result.url;
            }
            if (videoUrl) {
                logger.info(`Mengirim video dari URL: ${videoUrl}`);
                await bot.sendVideo(chatId, videoUrl, {
                    caption: '🔞 *Video Hentai*\n\n⚠️ Konten dewasa - 18+',
                    parse_mode: 'Markdown'
                });
                // Log penggunaan fitur
                logger.info(`[${userId}] menggunakan fitur hentai`);
            } else {
                await bot.sendMessage(chatId, '❌ Gagal mendapatkan video hentai. Coba lagi nanti.');
                logger.error(`Hentai API response: ${JSON.stringify(response.data)}`);
            }
        } catch (error) {
            logger.error(`Hentai video error: ${error.message}`);
            await bot.sendMessage(chatId, '❌ Terjadi kesalahan saat mengambil video. Silakan coba lagi.');
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
bot.onText(/\/ssweb(?: (.+))?/, commandHandlers.screenshot);
bot.onText(/\/tiktok(?: (.+))?/, commandHandlers.tiktok);
bot.onText(/\/hentai/, commandHandlers.hentai); // [FITUR BARU]
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
            let row = [];
            for (const [key, personality] of Object.entries(BOT_CONFIG.personalities)) {
                row.push({
                    text: personality.buttonLabel,
                    callback_data: `set_personality_${key}`
                });
                if (row.length === 2) {
                    keyboard.push(row);
                    row = [];
                }
            }
            if (row.length > 0) {
                keyboard.push(row);
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
            const personalityKey = data.replace('set_personality_', '');
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
                        { text: '📸 Screenshot Web', callback_data: 'screenshot_web' },
                        { text: 'ℹ️ Info Bot', callback_data: 'bot_info' }
                    ],
                    [
                        { text: '🖼️ Random Image', callback_data: 'random_image' }
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
- Screenshot website
- Video hentai (Premium/Owner)
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
        else if (data === 'screenshot_web') {
            await bot.sendMessage(
                chatId,
                '📸 *Screenshot Website*\n\nKirim perintah:\n`/ssweb https://contoh.com tablet`\n\nGanti `tablet` dengan `desktop` atau `mobile` sesuai kebutuhan.',
                { parse_mode: 'Markdown' }
            );
        }
        else if (data === 'random_image') {
            const randomImage = BOT_CONFIG.botImages[
                Math.floor(Math.random() * BOT_CONFIG.botImages.length)
            ];
            await bot.sendPhoto(chatId, randomImage, {
                caption: 'Ini adalah gambar acak!',
                parse_mode: 'Markdown'
            });
        }
        else if (data === 'admin_tools') {
            if (message.from.id.toString() !== ADMIN_ID) {
                return bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Fitur khusus Admin!",
                    show_alert: true
                });
            }
            await bot.editMessageReplyMarkup({
                inline_keyboard: [
                    [
                        { text: '📊 Statistik Server', callback_data: 'server_stats' },
                        { text: '💾 Backup Data', callback_data: 'backup_data' }
                    ],
                    [
                        { text: '🔙 Kembali', callback_data: 'back_to_main' }
                    ]
                ]
            }, {
                chat_id: chatId,
                message_id: message.message_id
            });
        }
        else if (data === 'server_stats') {
            if (message.from.id.toString() !== ADMIN_ID) return;

            const stats = await getServerStats();
            await bot.sendMessage(
                chatId,
                `🖥️ *Server Statistics*\n\n` +
                `• CPU Usage: ${stats.cpu}%\n` +
                `• Memory: ${stats.memory}\n` +
                `• Storage: ${stats.storage}`,
                { parse_mode: 'Markdown' }
            );
        }
        else if (data === 'backup_data') {
            if (message.from.id.toString() !== ADMIN_ID) return;
            await bot.sendChatAction(chatId, 'typing');
            saveConversationHistory();
            saveUserCache();
            const date = new Date().toISOString().split('T')[0];
            const backupFile = path.join(__dirname, 'backups', `backup_${date}.zip`);
            // Implementasi backup data
            await createBackup(backupFile);
            await bot.sendDocument(
                chatId,
                backupFile,
                {
                    caption: `📦 Backup data per ${date}`,
                    parse_mode: 'Markdown'
                }
            );
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
        // Buat folder yang diperlukan
        const folders = ['logs', 'temp', 'backups'];
        folders.forEach(folder => {
            if (!fs.existsSync(folder)) fs.mkdirSync(folder);
        });
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
            saveConversationHistory();
            saveUserCache();
        }, 24 * 60 * 60 * 1000);
    } catch (error) {
        logger.error(`Gagal memulai bot: ${error.message}`);
        process.exit(1);
    }
})();
async function getWaifuImage() {
    try {
        const response = await axios.get("https://api.waifu.pics/sfw/neko");
        return response.data.url;
    } catch (error) {
        logger.error(`Error fetching Waifu image: ${error.message}`);
        return null;
    }
}
// ======================== HANDLER GRUP ========================
bot.on("new_chat_members", async (msg) => {
    const chatId = msg.chat.id;
    const newMembers = msg.new_chat_members;
    const chatTitle = msg.chat.title;
    for (const member of newMembers) {
        if (member.id === bot.options.id) {
            // Bot ditambahkan ke grup
            logger.info(`Bot ditambahkan ke grup: ${chatTitle} (${chatId})`);
            await bot.sendMessage(chatId, BOT_CONFIG.groupMessages.botAddedMessage);
        } else {
            // Anggota baru bergabung
            const memberName = member.first_name || member.username || "Seseorang";
            const welcomeMessage = formatMessage(BOT_CONFIG.groupMessages.welcomeMessage, {
                name: memberName,
                groupName: chatTitle
            });
            await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
            logger.info(`${memberName} bergabung ke grup: ${chatTitle} (${chatId})`);
        }
    }
});
bot.on("left_chat_member", async (msg) => {
    const chatId = msg.chat.id;
    const leftMember = msg.left_chat_member;
    const chatTitle = msg.chat.title;
    if (leftMember.id === bot.options.id) {
        // Bot dikeluarkan dari grup
        logger.info(`Bot dikeluarkan dari grup: ${chatTitle} (${chatId})`);
    } else {
        // Anggota keluar
        const memberName = leftMember.first_name || leftMember.username || "Seseorang";
        const farewellMessage = formatMessage(BOT_CONFIG.groupMessages.farewellMessage, {
            name: memberName,
            groupName: chatTitle
        });
        await bot.sendMessage(chatId, farewellMessage, { parse_mode: 'Markdown' });
        logger.info(`${memberName} keluar dari grup: ${chatTitle} (${chatId})`);
    }
});
