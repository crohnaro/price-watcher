import { fetchSinglePrice } from '../services/fetcher.js';
import { CATEGORIES } from '../products.js';
import { readLowest, saveLowest } from '../storage.js';
import { sendTelegram } from '../notifier.js';

export async function checkDrops() {
    const lowestAll = readLowest() || {};

    for (const [category, targets] of Object.entries(CATEGORIES)) {
        for (const { url, selector, usePuppeteer } of targets) {
            try {
                const price = await fetchSinglePrice(url, selector, usePuppeteer);
                const key = `${category}|${url}`;
                const last = lowestAll[key] || {};

                if (!last.price || price < last.price) {
                    const oldPrice = last.price || price;
                    const diff = (oldPrice - price).toFixed(2);
                    lowestAll[key] = { category, url, price, checkedAt: new Date().toISOString() };
                    saveLowest(lowestAll);

                    const title = !last.price
                        ? '🔔 Preço inicial registrado'
                        : '🤑 Novo menor preço encontrado';
                    const msg = [
                        `<b>${title} – ${category}</b>`,
                        `URL: <a href="${url}">${url}</a>`,
                        `Preço antigo: R$ ${oldPrice.toFixed(2)}`,
                        `Preço novo: R$ ${price.toFixed(2)}`,
                        `Você economizou: R$ ${diff}`
                    ].join('\n');

                    await sendTelegram(msg);
                }
            } catch (err) {
                console.error(`Erro em [${category}] ${url}:`, err.message);
            }
        }
    }
}
