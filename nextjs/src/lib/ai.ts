// lib/ai.ts
import { getEnvVariable } from './env';

export type AIModelProvider = 'openrouter' | 'anthropic' | 'openai' | 'gemini' | 'deepseek';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  provider?: AIModelProvider;
  model?: string;
  stream?: boolean;
}

export interface AIResponse {
  role: 'assistant';
  content: string;
}

interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
}

const PROVIDER_CONFIG: Record<AIModelProvider, ProviderConfig> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: getEnvVariable('OPENAI_API_KEY'),
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: getEnvVariable('ANTHROPIC_API_KEY'),
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: getEnvVariable('GEMINI_API_KEY'),
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: getEnvVariable('OPENROUTER_API_KEY'),
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: getEnvVariable('DEEPSEEK_API_KEY'),
  },
};

const DEFAULT_MODELS: Record<AIModelProvider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-20240620',
  gemini: 'gemini-1.5-pro',
  openrouter: 'deepseek/deepseek-chat-v3.1:free',
  deepseek: 'deepseek-chat',
};

// ---------------------------
// Provider response types
// ---------------------------
interface OpenAIResponse {
  choices: Array<{ message: { content: string } }>;
}

interface AnthropicResponse {
  content: Array<{ text: string }>;
}

interface GeminiResponse {
  candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
}

type AIProviderResponse = OpenAIResponse | AnthropicResponse | GeminiResponse;

// ---------------------------
// Main function
// ---------------------------
export async function callAI(req: AIRequest): Promise<AIResponse> {
  const provider: AIModelProvider = req.provider ?? 'deepseek';
  const { baseUrl, apiKey } = PROVIDER_CONFIG[provider];

  const model = req.model ?? DEFAULT_MODELS[provider];

  const body =
    provider === 'anthropic'
      ? {
          model,
          max_tokens: req.maxTokens ?? 800,
          temperature: req.temperature ?? 0.7,
          messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
        }
      : {
          model,
          max_tokens: req.maxTokens ?? 800,
          temperature: req.temperature ?? 0.7,
          messages: req.messages,
          stream: req.stream ?? false,
        };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (provider !== 'gemini') {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://your-app.com'; // 🔄 replace with your domain
    headers['X-Title'] = 'Your App Name'; // 🔄 replace with app name
  }

  const url =
    provider === 'gemini'
      ? `${baseUrl}/models/${model}:generateContent?key=${apiKey}`
      : `${baseUrl}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error (${provider}, ${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as AIProviderResponse;

  let content: string | undefined;
  switch (provider) {
    case 'anthropic':
      content = (data as AnthropicResponse).content?.[0]?.text;
      break;
    case 'gemini':
      content = (data as GeminiResponse).candidates?.[0]?.content?.parts?.[0]?.text;
      break;
    default:
      content = (data as OpenAIResponse).choices?.[0]?.message?.content;
  }

  if (!content) {
    throw new Error(`Empty response from ${provider}`);
  }

  return { role: 'assistant', content };
}