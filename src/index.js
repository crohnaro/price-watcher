import 'dotenv/config';
import cron from 'node-cron';
import { CATEGORIES } from './products.js';
import { fetchPrice } from './scraper.js';
import { fetchPriceWithPuppeteer } from './scraper-puppeteer.js';
import { readLowest, saveLowest } from './storage.js';
import { sendTelegram } from './notifier.js';

async function checkPrices() {
    const lowestAll = readLowest() || {};

    for (const [category, targets] of Object.entries(CATEGORIES)) {
        for (const { url, selector, usePuppeteer } of targets) {
            try {
                const price = usePuppeteer
                    ? await fetchPriceWithPuppeteer(url, selector)
                    : await fetchPrice(url, selector);

                const key = `${category}|${url}`;
                const lastRecord = lowestAll[key] || {};

                let title;
                if (!lastRecord.price) {
                    title = '🔔 Preço inicial';
                } else if (price < lastRecord.price) {
                    title = '🤑 Novo menor preço';
                } else {
                    title = 'ℹ️ Preço atualizado';
                }

                lowestAll[key] = { category, url, price, checkedAt: new Date().toISOString() };
                saveLowest(lowestAll);

                const msg = `<b>${title} – ${category}</b>\n` +
                    `URL: <a href="${url}">${url}</a>\n` +
                    `Preço: R$ ${price.toFixed(2)}`;
                await sendTelegram(msg);
            } catch (err) {
                console.error(`Erro em [${category}] ${url}:`, err.message);
            }
        }
    }
}

cron.schedule('0 * * * *', () => {
    console.log('Verificando preços por categoria…');
    checkPrices();
});

checkPrices();
