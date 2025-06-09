// src/services/scraper-puppeteer.js
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
    const cleanUrl = url.split('#')[0];

    page.setDefaultNavigationTimeout(60000);
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/114.0.0.0 Safari/537.36'
    );

    // bloqueia só imagens e mídia
    await page.setRequestInterception(true);
    page.on('request', req => {
        const t = req.resourceType();
        if (['image', 'media'].includes(t)) req.abort();
        else req.continue();
    });

    await page.goto(cleanUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
    });

    let priceText;
    if (cleanUrl.includes('mercadolivre.com.br')) {
        // Mercado Livre: frac + cents
        await page.waitForSelector('.andes-money-amount__fraction');
        const frac = await page.$eval('.andes-money-amount__fraction', el => el.innerText);
        const cents = await page.$eval('.andes-money-amount__cents', el => el.innerText).catch(() => '00');
        priceText = `${frac},${cents}`;

    } else if (cleanUrl.includes('pichau.com.br')) {
        // Pichau: usa o selector vindo do products.js
        await page.waitForSelector(selector);
        priceText = await page.$eval(selector, el => el.innerText);

    } else if (cleanUrl.includes('kabum.com.br')) {
        // Kabum: pega todos os R$… e escolhe o menor (pix/à vista)
        const body = await page.evaluate(() => document.body.innerText);
        const vals = Array.from(body.matchAll(/R\$[\s\u00a0]*([\d\.,]+)/g))
            .map(m => parseFloat(m[1].replace(/\./g, '').replace(',', '.')));
        priceText = String(Math.min(...vals)).replace('.', ',');

    } else {
        // fallback genérico: seletor custom
        await page.waitForSelector(selector);
        priceText = await page.$eval(selector, el => el.innerText);
    }

    await browser.close();

    return parseFloat(
        priceText
            .replace(/[^\d,]/g, '')
            .replace(',', '.')
    );
}
