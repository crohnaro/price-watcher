export async function fetchPriceWithPuppeteer(browser, url, selector) {
    console.log(`🕷️  Puppeteer scraping: ${url}`);
    const page = await browser.newPage();
    const cleanUrl = url.split('#')[0];

    page.setDefaultNavigationTimeout(60000);
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/114.0.0.0 Safari/537.36'
    );
    await page.setRequestInterception(true);
    page.on('request', req => {
        const t = req.resourceType();
        if (['image', 'media'].includes(t)) req.abort();
        else req.continue();
    });

    let priceText;

    if (cleanUrl.includes('mercadolivre.com.br')) {
        console.log('→ branch MercadoLivre');
        await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForSelector('.andes-money-amount__fraction', { timeout: 60000 });
        const frac = await page.$eval('.andes-money-amount__fraction', el => el.innerText);
        const cents = await page.$eval('.andes-money-amount__cents', el => el.innerText).catch(() => '00');
        priceText = `${frac},${cents}`;
    } else if (cleanUrl.includes('pichau.com.br')) {
        console.log('→ branch Pichau (networkidle2)');
        await page.goto(cleanUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        const vistaSelector = 'div[class*="price_vista"]';
        try {
            await page.waitForSelector(vistaSelector, { timeout: 60000 });
            priceText = await page.$eval(vistaSelector, el => el.innerText);
        } catch {
            console.log('⚠️  Pichau fallback to provided selector');
            await page.waitForSelector(selector, { timeout: 60000 });
            priceText = await page.$eval(selector, el => el.innerText);
        }
    } else {
        console.log('→ branch Generic');
        await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForSelector(selector, { timeout: 60000 });
        priceText = await page.$eval(selector, el => el.innerText);
    }

    await page.close();

    console.log(`🔍 raw priceText for ${url}: "${priceText}"`);
    const numeric = parseFloat(
        priceText
            .replace(/\u00a0/g, '')
            .replace(/[^\d,]/g, '')
            .replace(',', '.')
    );
    console.log(`✅ parsed price for ${url}: ${numeric}`);
    return numeric;
}
