import { chromium } from "playwright";
import { runAgent } from "./agent";
import { RunConfig } from "./types";
import { FakeAIClient } from "./llm/FakeAIClient";
import { OpenAIClient } from "./llm/OpenAIClient";
import { LLMClient } from "./interfaces";

export default async function start({ userQuery, url, test }: RunConfig) {      
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  await page.goto(url);

  const llm: LLMClient = test ? new FakeAIClient() : new OpenAIClient();
  await runAgent(page, userQuery, llm);
  
  await browser.close();
}

(async () => {  
  await start({
    userQuery: "Can you please search 'playwright' and 'ai agents' and tell me what you find?",
    url: "file:///Users/lakshyasaharan/projects/stagehand-lite/examples/search-result/index.html",    
    test: true,
  });  
})();
