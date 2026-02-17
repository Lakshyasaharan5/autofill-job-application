import { Page } from "playwright";
import { AgentAction } from "./types";

export async function execute(
  page: Page,
  action: AgentAction,
  xpathMap: Map<number, string>
) {
  console.log("Executing:", action);

  switch (action.type) {
    case "click": {
      const xpath = xpathMap.get(action.backendId);
      if (!xpath) {
        console.log("XPath not found for backendId", action.backendId);
        return;
      }

      await page.locator(xpath).click();
      await page.waitForLoadState("domcontentloaded");
      break;
    }

    case "type": {
      const xpath = xpathMap.get(action.backendId);
      if (!xpath) return;

      await page.locator(xpath).fill(action.text);
      break;
    }

    case "wait": {
      await page.waitForTimeout(1000);
      break;
    }

    case "done":
      console.log("Agent finished.");
      break;
  }
}
