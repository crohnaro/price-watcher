import 'dotenv/config';
import cron from 'node-cron';
import puppeteer from 'puppeteer';
import { CATEGORIES } from './products.js';
import { fetchPrice } from './scraper.js';
import { readLowest, saveLowest } from './storage.js';
import { sendTelegram } from './notifier.js';

async function checkPrices() {
    const lowestAll = readLowest() || {};

    for (const [category, targets] of Object.entries(CATEGORIES)) {
        for (const { url, selector, usePuppeteer } of targets) {
            try {
                let price;

                if (usePuppeteer) {
                    const browser = await puppeteer.launch({
                        headless: true,
                        args: [
                            '--no-sandbox',
                            '--disable-setuid-sandbox',
                            '--disable-dev-shm-usage',
                            '--disable-gpu'
                        ]
                    });
                    const page = await browser.newPage();
                    page.setDefaultNavigationTimeout(60000);
                    await page.setRequestInterception(true);
                    page.on('request', req => {
                        const type = req.resourceType();
                        if (['image', 'stylesheet', 'font', 'media'].includes(type)) req.abort();
                        else req.continue();
                    });
                    await page.setUserAgent(
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                        'Chrome/114.0.0.0 Safari/537.36'
                    );
                    const cleanUrl = url.split('#')[0];
                    await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

                    if (cleanUrl.includes('mercadolivre.com.br')) {
                        await page.waitForSelector('.andes-money-amount__fraction', { timeout: 60000 });
                        const fraction = await page.$eval('.andes-money-amount__fraction', el => el.innerText);
                        const cents = await page.$eval('.andes-money-amount__cents', el => el.innerText).catch(() => '00');
                        price = parseFloat(
                            `${fraction},${cents}`
                                .replace(/[^\d,]/g, '')
                                .replace(/\./g, '')
                                .replace(',', '.')
                        );
                    } else {
                        await page.waitForSelector(selector, { timeout: 30000 });
                        const text = await page.$eval(selector, el => el.innerText);
                        price = parseFloat(
                            text
                                .replace(/[^\d,]/g, '')
                                .replace(/\./g, '')
                                .replace(',', '.')
                        );
                    }

                    await page.close();
                    await browser.close();
                } else {
                    price = await fetchPrice(url, selector);
                }

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
