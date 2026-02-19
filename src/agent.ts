import { Page } from "playwright";
import { distill } from "./htmlDistiller";
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, tool, ToolSet, stepCountIs } from 'ai';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

class AgentContext {
  xpathMap: Map<number, string> = new Map();
}

const context = new AgentContext();


export async function runAgent(page: Page, _userQuery: string) {
  
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  });

  const toolSet: ToolSet = {
    ariaTree: ariaTreeTool(context, page),
    click: clickTool(context, page),
    type: typeTool(context, page),
  }
  //@ts-ignore
  const searchPrompt = 'Can you click on the "About Us" link? For that you can call the tools by sending the ID of the element you get from aria tree. Always call aria tree to see updated page.';
  //@ts-ignore
  const searchPrompt2 = 'Can you please tell me team members and pricing details? Sometimes the page might not have all the information, so you might need to click on multiple links to get the complete information or go back home page and navigate to different sections. For that you can call the tools by sending the ID of the element you get from aria tree. Always call aria tree to see updated page.';
  //@ts-ignore
  const google = "Can you please search NYC to SEA flights in google's combo box and click search button?";
  const { text } = await generateText({
    model: openai('gpt-5'),
    prompt: searchPrompt2,
    tools: toolSet,    
    stopWhen: stepCountIs(10),
  });

  console.log("LLM response:", text);


}

function ariaTreeTool(context: AgentContext, page: Page) {
  return tool({
    description:
      "gets the accessibility (ARIA) hybrid tree text for the current page. use this to understand structure and content.",
    inputSchema: z.object({}),
    execute: async () => {
      const { llmReadyTree, xpathMap } = await distill(page);
      context.xpathMap = xpathMap;
      return llmReadyTree;
    },      
  })
}

function clickTool(context: AgentContext, page: Page) {
  return tool({
    description:
      "clicks an element on the page. use this to interact with elements.",
    inputSchema: z.object({
      id: z.number(),
    }),

    execute: async ({ id }) => {

      const xpath = context.xpathMap.get(id);

      if (!xpath) {
        throw new Error(`No xpath found for id ${id}`);
      }

      await page.locator(xpath).click();
      await page.waitForLoadState("domcontentloaded");

      return `Clicked element ${id}`;
    },
  });
}

function typeTool(context: AgentContext, page: Page) {
  return tool({
    description:
      "types text into an element on the page. use this to interact with elements.",
    inputSchema: z.object({
      id: z.number(),
      text: z.string(),
    }),

    execute: async ({ id, text }) => {

      const xpath = context.xpathMap.get(id);

      if (!xpath) {
        throw new Error(`No xpath found for id ${id}`);
      }

      await page.locator(xpath).fill(text);
      await page.waitForLoadState("domcontentloaded");

      return `Typed "${text}" into element ${id}`;
    },
  });
}
