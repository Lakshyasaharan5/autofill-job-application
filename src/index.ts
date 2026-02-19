import { chromium } from "playwright";
import { runAgent } from "./agent";

const main = async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();

  // await page.goto("https://ultimateqa.com/");
  // await page.goto("https://google.com/");
  // await page.goto("file:///Users/lakshyasaharan/projects/stagehand-lite/examples/search-result/index.html");
  await page.goto("file:///Users/lakshyasaharan/projects/stagehand-lite/examples/company-site/index.html");
  
  await runAgent(page, "Search for 'playwright'");

  await browser.close();
};

main();
