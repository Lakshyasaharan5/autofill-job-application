import { Page } from "playwright";

export interface AgentState {
  page: Page;
  xpathMap: Map<number, string>;
}
