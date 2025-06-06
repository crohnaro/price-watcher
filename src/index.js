import 'dotenv/config';
import cron from 'node-cron';
import { fetchPrice } from './scrapper.js';
import { readLowest, saveLowest } from './storage.js';
import { sendTelegram } from './notifier.js';
import { TARGETS } from './products.js';

async function checkPrices() {
    const lowest = readLowest() || {};

    for (const { url, selector } of TARGETS) {
        try {
            const price = await fetchPrice(url, selector);
            console.log(`[${new Date().toISOString()}] ${url} → R$ ${price}`);

            let title;
            if (!lowest.price) {
                title = 'Preço inicial';
            } else if (price < lowest.price) {
                title = 'Novo menor preço';
            } else {
                title = 'Preço atualizado';
            }

            const record = { url, price, checkedAt: new Date().toISOString() };
            saveLowest(record);

            const msg = `<b>${title}</b>\nURL: <a href="${url}">${url}</a>\nPreço: R$ ${price.toFixed(2)}`;
            await sendTelegram(msg);
        } catch (err) {
            console.error(`Erro ao checar ${url}:`, err.message);
        }
    }
}

cron.schedule('0 * * * *', () => {
    console.log('Verificando preços…');
    checkPrices();
});

checkPrices();
