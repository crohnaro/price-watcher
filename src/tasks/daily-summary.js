import puppeteer from 'puppeteer';
import { fetchSinglePrice } from '../services/fetcher.js';
import { CATEGORIES } from '../products.js';
import { sendTelegram } from '../notifier.js';

export async function dailySummary() {
    console.log('dailySummary → start');
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });
    const lines = [];

    for (const [category, targets] of Object.entries(CATEGORIES)) {
        for (const { url, selector, usePuppeteer } of targets) {
            console.log(`dailySummary → [${category}] fetching ${url}`);
            try {
                const price = await fetchSinglePrice(browser, url, selector, usePuppeteer);
                console.log(`dailySummary → [${category}] price=${price}`);
                lines.push(`**${category}** – R$ ${price.toFixed(2)}\n${url}`);
            } catch (err) {
                console.error(`dailySummary → [${category}] error fetching ${url}:`, err);
                lines.push(`**${category}** – erro ao buscar\n${url}`);
            }
        }
    }

    await sendTelegram(lines.join('\n\n'));
    console.log('dailySummary → message sent');
    await browser.close();
    console.log('dailySummary → done');
}
