import { Page } from "playwright";
import { createTools } from "./tools";
import { buildPrompt } from "./prompt";
import { LLMClient } from "./interfaces";

export async function runAgent(page: Page, userQuery: string, llm: LLMClient) {
  const tools = createTools({
    page,
    xpathMap: new Map<number, string>(),
  });
  const systemPrompt = buildPrompt(userQuery, page.url());
  const result = await llm.generate({ tools, systemPrompt });
  console.log("LLM response:", result.text);
}
