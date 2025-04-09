// создание сервера на node.js с использованием Express
// npm install express axios cheerio puppeteer
// node server.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const app = express();
const PORT = 3000;

app.use(express.static('public'));

function resolveAbsoluteUrls($, baseUrl) {
    $('img, script, link').each((_, el) => {
        const tag = el.tagName;
        const attr = tag === 'img' ? 'src' :
            tag === 'script' ? 'src' :
                tag === 'link' ? 'href' : null;

        if (attr && $(el).attr(attr)) {
            const original = $(el).attr(attr);
            const absoluteUrl = new URL(original, baseUrl).href;
            $(el).attr(attr, absoluteUrl);
        }
    });
} // преобразование относительных URL в абсолютные (для изображений, скриптов и стилей)

async function scrape(url, format = 'html') {
    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        }); 

        const $ = cheerio.load(response.data, {
            xmlMode: format === 'xml'
        }); // загрузка HTML-страницы с помощью Cheerio

        if (format === 'html') {
            resolveAbsoluteUrls($, url);
        } // преобразование относительных URL в абсолютные

        const content = format === 'xml' ? $.xml() : $.html();
        const filename = path.join(__dirname, 'public', 'saved.html');
        fs.writeFileSync(filename, content, 'utf-8');
        return content;
    } catch (error) {
        console.error('Ошибка при скрапинге:', error.message);
        return `<p style="color:red;">Ошибка: ${error.message}</p>`;
    }
}

app.get('/scrape', async (req, res) => {
    const url = req.query.url;
    const format = req.query.format || 'html';

    if (!url) return res.send('<p>Не передан URL</p>');
    const content = await scrape(url, format);
    res.send(content);
});


app.get('/download', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'saved.html');
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Сначала выполните скрапинг');
    }
    res.download(filePath, 'scraped-page.html');
}); // cкачивание HTML

app.get('/pdf', async (req, res) => {
    const filePath = path.join(__dirname, 'public', 'saved.html');
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Сначала выполните скрапинг');
    } // проверка существования файла

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="scraped-page.pdf"'
    });
    res.send(pdfBuffer); // отправка PDF
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});