import puppeteer from 'puppeteer';
import { fetchSinglePrice } from '../services/fetcher.js';
import { CATEGORIES } from '../products.js';
import { readLowest, saveLowest } from '../storage.js';
import { sendTelegram } from '../notifier.js';

export async function checkDrops() {
    console.log('checkDrops → start');
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });
    const lowestAll = readLowest() || {};

    for (const [category, targets] of Object.entries(CATEGORIES)) {
        for (const { url, selector, usePuppeteer } of targets) {
            console.log(`checkDrops → [${category}] fetching ${url}`);
            try {
                const price = await fetchSinglePrice(browser, url, selector, usePuppeteer);
                console.log(`checkDrops → [${category}] price=${price}`);
                const key = `${category}|${url}`;
                const last = lowestAll[key] || {};

                if (!last.price || price < last.price) {
                    const oldPrice = last.price || price;
                    const diff = (oldPrice - price).toFixed(2);
                    console.log(`checkDrops → [${category}] price dropped from ${oldPrice} to ${price}`);
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
                    console.log(`checkDrops → [${category}] notification sent`);
                } else {
                    console.log(`checkDrops → [${category}] no drop (${price} ≥ ${last.price})`);
                }
            } catch (err) {
                console.error(`checkDrops → [${category}] error fetching ${url}:`, err);
            }
        }
    }

    await browser.close();
    console.log('checkDrops → done');
}
