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
    server.listen(port, () => {
      resolve(server);
    });
  });
}

(async () => {
  const port = 4192;
  const distDir = path.join(__dirname, 'dist');
  const server = await startStaticServer(distDir, port);

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle' });
    const enterBtn = await page.waitForSelector('button:has-text("Начать исследование")');
    await enterBtn.click();
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      document.getElementById('station-input-lag')?.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await page.waitForTimeout(500);

    // Test 1: False Start (Early Click)
    console.log('--- Test 1: Testing Early Click / False Start ---');
    const startBox = page.locator('text=Нажмите сюда, чтобы начать замер реакции');
    await startBox.click();
    await page.waitForTimeout(200);

    const waitingBox = page.locator('text=ЖДИТЕ ЗЕЛЁНОГО СИГНАЛА...');
    console.log('Waiting state visible:', await waitingBox.isVisible());
    // Click early!
    await waitingBox.click();
    await page.waitForTimeout(200);

    const earlyText = page.locator('text=Слишком рано! Фальстарт.');
    const isEarly = await earlyText.isVisible();
    console.log('Early warning properly shown on early click:', isEarly);
    if (!isEarly) throw new Error('Early click did not trigger false start message!');

    // Test 2: Recovery from False Start and Successful Reaction
    console.log('--- Test 2: Recovering from False Start and completing run ---');
    await earlyText.click(); // Click to try again
    await page.waitForTimeout(200);
    console.log('Waiting state active again:', await page.locator('text=ЖДИТЕ ЗЕЛЁНОГО СИГНАЛА...').isVisible());

    const readyBtn = await page.waitForSelector('text=КЛИКАЙТЕ СЕЙЧАС!', { timeout: 6000 });
    console.log('Green signal appeared!');
    await readyBtn.click();
    await page.waitForTimeout(300);

    const resultText = await page.locator('text=Кликните для нового раунда').isVisible();
    console.log('Result card visible:', resultText);
    const scoreText = await page.locator('text=мс').first().textContent();
    console.log('Score text:', scoreText);

    // Test 3: New Round
    console.log('--- Test 3: Triggering New Round ---');
    const resultBox = page.locator('text=Кликните для нового раунда');
    await resultBox.click();
    await page.waitForTimeout(200);
    console.log('New round waiting state active:', await page.locator('text=ЖДИТЕ ЗЕЛЁНОГО СИГНАЛА...').isVisible());

    const readyBtn2 = await page.waitForSelector('text=КЛИКАЙТЕ СЕЙЧАС!', { timeout: 6000 });
    console.log('Second round green signal appeared!');
    await readyBtn2.click();
    await page.waitForTimeout(300);
    console.log('Second round finished successfully!');

    console.log('\n>>> ALL 3 REACTION BENCHMARK SCENARIOS PASSED WITH FLYING COLORS! <<<');
  } finally {
    await browser.close();
    server.close();
  }
})();
