import { chromium } from "playwright";
import { runAgent } from "./agent";

const main = async () => {
  const userQuery: string = "Can you please search 'playwright' and tell me what you find?";

  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  // await page.goto("https://ultimateqa.com/");
  await page.goto("file:///Users/lakshyasaharan/projects/stagehand-lite/examples/search-result/index.html");
  
  await runAgent(page, userQuery);

  await browser.close();
};

main();
