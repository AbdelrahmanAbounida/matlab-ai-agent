export type ProviderId = "openai" | "anthropic" | "deepseek" | "xai" | "vercel";

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  apiKeyUrl: string;
  models: { id: string; name: string }[];
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: "openai",
    name: "OpenAI",
    apiKeyUrl: "https://platform.openai.com/api-keys",
    models: [
      { id: "gpt-4.1", name: "GPT-4.1" },
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
      { id: "gpt-4.1-nano", name: "GPT-4.1 Nano" },
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini" },
      { id: "o3", name: "o3" },
      { id: "o3-mini", name: "o3 Mini" },
      { id: "o4-mini", name: "o4 Mini" },
    ],
  },
  {
    id: "anthropic",
    name: "Claude (Anthropic)",
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
    models: [
      { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
      { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    apiKeyUrl: "https://platform.deepseek.com/api_keys",
    models: [
      { id: "deepseek-chat", name: "DeepSeek V3" },
      { id: "deepseek-reasoner", name: "DeepSeek R1" },
    ],
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    apiKeyUrl: "https://console.x.ai/",
    models: [
      { id: "grok-3", name: "Grok 3" },
      { id: "grok-3-mini", name: "Grok 3 Mini" },
      { id: "grok-2", name: "Grok 2" },
    ],
  },
  {
    id: "vercel",
    name: "Vercel AI Gateway",
    apiKeyUrl: "https://vercel.com/docs/ai-gateway",
    models: [
      { id: "anthropic/claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
      { id: "anthropic/claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
      { id: "openai/gpt-4.1", name: "GPT-4.1" },
      { id: "openai/gpt-4.1-mini", name: "GPT-4.1 Mini" },
      { id: "openai/gpt-4o", name: "GPT-4o" },
      { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
      { id: "deepseek/deepseek-chat", name: "DeepSeek V3" },
      { id: "deepseek/deepseek-reasoner", name: "DeepSeek R1" },
      { id: "xai/grok-3", name: "Grok 3" },
      { id: "xai/grok-3-mini", name: "Grok 3 Mini" },
    ],
  },
];

const STORAGE_KEY = "matlab-ai-model-config";

export interface ModelConfig {
  providerId: ProviderId;
  modelId: string;
  apiKey: string;
}

export function getStoredConfig(): ModelConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ModelConfig;
  } catch {
    return null;
  }
}

export function setStoredConfig(config: ModelConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearStoredConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getProvider(id: ProviderId): ProviderConfig {
  return PROVIDERS.find((p) => p.id === id)!;
}

export function getModelName(config: ModelConfig): string {
  const provider = getProvider(config.providerId);
  const model = provider.models.find((m) => m.id === config.modelId);
  return model ? model.name : config.modelId;
}

export function getProviderName(config: ModelConfig): string {
  return getProvider(config.providerId).name;
}
