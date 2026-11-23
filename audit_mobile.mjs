import { chromium } from 'playwright';

async function auditMobile() {
  const browser = await chromium.launch({ channel: 'msedge' });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const outDir = 'C:/Users/anast/.gemini/antigravity/brain/e4575293-9efc-4dc0-927a-931ac8c6086a';

  // 1. Hero
  await page.screenshot({ path: `${outDir}/mob_0_hero.png` });

  // 2. Station 1
  const s1 = page.locator('#station-fps');
  await s1.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/mob_1_fps.png` });

  // 3. Station 2
  const s2 = page.locator('#station-blur');
  await s2.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/mob_2_blur.png` });

  // 4. Station 3
  const s3 = page.locator('#station-tearing');
  await s3.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/mob_3_tearing.png` });

  // 5. Station 4
  const s4 = page.locator('#station-pacing');
  await s4.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/mob_4_pacing.png` });

  // 6. Station 5
  const s5 = page.locator('#station-input-lag');
  await s5.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/mob_5_lag.png` });

  // 7. Station 6
  const s6 = page.locator('#station-frame-gen');
  await s6.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/mob_6_ai.png` });

  // 8. Station 7
  const s7 = page.locator('#station-sandbox');
  await s7.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/mob_7_sandbox.png` });

  await browser.close();
  console.log('Mobile audit screenshots captured!');
}

auditMobile().catch(console.error);
