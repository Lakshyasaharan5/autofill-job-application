import { Page } from "playwright";
import { distill } from "./htmlDistiller";
import { callLLM } from "./llm";
import { execute } from "./executor";

export async function runAgent(page: Page, userQuery: string) {
  while (true) {
    const { llmReadyTree, xpathMap } = await distill(page);

    const action = await callLLM({ userQuery, tree: llmReadyTree });

    if (action.type === "done") {
      console.log("Agent done.");
      break;
    }

    await execute(page, action, xpathMap);
  }
}
