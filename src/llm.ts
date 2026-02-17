import { AgentAction, LLMContext } from "./types";

let step = 0;

export async function callLLM(_context: LLMContext): Promise<AgentAction> {
  console.log("LLM thinking...");

  // Super fake reasoning loop
  if (step === 0) {
    step++;
    return { type: "type", backendId: 10, text: "playwright" };
  }

  if (step === 1) {
    step++;
    return { type: "click", backendId: 15 };
  }

  return { type: "done" };
}
