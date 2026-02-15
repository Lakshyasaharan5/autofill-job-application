import { chromium } from 'playwright';

const launchBrowser = async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });

  const page = await browser.newPage();
  await page.goto('file:///Users/lakshyasaharan/projects/stagehand-lite/examples/company-site/index.html');

  console.log(await page.locator('//html/body').ariaSnapshot());
  await page.getByRole('link', { name: 'About Us' }).click();

  await browser.close();
};

launchBrowser();

