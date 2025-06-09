import { fetchPrice as axiosFetch } from './scraper.js';
import { fetchPriceWithPuppeteer as puppeteerFetch } from './scraper-puppeteer.js';

export async function fetchSinglePrice(url, selector, usePuppeteer = false) {
    return usePuppeteer
        ? await puppeteerFetch(url, selector)
        : await axiosFetch(url, selector);
}
