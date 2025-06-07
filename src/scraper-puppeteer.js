import puppeteer from 'puppeteer';

export async function fetchPriceWithPuppeteer(url, selector) {
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
    page.setDefaultNavigationTimeout(0);
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

    await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 0
    });

    await page.waitForSelector(selector, { timeout: 30000 });
    const priceText = await page.$eval(selector, el => el.innerText);
    await browser.close();

    return parseFloat(
        priceText
            .replace(/[^\d,]/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
    );
}
