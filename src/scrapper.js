import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * 
 * @param {string} url 
 * @param {string} selector 
 */
export async function fetchPrice(url, selector) {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);
    const priceText = $(selector).first().text();
    const numeric = parseFloat(
        priceText
            .replace(/[^\d,]/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
    );
    return numeric;
}
