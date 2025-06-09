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
    let price;

    if (cleanUrl.includes('mercadolivre.com.br')) {
        page.setDefaultNavigationTimeout(60000);
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/114.0.0.0 Safari/537.36'
        );
        await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForSelector('.andes-money-amount__fraction', { timeout: 60000 });
        const frac = await page.$eval('.andes-money-amount__fraction', el => el.innerText);
        const cent = await page.$eval('.andes-money-amount__cents', el => el.innerText).catch(() => '00');
        price = parseFloat(
            `${frac},${cent}`.replace(/[^\d,]/g, '').replace(/\./g, '').replace(',', '.')
        );

    } else if (cleanUrl.includes('pichau.com.br')) {
        page.setDefaultNavigationTimeout(60000);
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/114.0.0.0 Safari/537.36'
        );
        await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

        let data;
        const jsonLd = await page.$$eval('script[type="application/ld+json"]', ss =>
            ss.map(s => s.innerText).find(txt => {
                try { const o = JSON.parse(txt); return o['@type'] === 'Product' && o.offers?.price; }
                catch { return false; }
            })
        );
        if (jsonLd) {
            const obj = JSON.parse(jsonLd);
            price = parseFloat(obj.offers.price);
        } else {
            const body = await page.evaluate(() => document.body.innerText);
            const m = body.match(/à vista\s*R\$[\s\u00a0]*([\d\.,]+)/i);
            if (!m) throw new Error('Preço à vista não encontrado na Pichau');
            price = parseFloat(
                m[1].replace(/[^\d,]/g, '').replace(/\./g, '').replace(',', '.')
            );
        }

    } else if (cleanUrl.includes('kabum.com.br')) {
        page.setDefaultNavigationTimeout(60000);
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/114.0.0.0 Safari/537.36'
        );
        await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        const text = await page.evaluate(() => document.body.innerText);
        const vals = Array.from(text.matchAll(/R\$[\s\u00a0]*([\d\.,]+)/g))
            .map(m => parseFloat(m[1].replace(/[^\d,]/g, '').replace(/\./g, '').replace(',', '.')));
        price = Math.min(...vals);

    } else {
        page.setDefaultNavigationTimeout(0);
        await page.setRequestInterception(true);
        page.on('request', req => {
            const t = req.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(t)) req.abort();
            else req.continue();
        });
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/114.0.0.0 Safari/537.36'
        );
        await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 0 });
        await page.waitForSelector(selector, { timeout: 30000 });
        const txt = await page.$eval(selector, el => el.innerText);
        price = parseFloat(
            txt.replace(/[^\d,]/g, '').replace(/\./g, '').replace(',', '.')
        );
    }

    await browser.close();
    return price;
}
