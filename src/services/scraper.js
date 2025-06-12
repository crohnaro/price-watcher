import axios from 'axios';
import { load } from 'cheerio';

export async function fetchPrice(url, selector) {
    console.log(`scraper-axios → GET ${url}`);
    const { data } = await axios.get(url);
    const $ = load(data);
    const text = $(selector).first().text().trim();
    console.log(`scraper-axios → selector=${selector}\n  raw="${text}"`);
    const price = parseFloat(
        text
            .replace(/[^\d,]/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
    );
    console.log(`scraper-axios → parsed=${price}`);
    return price;
}
