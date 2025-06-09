import { fetchSinglePrice } from '../services/fetcher.js';
import { CATEGORIES } from '../products.js';
import { sendTelegram } from '../notifier.js';

export async function dailySummary() {
    const lines = [];

    for (const [category, targets] of Object.entries(CATEGORIES)) {
        for (const { url, selector, usePuppeteer } of targets) {
            try {
                const price = await fetchSinglePrice(url, selector, usePuppeteer);
                lines.push(`**${category}** – R$ ${price.toFixed(2)}\n${url}`);
            } catch {
                lines.push(`**${category}** – erro ao buscar\n${url}`);
            }
        }
    }

    await sendTelegram(lines.join('\n\n'));
}
