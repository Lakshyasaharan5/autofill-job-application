import { Page } from "playwright";
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, stepCountIs } from 'ai';
import dotenv from 'dotenv';
import { createTools } from "./tools";
import { buildPrompt } from "./prompt";

dotenv.config({ quiet: true });

export async function runAgent(page: Page, userQuery: string) {  
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  });

  const state = {
    page,
    xpathMap: new Map<number, string>(),
  };

  const result = await generateText({
    model: openai('gpt-5-nano'),
    prompt: buildPrompt(userQuery, page.url()),
    tools: createTools(state),    
    stopWhen: stepCountIs(10),
  });
 
  console.log("LLM response:", result.text);
}
