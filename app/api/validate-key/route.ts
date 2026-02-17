import { type ProviderId } from "@/lib/model-store";

const AI_GATEWAY_MODELS_URL = "https://ai-gateway.vercel.sh/v1/models";

export async function POST(req: Request) {
  const { providerId, apiKey } = (await req.json()) as {
    providerId: ProviderId;
    apiKey: string;
  };

  if (!apiKey) {
    return Response.json({ valid: false, error: "API key is required" });
  }

  try {
    switch (providerId) {
      case "openai": {
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (res.ok) return Response.json({ valid: true });
        return Response.json({ valid: false, error: "Invalid OpenAI API key" });
      }

      case "anthropic": {
        // Anthropic doesn't have a simple models list endpoint,
        // so we send a minimal messages request with max_tokens=1
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-3-5-haiku-20241022",
            max_tokens: 1,
            messages: [{ role: "user", content: "hi" }],
          }),
        });
        // 200 or 400 (bad request) both mean the key itself is valid
        if (res.status === 401 || res.status === 403) {
          return Response.json({ valid: false, error: "Invalid Anthropic API key" });
        }
        return Response.json({ valid: true });
      }

      case "deepseek": {
        const res = await fetch("https://api.deepseek.com/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (res.ok) return Response.json({ valid: true });
        return Response.json({ valid: false, error: "Invalid DeepSeek API key" });
      }

      case "xai": {
        const res = await fetch("https://api.x.ai/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (res.ok) return Response.json({ valid: true });
        return Response.json({ valid: false, error: "Invalid xAI API key" });
      }

      case "vercel": {
        try {
          const res = await fetch(AI_GATEWAY_MODELS_URL);
          if (!res.ok) {
            return Response.json({ valid: false, error: "Failed to fetch Vercel AI Gateway models" });
          }
          const data = (await res.json()) as {
            data: Array<{
              id: string;
              name: string;
              type?: string;
            }>;
          };
          const models = data.data
            .filter((m) => !m.type || m.type === "language")
            .map((m) => ({ id: m.id, name: m.name }));
          return Response.json({ valid: true, models });
        } catch {
          return Response.json({ valid: false, error: "Failed to reach Vercel AI Gateway" });
        }
      }

      default:
        return Response.json({ valid: false, error: "Unknown provider" });
    }
  } catch {
    return Response.json({ valid: false, error: "Failed to reach provider API" });
  }
}
