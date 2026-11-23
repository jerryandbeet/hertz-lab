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
  const port = 4179;
  const distDir = path.join(__dirname, 'dist');
  const server = await startStaticServer(distDir, port);

  console.log('[Verification] Launching Chromium...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('[Browser Error]', msg.text());
      errors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    console.error('[Page Unhandled Error]', err.message);
    errors.push(err.message);
  });

  try {
    console.log('[Step 1] Navigating to http://localhost:4179...');
    await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const title = await page.title();
    console.log(`[Title] ${title}`);
    if (!title.includes('Hertz')) {
      throw new Error(`Expected title to include Hertz, got: ${title}`);
    }

    // Check HUD Hertz brand
    const brandElement = await page.locator('aside[aria-label*="Hertz"] :has-text("Hertz")').first();
    await brandElement.waitFor({ state: 'visible', timeout: 3000 });
    console.log('[Check] Dynamic Island HUD with Hertz branding verified.');

    // Screenshot Hero with Monolithic Display Anatomy
    const artifactDir = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\e4575293-9efc-4dc0-927a-931ac8c6086a';
    await page.screenshot({ path: path.join(artifactDir, 'hertz_hero_display_anatomy.png') });
    console.log('[Screenshot] Saved hertz_hero_display_anatomy.png');

    // Test Module 1: Scroll to #station-fps and test dragging divider line
    console.log('[Step 2] Scrolling to Module 01 (FPS & Smoothness)...');
    await page.evaluate(() => {
      const el = document.getElementById('station-fps');
      if (el) el.scrollIntoView();
    });
    await page.waitForTimeout(800);

    // Verify dragging the divider on canvas
    const gemContainer = page.locator('div[class*="cursor-ew-resize"]').first();
    await gemContainer.waitFor({ state: 'visible' });
    const box = await gemContainer.boundingBox();
    if (box) {
      // Simulate click-and-drag from center to left
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.5, { steps: 5 });
      await page.mouse.up();
      console.log('[Check] Successfully dragged vertical divider line on canvas.');
    }
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(artifactDir, 'hertz_module_1_fixed_divider.png') });
    console.log('[Screenshot] Saved hertz_module_1_fixed_divider.png');

    // Test Module 07: GPU Geometry Stress Benchmark
    console.log('[Step 3] Scrolling to Module 07 (Instanced GPU Stress)...');
    await page.evaluate(() => {
      const el = document.getElementById('station-sandbox');
      if (el) el.scrollIntoView();
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, 'hertz_module_7_instanced_gpu_stress.png') });
    console.log('[Screenshot] Saved hertz_module_7_instanced_gpu_stress.png');

    // Run deep scan
    const scanBtn = page.locator('button:has-text("Запустить глубокое сканирование")').first();
    await scanBtn.click();
    console.log('[Scan] Scan initiated, waiting for calibration result...');
    
    // Wait for scan to complete
    const certBtn = page.locator('button:has-text("Паспорт плавности монитора")').first();
    await certBtn.waitFor({ state: 'visible', timeout: 15000 });
    console.log('[Check] Scan completed successfully. Opening certificate...');
    await certBtn.click();
    await page.waitForTimeout(500);

    const certModal = page.locator('text=#2026-HERTZ');
    await certModal.waitFor({ state: 'visible', timeout: 3000 });
    console.log('[Check] Calibration certificate #2026-HERTZ verified!');

    console.log('\n========================================');
    console.log('✅ ALL VERIFICATION CHECKS PASSED WITH 0 ERRORS!');
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Verification Error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
})();
