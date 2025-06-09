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
        const fraction = await page.$eval('.andes-money-amount__fraction', el => el.innerText);
        const cents = await page.$eval('.andes-money-amount__cents', el => el.innerText).catch(() => '00');
        price = parseFloat(
            `${fraction},${cents}`
                .replace(/[^\d,]/g, '')
                .replace(/\./g, '')
                .replace(',', '.')
        );

    } else if (cleanUrl.includes('pichau.com.br')) {
        page.setDefaultNavigationTimeout(60000);
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/114.0.0.0 Safari/537.36'
        );
        await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Extrai o JSON-LD do produto
        const jsonLd = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => scripts.map(s => s.innerText)
        );
        let data;
        for (const txt of jsonLd) {
            try {
                const obj = JSON.parse(txt);
                if (obj['@type'] === 'Product' && obj.offers?.price) {
                    data = obj;
                    break;
                }
            } catch { }
        }
        if (!data) {
            throw new Error('JSON-LD de produto não encontrado na Pichau');
        }
        price = parseFloat(data.offers.price);

    } else if (cleanUrl.includes('kabum.com.br')) {
        page.setDefaultNavigationTimeout(60000);
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/114.0.0.0 Safari/537.36'
        );
        await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        const bodyText = await page.evaluate(() => document.body.innerText);
        const matches = Array.from(bodyText.matchAll(/R\$[\s\u00a0]*([\d\.,]+)/g));
        const values = matches.map(m =>
            parseFloat(
                m[1]
                    .replace(/[^\d,]/g, '')
                    .replace(/\./g, '')
                    .replace(',', '.')
            )
        );
        price = Math.min(...values);

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
        const text = await page.$eval(selector, el => el.innerText);
        price = parseFloat(
            text
                .replace(/[^\d,]/g, '')
                .replace(/\./g, '')
                .replace(',', '.')
        );
    }

    await browser.close();
    return price;
}
