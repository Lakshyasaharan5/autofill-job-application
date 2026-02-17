import { chromium } from "playwright";
import { distill } from "./htmlDistiller";

const launchBrowser = async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });

  const page = await browser.newPage();
  await page.goto("https://ultimateqa.com/");
  // await page.goto("https://google.com/");
  // await page.goto("file:///Users/lakshyasaharan/projects/stagehand-lite/examples/company-site/index.html");
  
  const { llmReadyTree } = await distill(page);
  console.log(llmReadyTree);

  await browser.close();
};

launchBrowser();
