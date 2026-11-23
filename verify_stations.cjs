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
      console.log(`[Static Server] Running on http://localhost:${port}`);
      resolve(server);
    });
  });
}

(async () => {
  const port = 4173;
  const distDir = path.join(__dirname, 'dist');
  const server = await startStaticServer(distDir, port);

  console.log('[Verification] Launching Chromium...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('[Browser Error]', msg.text());
      errors.push(msg.text());
    } else {
      console.log('[Browser Log]', msg.text());
    }
  });

  page.on('pageerror', (err) => {
    console.error('[Page Unhandled Error]', err.message);
    errors.push(err.message);
  });

  try {
    console.log('[Verification] Navigating to http://localhost:' + port);
    await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle' });

    const title = await page.title();
    console.log('[Verification] Page Title:', title);

    // 1. Verify Hero Screen
    const heroHeading = await page.waitForSelector('h1:has-text("Анатомия кадровой частоты")');
    console.log('[Verification] Hero Welcome Screen Headline confirmed:', !!heroHeading);

    // Verify 3D Hero interactive canvas
    const heroCanvas = await page.waitForSelector('canvas');
    console.log('[Verification] Hero 3D interactive canvas confirmed:', !!heroCanvas);

    // 2. Click "Войти в лабораторию"
    const enterBtn = await page.waitForSelector('button:has-text("Начать исследование"), button:has-text("Войти в лабораторию")');
    await enterBtn.click();
    await page.waitForTimeout(500);

    // 3. Verify Station 1 loaded
    const st1Heading = await page.waitForSelector('h2:has-text("Кадровая частота и плавность")');
    console.log('[Verification] Successfully entered Lab, Station 1 header:', !!st1Heading);

    // Test Acoustic Frequency Generator on Station 1
    const acousticBtn = await page.waitForSelector('button:has-text("60 Гц")');
    await acousticBtn.click();
    console.log('[Verification] Acoustic 60Hz hum activated');
    await page.waitForTimeout(300);
    await acousticBtn.click(); // stop hum

    // 4. Test Return to Hero Screen
    const homeBtn = await page.waitForSelector('button[title*="Титульный экран"]');
    await homeBtn.click();
    await page.waitForTimeout(400);
    const heroReopened = await page.waitForSelector('button:has-text("Начать исследование"), button:has-text("Войти в лабораторию")');
    console.log('[Verification] Return to Hero Screen confirmed:', !!heroReopened);

    // Re-enter lab to test guided tour from navigation bar
    await heroReopened.click();
    await page.waitForTimeout(400);

    // 5. Navigate to Station 6 (Benchmark / Sandbox) using hotkey '6'
    await page.keyboard.press('6');
    await page.waitForTimeout(600);
    console.log('[Verification] Navigated to Station 6 via hotkey 6');

    // Test Hardware scan + Certificate on Station 6
    const scanBtn = page.locator('button:has-text("Запустить глубокое сканирование")');
    await scanBtn.click();
    console.log('[Verification] Running Hardware Hz Scan on Station 6...');
    
    // Wait for the scan to finish and the certificate button to become visible
    const certBtn = page.locator('button:has-text("Паспорт плавности монитора")');
    await certBtn.waitFor({ state: 'visible', timeout: 15000 });
    await certBtn.click();
    console.log('[Verification] Opened Monitor Calibration Certificate modal');

    const certModal = await page.waitForSelector(':has-text("CALIBRATION CERTIFICATE")');
    console.log('[Verification] Certificate modal visible:', !!certModal);

    const closeCert = page.locator('button:has-text("Закрыть")');
    await closeCert.click();
    await page.waitForTimeout(300);

    // Verify Station 5 Mouse Polling Rate via hotkey '5'
    await page.keyboard.press('5');
    await page.waitForTimeout(600);
    console.log('[Verification] Navigated to Station 5 via hotkey 5');
    const poll8k = page.locator('button:has-text("8000 Гц")');
    await poll8k.click();
    console.log('[Verification] Station 5 8000Hz Polling Rate clicked');
    console.log('[Verification] Station 5 8000Hz Polling Rate clicked');

    console.log('\n[Verification Summary]');
    console.log(`Total Errors Caught: ${errors.length}`);
    if (errors.length > 0) {
      console.error('Errors encountered:', errors);
      process.exitCode = 1;
    } else {
      console.log('ALL NEW FEATURES & HERO SCREEN VERIFIED WITH 0 ERRORS!');
    }
  } catch (err) {
    console.error('[Verification Failed]', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
})();
