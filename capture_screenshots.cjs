const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

function startStaticServer(distPath, port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/') reqUrl = '/index.html';
    const filePath = path.join(distPath, reqUrl);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        fs.readFile(path.join(distPath, 'index.html'), (err2, data2) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data2);
          }
        });
      } else {
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(data);
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

(async () => {
  const port = 4174;
  const distDir = path.join(__dirname, 'dist');
  const server = await startStaticServer(distDir, port);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const outDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 1. Capture Hero Screen
  await page.screenshot({ path: path.join(outDir, 'hero.png'), fullPage: false });
  console.log('Captured hero.png');

  // 2. Enter Lab
  await page.locator('button:has-text("Войти в лабораторию")').click();
  await page.waitForTimeout(500);

  const stationButtons = [
    'FPS & Плавность',
    'Motion Blur',
    'Tearing & V-Sync',
    'Frame Pacing',
    'Задержка отклика',
    'AI Генерация кадров',
    'Hz Тест & Бенчмарк'
  ];

  for (let i = 0; i < stationButtons.length; i++) {
    const name = stationButtons[i];
    await page.locator(`button:has-text("${name}")`).first().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, `station-${i+1}.png`), fullPage: false });
    console.log(`Captured station-${i+1}.png`);
  }

  await browser.close();
  server.close();
})();
