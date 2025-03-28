const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/scrape', async (req, res) => {
    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true
        });
        const page = await browser.newPage();
        
        await page.goto('https://www.iaai.com', { waitUntil: 'domcontentloaded' });

        // Accept cookies
        try {
            await page.click('#onetrust-accept-btn-handler');
        } catch (e) {}

        // Search for Tesla Model 3 & Model Y
        let results = [];
        const models = ['Tesla Model 3', 'Tesla Model Y'];
        
        for (const model of models) {
            await page.type('#search-input', model);
            await page.keyboard.press('Enter');
            await page.waitForSelector('.search-results');

            const cars = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('.search-result-item')).map(car => ({
                    title: car.querySelector('.title')?.innerText || 'N/A',
                    price: car.querySelector('.price')?.innerText || 'N/A',
                    link: car.querySelector('a')?.href || 'N/A',
                    status: car.innerText.includes('Buy Now') ? 'Available' : 'Not Available'
                }));
            });

            results = results.concat(cars.filter(car => car.status === 'Available'));
        }

        await browser.close();
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
