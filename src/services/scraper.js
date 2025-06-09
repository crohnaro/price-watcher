import axios from 'axios';
import { load } from 'cheerio';

export async function fetchPrice(url, selector) {
    const { data: html } = await axios.get(url, {
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                'Chrome/114.0.0.0 Safari/537.36',
            'Accept-Language': 'pt-BR,pt;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
            'Referer': url
        },
        timeout: 30_000
    });

    const $ = load(html);
    const priceText = $(selector).first().text();
    // ... parse para número
    return parseFloat(
        priceText
            .replace(/[^\d,]/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
    );
}
