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
    '.svg': 'image/svg+xml',
    '.glb': 'model/gltf-binary'
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
  const port = 4185;
  const distDir = path.join(__dirname, 'dist');
  const server = await startStaticServer(distDir, port);

  console.log('[Verification] Launching Chromium...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const artifactDir = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\e4575293-9efc-4dc0-927a-931ac8c6086a';

  try {
    console.log('[Step 1] Navigating to http://localhost:4185...');
    await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 1. Hero Section Screenshot
    await page.screenshot({ path: path.join(artifactDir, 'v3_hero_screen_slogan.png') });
    console.log('[Screenshot] Saved v3_hero_screen_slogan.png');

    // 2. Navigation Bar
    const nav = await page.locator('nav[aria-label*="Навигация"]').first();
    await nav.screenshot({ path: path.join(artifactDir, 'v3_top_navigation_bar.png') });
    console.log('[Screenshot] Saved v3_top_navigation_bar.png');

    // 3. Module 02 Motion Blur
    const mod2 = await page.locator('#station-blur');
    await mod2.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await mod2.screenshot({ path: path.join(artifactDir, 'v3_module_2_motion_blur.png') });
    console.log('[Screenshot] Saved v3_module_2_motion_blur.png');

    // 4. Module 03 Tearing
    const mod3 = await page.locator('#station-tearing');
    await mod3.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await mod3.screenshot({ path: path.join(artifactDir, 'v3_module_3_tearing.png') });
    console.log('[Screenshot] Saved v3_module_3_tearing.png');

    // 5. Module 04 Frame Pacing
    const mod4 = await page.locator('#station-pacing');
    await mod4.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await mod4.screenshot({ path: path.join(artifactDir, 'v3_module_4_frame_pacing.png') });
    console.log('[Screenshot] Saved v3_module_4_frame_pacing.png');

    // 6. Module 05 Input Lag
    const mod5 = await page.locator('#station-input-lag');
    await mod5.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await mod5.screenshot({ path: path.join(artifactDir, 'v3_module_5_input_lag.png') });
    console.log('[Screenshot] Saved v3_module_5_input_lag.png');

    // 7. Module 06 AI Frame Gen
    const mod6 = await page.locator('#station-frame-gen');
    await mod6.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await mod6.screenshot({ path: path.join(artifactDir, 'v3_module_6_ai_frame_gen.png') });
    console.log('[Screenshot] Saved v3_module_6_ai_frame_gen.png');

    // 8. Module 07 Apollo Bust & Stone Shards
    const mod7 = await page.locator('#station-sandbox');
    await mod7.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await mod7.screenshot({ path: path.join(artifactDir, 'v3_module_7_apollo_bust_shards.png') });
    console.log('[Screenshot] Saved v3_module_7_apollo_bust_shards.png');

    console.log('\n========================================');
    console.log('✅ ALL SCREENSHOTS CAPTURED WITH 0 ERRORS!');
    console.log('========================================\n');

  } catch (err) {
    console.error('Test error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
})();
