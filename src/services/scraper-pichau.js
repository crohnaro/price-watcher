import axios from 'axios';
import { load } from 'cheerio';

export async function fetchPricePichauHtml(url) {
    const { data: html } = await axios.get(url);
    const $ = load(html);

    // encontra o primeiro script JSON-LD de tipo Product
    const jsonLd = $('script[type="application/ld+json"]')
        .map((_, el) => $(el).html())
        .get()
        .find(txt => {
            try {
                const o = JSON.parse(txt);
                return o['@type'] === 'Product' && o.offers?.price;
            } catch {
                return false;
            }
        });
    if (!jsonLd) throw new Error('JSON-LD não encontrado na Pichau');
    const prod = JSON.parse(jsonLd);
    return parseFloat(prod.offers.price);
}
