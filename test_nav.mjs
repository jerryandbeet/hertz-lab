import { chromium } from 'playwright';

async function testScreenshots() {
  const browser = await chromium.launch({ channel: 'msedge' });
  
  // 1. Desktop Test (1440x900)
  const contextDesktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const pageDesktop = await contextDesktop.newPage();
  await pageDesktop.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await pageDesktop.waitForTimeout(1000);

  // Screenshot 1: Desktop Hero Screen with Dynamic Island
  await pageDesktop.screenshot({ 
    path: 'C:/Users/anast/.gemini/antigravity/brain/e4575293-9efc-4dc0-927a-931ac8c6086a/test_desktop_hero.png' 
  });

  // Click on the Lab Modules menu to open dropdown
  const modulesBtn = pageDesktop.locator('button[title*="Открыть оглавление"]').first();
  await modulesBtn.click();
  await pageDesktop.waitForTimeout(500);

  // Screenshot 2: Desktop with Modules Dropdown Open
  await pageDesktop.screenshot({ 
    path: 'C:/Users/anast/.gemini/antigravity/brain/e4575293-9efc-4dc0-927a-931ac8c6086a/test_desktop_dropdown.png' 
  });

  // 2. Mobile Test (iPhone 14: 390x844)
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await pageMobile.waitForTimeout(1000);

  // Screenshot 3: Mobile Hero Screen
  await pageMobile.screenshot({ 
    path: 'C:/Users/anast/.gemini/antigravity/brain/e4575293-9efc-4dc0-927a-931ac8c6086a/test_mobile_hero.png' 
  });

  // Open modules menu on mobile
  const mobileModulesBtn = pageMobile.locator('button[title*="Открыть оглавление"]').first();
  await mobileModulesBtn.click();
  await pageMobile.waitForTimeout(500);

  // Screenshot 4: Mobile with Modules Dropdown Open
  await pageMobile.screenshot({ 
    path: 'C:/Users/anast/.gemini/antigravity/brain/e4575293-9efc-4dc0-927a-931ac8c6086a/test_mobile_dropdown.png' 
  });

  await browser.close();
  console.log('Screenshots completed successfully!');
}

testScreenshots().catch(err => {
  console.error(err);
  process.exit(1);
});
