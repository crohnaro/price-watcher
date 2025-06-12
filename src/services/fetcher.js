import { fetchPrice as axiosFetch } from './scraper.js';
import { fetchPriceWithPuppeteer as puppeteerFetch } from './scraper-puppeteer.js';
import { fetchPricePichauHtml } from './scraper-pichau.js';

export async function fetchSinglePrice(browser, url, selector, usePuppeteer = false) {
    console.log(`fetchSinglePrice → url=${url}\n  selector=${selector}\n  usePuppeteer=${usePuppeteer}`);
    if (url.includes('pichau.com.br')) {
        try {
            const price = await fetchPricePichauHtml(url);
            console.log(`fetchSinglePrice [Pichau-HTML] → ${price}`);
            return price;
        } catch (err) {
            console.log(`fetchSinglePrice [Pichau-HTML failed] → ${err.message}, falling back to Puppeteer`);
            const price = await puppeteerFetch(browser, url, selector);
            console.log(`fetchSinglePrice [Puppeteer] → ${price}`);
            return price;
        }
    }
    const isPP = usePuppeteer
        || url.includes('mercadolivre.com.br')
        || url.includes('kabum.com.br');
    if (isPP) {
        const price = await puppeteerFetch(browser, url, selector);
        console.log(`fetchSinglePrice [Puppeteer] → ${price}`);
        return price;
    } else {
        const price = await axiosFetch(url, selector);
        console.log(`fetchSinglePrice [Axios] → ${price}`);
        return price;
    }
}
