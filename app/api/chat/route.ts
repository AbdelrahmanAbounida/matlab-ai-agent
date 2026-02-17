import { matlabTools } from "@/lib/matlab-tools";
import { MATLAB_SYSTEM_PROMPT } from "@/lib/prompt";
import { consumeStream, convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createXai } from "@ai-sdk/xai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import type { ProviderId } from "@/lib/model-store";

export const maxDuration = 60;

function getModel(providerId: ProviderId, modelId: string, apiKey: string) {
  switch (providerId) {
    case "openai":
      return createOpenAI({ apiKey })(modelId);
    case "anthropic":
      return createAnthropic({ apiKey })(modelId);
    case "deepseek":
      return createDeepSeek({ apiKey })(modelId);
    case "xai":
      return createXai({ apiKey })(modelId);
    case "vercel":
      // Vercel AI Gateway uses the OpenAI-compatible format
      return createOpenAI({
        apiKey,
        baseURL: "https://api.vercel.ai/v1",
      })(modelId);
    default:
      throw new Error(`Unknown provider: ${providerId}`);
  }
}

export async function POST(req: Request) {
  const { messages, providerId, modelId, apiKey } = (await req.json()) as {
    messages: UIMessage[];
    providerId?: ProviderId;
    modelId?: string;
    apiKey?: string;
  };

  if (!providerId || !modelId || !apiKey) {
    return new Response(
      JSON.stringify({ error: "AI model is not configured. Please set up your AI model first." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const model = getModel(providerId, modelId, apiKey);

  const prompt = await convertToModelMessages([
    {
      id: "system",
      role: "system",
      parts: [{ type: "text", text: MATLAB_SYSTEM_PROMPT }],
    },
    ...messages,
  ]);

  const result = streamText({
    model,
    messages: prompt,
    tools: matlabTools,
    stopWhen: stepCountIs(20),
    abortSignal: req.signal,
  });

  return result.toUIMessageStreamResponse({
    onFinish: async ({ isAborted, finishReason }) => {
      if (isAborted) {
        console.log("Stream aborted");
      } else {
        console.log(`Completed with ${finishReason}`);
      }
    },
    consumeSseStream: consumeStream,
  });
}
