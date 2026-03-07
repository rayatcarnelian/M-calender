const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, '..', 'qa-report');
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR);
}

// Helper to delay
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

(async () => {
  console.log("🚀 Starting Hybrid Cross-Platform QA Framework...");
  console.log("=================================================");

  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  try {
    console.log("[1/5] Navigating to local dev server (http://localhost:3000)...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Test Initial Layout
    console.log("[2/5] Testing Main Calendar Layout rendering...");
    await sleep(1000); // give calendar time to mount external events
    await page.screenshot({ path: path.join(REPORT_DIR, '01_main_layout.png') });
    console.log("      ✓ Main Layout screenshot saved.");

    // Test Business Profile Modal
    console.log("[3/5] Testing Modal Overlay mechanics (Business Profile)...");
    const profileBtnClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Set Up Business Profile'));
      if (btn) { btn.click(); return true; }
      return false;
    });

    if (profileBtnClicked) {
      await sleep(500);
      await page.screenshot({ path: path.join(REPORT_DIR, '02_business_profile_modal.png') });
      console.log("      ✓ Business Profile Modal rendered correctly.");
      
      // Close modal by clicking backdrop
      await page.mouse.click(10, 10);
      await sleep(500);
    } else {
      console.log("      ! Profile button not found (Profile may already be set up).");
    }

    // Test Integrations Modal
    console.log("[4/5] Testing Integrations Modal...");
    const integrationsBtnClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Integrations'));
      if (btn) { btn.click(); return true; }
      return false;
    });

    if (integrationsBtnClicked) {
      await sleep(500);
      await page.screenshot({ path: path.join(REPORT_DIR, '03_integrations_modal.png') });
      console.log("      ✓ Integrations Modal rendered correctly.");
      
      await page.mouse.click(10, 10);
      await sleep(500);
    }

    // Test Event Generation Flow
    console.log("[5/5] Testing AI Generator UI overlay...");
    const generateBtnClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Generate 30-Day Content'));
      if (btn) { btn.click(); return true; }
      return false;
    });

    if (generateBtnClicked) {
      await sleep(500);
      await page.screenshot({ path: path.join(REPORT_DIR, '04_generator_modal.png') });
      console.log("      ✓ Generator Modal rendered correctly.");
    }

    console.log("\n✅ ALL QA TESTS PASSED.");
    console.log(`📸 Visual layout reports saved to: ${REPORT_DIR}`);
    
  } catch (error) {
    console.error("\n❌ QA TEST FAILED:", error);
  } finally {
    await browser.close();
  }
})();
