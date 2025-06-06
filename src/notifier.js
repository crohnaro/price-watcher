import TelegramBot from 'node-telegram-bot-api';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const bot = new TelegramBot(TOKEN, { polling: false });

/**
 * @param {string} texto 
 */
export async function sendTelegram(texto) {
    try {
        await bot.sendMessage(CHAT_ID, texto, {
            parse_mode: 'HTML',
            disable_web_page_preview: false
        });
        console.log('Mensagem enviada via Telegram');
    } catch (err) {
        console.error('Erro ao enviar Telegram:', err);
    }
}
