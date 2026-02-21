import { LLMClient, LLMRequest, LLMResponse } from "../interfaces";

export class FakeAIClient implements LLMClient{
    async generate(request: LLMRequest): Promise<LLMResponse> {
        console.log("Fake AI request:", request);
        return {
            text: "Fake AI response"
        };
    }
}
