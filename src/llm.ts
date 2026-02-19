import { AgentAction, LLMContext } from "./types";
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, tool, ToolSet, stepCountIs } from 'ai';
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });


export async function callLLM(context: LLMContext): Promise<AgentAction> {
  console.log("LLM thinking...");

  // Actual LLM call
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  });

  const toolSet: ToolSet = {
      weather: weatherTool(),
      myName: myNameTool(context),
    }

  const { text } = await generateText({
    model: openai('gpt-40-mini'),
    prompt: 'What is my name?',
    tools: toolSet,    
    stopWhen: stepCountIs(10),
  });

  console.log("LLM response:", text);

  return { type: "done" };

  function weatherTool() {
    return tool({
      description: 'Get the weather in a location',
      inputSchema: z.object({
        location: z.string().describe('The location to get the weather for'),
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 6969,
      }),
    });
  }
}

function myNameTool(context: LLMContext) {
  return tool({
    description: 'Get the user\'s name',
    inputSchema: z.object({}),
    execute: async () => {
      console.log(context);
      return "Lakshya Saharan";
    },
  });
}

