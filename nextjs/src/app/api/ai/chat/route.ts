import { NextRequest, NextResponse } from "next/server";
import { createServerAdminClient } from '@/lib/supabase/serverAdminClient';
import { z } from 'zod';

// --- Constants & Configuration ---
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 1000;
const REQUEST_TIMEOUT = 30000; // 30 seconds

const config = {
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions' as const,
    referer: process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.vercel.app',
  },
  limits: {
    maxMessages: 20,
    maxMessageLength: 10000,
    maxTokens: 4000,
    dailyRequestLimit: 45, // Postavljamo na 45 umesto 50 kao buffer
  },
} as const;

// NOVA STRUKTURA: Grupisani modeli po pouzdanosti
const MODEL_TIERS = {
  // Tier 1: Najpouzdaniji free modeli (probaj prvo ove)
  primary: [
    'deepseek/deepseek-chat-v3.1:free',
    'meta-llama/llama-3.3-70b-instruct:free',
  ],
  // Tier 2: Backup modeli
  secondary: [
    'nvidia/nemotron-nano-12b-v2-vl:free',
    'z-ai/glm-4.5-air:free',
  ],
  // Tier 3: Poslednja opcija (mogu biti nestabilni)
  fallback: [
    'google/gemini-2.5-flash-lite',
    'minimax/minimax-m2',
    'openrouter/auto',
  ],
} as const;

// Type for all available models (extracted from MODEL_TIERS)
type ModelType = 
  | typeof MODEL_TIERS.primary[number]
  | typeof MODEL_TIERS.secondary[number]
  | typeof MODEL_TIERS.fallback[number];

// --- IN-MEMORY RATE LIMIT TRACKER ---
// NAPOMENA: Za production, koristite Redis ili bazu
interface RateLimitInfo {
  count: number;
  resetTime: number; // timestamp kada se resetuje
  failedModels: Set<string>; // modeli koji su failovali danas
}

const rateLimitStore = new Map<string, RateLimitInfo>();

function getRateLimitKey(): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `daily_limit_${today}`;
}

function checkRateLimit(): { allowed: boolean; remaining: number } {
  const key = getRateLimitKey();
  const info = rateLimitStore.get(key);
  
  if (!info) {
    return { allowed: true, remaining: config.limits.dailyRequestLimit };
  }
  
  // Proveri da li je prošao dan (reset)
  if (Date.now() > info.resetTime) {
    rateLimitStore.delete(key);
    return { allowed: true, remaining: config.limits.dailyRequestLimit };
  }
  
  const remaining = config.limits.dailyRequestLimit - info.count;
  return { 
    allowed: info.count < config.limits.dailyRequestLimit, 
    remaining: Math.max(0, remaining)
  };
}

function incrementRateLimit(): void {
  const key = getRateLimitKey();
  const info = rateLimitStore.get(key);
  
  if (!info) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    rateLimitStore.set(key, {
      count: 1,
      resetTime: tomorrow.getTime(),
      failedModels: new Set(),
    });
  } else {
    info.count++;
  }
}

function markModelAsFailed(model: string): void {
  const key = getRateLimitKey();
  const info = rateLimitStore.get(key);
  if (info) {
    info.failedModels.add(model);
  }
}

function isModelFailed(model: string): boolean {
  const key = getRateLimitKey();
  const info = rateLimitStore.get(key);
  return info?.failedModels.has(model) ?? false;
}

// --- Validation Schemas ---
const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1).max(config.limits.maxMessageLength),
});

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(config.limits.maxMessages),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional().default(DEFAULT_TEMPERATURE),
  maxTokens: z.number().min(1).max(config.limits.maxTokens).optional().default(DEFAULT_MAX_TOKENS),
});

// --- Interfaces ---
interface ChatResponse {
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  model_used?: string;
  fallback_used?: boolean;
  requests_remaining?: number; // Dodato: koliko zahteva je ostalo
}

interface SubscriptionDebugInfo {
  userEmail?: string;
  customerId?: string;
  subscriptionsFound: number;
  subscriptions?: Array<{
    subscription_id: string;
    subscription_status: string;
    created_at: string;
  }>;
}

// --- Database Row Types ---
interface CustomerRow {
  customer_id: string;
  email: string;
  name: string | null;
  auth_user_id: string | null;
  created_at: string;
  updated_at: string;
}

interface SubscriptionRow {
  subscription_id: string;
  customer_id: string;
  product_id: string | null;
  subscription_status: string;
  quantity: number | null;
  currency: string | null;
  start_date: string;
  next_billing_date: string | null;
  trial_end_date: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

// --- Custom Error Classes ---
class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

class AuthenticationError extends APIError {
  constructor(message: string = "Authentication failed") {
    super(message, 401, 'AUTH_ERROR');
  }
}

class SubscriptionError extends APIError {
  constructor(
    message: string = "Subscription required",
    public debug?: SubscriptionDebugInfo
  ) {
    super(message, 403, 'SUBSCRIPTION_REQUIRED');
  }
}

class ValidationError extends APIError {
  constructor(message: string = "Invalid request") {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

class RateLimitError extends APIError {
  constructor(message: string = "Rate limit exceeded", public remaining?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// --- Utility Functions ---
function cleanResponse(content: string): string {
  if (!content) return "No response generated";
  
  return content
    .replace(/^[!,.;\s]+/, '')
    .replace(/[!,.;\s]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function enhanceMessages(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>) {
  const hasSystemMessage = messages.some(msg => msg.role === 'system');
  
  if (!hasSystemMessage) {
    const systemMessage = {
      role: 'system' as const,
      content: "Provide clear, complete responses without adding unnecessary punctuation or symbols at the end. Use proper grammar and complete sentences."
    };
    return [systemMessage, ...messages];
  }
  
  return messages;
}

const memoizedEnhanceMessages = (() => {
  const cache = new Map<string, Array<{ role: 'system' | 'user' | 'assistant'; content: string }>>();
  
  return (messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>) => {
    const key = JSON.stringify(messages);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const enhanced = enhanceMessages(messages);
    cache.set(key, enhanced);
    return enhanced;
  };
})();

// --- Database Functions ---
async function hasActiveSubscription(userEmail: string): Promise<boolean> {
  if (!userEmail || typeof userEmail !== 'string') {
    return false;
  }

  try {
    const supabase = await createServerAdminClient();
    
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("customer_id")
      .eq("email", userEmail.trim().toLowerCase())
      .single();

    if (customerError || !customer) {
      return false;
    }

    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("subscriptions")
      .select("subscription_status")
      .eq("customer_id", (customer as CustomerRow).customer_id)
      .in("subscription_status", ["active", "trialing"]);

    if (subscriptionsError || !subscriptions) {
      return false;
    }

    return subscriptions.length > 0;
  } catch (error) {
    console.error("Subscription check failed:", error);
    return false;
  }
}

async function getSubscriptionDebugInfo(userEmail: string): Promise<SubscriptionDebugInfo> {
  try {
    const supabase = createServerAdminClient();
    
    const { data: customer, error: customerError } = await (await supabase)
      .from("customers")
      .select("customer_id")
      .eq("email", userEmail)
      .single();

    if (customerError || !customer) {
      throw new Error('Customer not found');
    }

    const { data: allSubscriptions, error: subscriptionsError } = await (await supabase)
      .from("subscriptions")
      .select("subscription_id, subscription_status, created_at")
      .eq("customer_id", (customer as CustomerRow).customer_id);

    if (subscriptionsError) {
      throw new Error('Failed to fetch subscriptions');
    }

    return {
      userEmail,
      customerId: (customer as CustomerRow).customer_id,
      subscriptionsFound: (allSubscriptions as SubscriptionRow[])?.length ?? 0,
      subscriptions: (allSubscriptions as SubscriptionRow[])?.map((sub: SubscriptionRow) => ({
        subscription_id: sub.subscription_id,
        subscription_status: sub.subscription_status,
        created_at: sub.created_at
      })),
    };
  } catch (error) {
    console.error("Debug info collection failed:", error);
    throw error;
  }
}

// --- OPTIMIZOVANA FUNKCIJA SA SMART FALLBACK ---
async function tryModelsWithFallback(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  temperature: number,
  maxTokens: number,
  preferredModel?: ModelType | string // Sada koristi ModelType za autocomplete
): Promise<{
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  model_used: string;
  fallback_used: boolean;
}> {
  if (!config.openRouter.apiKey) {
    throw new APIError("OpenRouter API key not configured", 500, 'CONFIGURATION_ERROR');
  }

  // NOVA LOGIKA: Kreiraj smart listu modela
  let modelsToTry: string[] = [];
  
  // 1. Ako je specificiran preferred model, probaj samo njega
  if (preferredModel) {
    modelsToTry = [preferredModel];
  } else {
    // 2. Inače, koristi tier sistem
    // Filtriraj modele koji nisu failovali danas
    const availablePrimary = MODEL_TIERS.primary.filter(m => !isModelFailed(m));
    const availableSecondary = MODEL_TIERS.secondary.filter(m => !isModelFailed(m));
    const availableFallback = MODEL_TIERS.fallback.filter(m => !isModelFailed(m));
    
    // Prioritizuj primary modele
    if (availablePrimary.length > 0) {
      modelsToTry = [...availablePrimary, ...availableSecondary, ...availableFallback];
    } else if (availableSecondary.length > 0) {
      modelsToTry = [...availableSecondary, ...availableFallback];
    } else if (availableFallback.length > 0) {
      modelsToTry = availableFallback;
    } else {
      // Svi modeli su failovali, resetuj i pokušaj ponovo
      console.warn("⚠️ All models marked as failed, resetting...");
      modelsToTry = [...MODEL_TIERS.primary, ...MODEL_TIERS.secondary];
    }
  }

  console.log(`🎯 Trying models: ${modelsToTry.slice(0, 3).join(' → ')}${modelsToTry.length > 3 ? '...' : ''}`);

  let lastError: Error | null = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    const isFallback = Boolean(i > 0 || (preferredModel && model !== preferredModel));
    
    try {
      console.log(`🤖 Model: ${model}${isFallback ? ' (fallback)' : ''}`);
      
      const enhancedMessages = memoizedEnhanceMessages(messages);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(config.openRouter.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.openRouter.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": config.openRouter.referer,
          "X-Title": "AI Service",
        },
        body: JSON.stringify({
          model: model,
          messages: enhancedMessages,
          max_tokens: maxTokens,
          temperature: temperature,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success: ${model}`);
        
        const rawContent = data.choices?.[0]?.message?.content ?? "No response generated";
        const cleanedContent = cleanResponse(rawContent);
        
        // Increment rate limit samo kada uspe
        incrementRateLimit();
        
        return {
          content: cleanedContent,
          usage: data.usage ?? undefined,
          model_used: model,
          fallback_used: isFallback,
        };
      } else {
        const errorText = await response.text();
        console.log(`❌ ${model} failed: ${response.status}`);
        
        // Označi model kao failed
        markModelAsFailed(model);
        
        lastError = new Error(`${model} failed: ${response.status} - ${errorText}`);
        
        if (response.status === 429) {
          // Rate limit od OpenRouter-a, ne od nas
          console.warn(`⚠️ ${model} hit OpenRouter rate limit`);
          continue;
        }
        
        continue;
      }
    } catch (error) {
      console.log(`❌ ${model} error:`, error);
      
      markModelAsFailed(model);
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (i === modelsToTry.length - 1) {
        throw lastError;
      }
      
      continue;
    }
  }

  throw lastError || new APIError("All models failed", 500, 'ALL_MODELS_FAILED');
}

// --- Request Logging ---
interface RequestLog {
  userId: string;
  endpoint: string;
  timestamp: string;
  modelUsed?: string;
  fallbackUsed?: boolean;
  responseTime: number;
  status: number;
  error?: string;
}

async function logRequest(log: RequestLog): Promise<void> {
  console.log('📊 Request logged:', log);
}

// --- AI Usage Logging (Supabase) ---
async function logAIUsage(
  customerId: string,
  model: string,
  inputText: string,
  responseText: string,
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  }
): Promise<void> {
  try {
    const supabase = await createServerAdminClient();
    
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - ai_logs table not in generated types yet
    const { error } = await supabase.from('ai_logs').insert({
      customer_id: customerId,
      model,
      prompt_tokens: usage?.prompt_tokens || 0,
      completion_tokens: usage?.completion_tokens || 0,
      total_tokens: usage?.total_tokens || 0,
      input_text: inputText,
      response_text: responseText,
    });

    if (error) {
      console.error('❌ Failed to log AI usage:', error);
    } else {
      console.log('✅ AI usage logged to database');
    }
  } catch (error) {
    console.error('❌ Error logging AI usage:', error);
  }
}

// --- Main POST Handler ---
export async function POST(
  req: NextRequest
): Promise<
  NextResponse<
    ChatResponse | { error: string; debug?: SubscriptionDebugInfo; code?: string; remaining?: number }
  >
> {
  const startTime = Date.now();
  let userId: string | undefined;
  
  try {
    // NOVA PROVJERA: Rate limit na početku
    const { allowed, remaining } = checkRateLimit();
    
    if (!allowed) {
      throw new RateLimitError(
        `Daily limit reached (${config.limits.dailyRequestLimit} requests/day). Try again tomorrow.`,
        remaining
      );
    }
    
    console.log(`📈 Requests remaining today: ${remaining}`);

    if (!config.openRouter.apiKey) {
      throw new APIError("OpenRouter API key not configured", 500, 'CONFIGURATION_ERROR');
    }

    // Authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError("Missing or invalid authorization header");
    }

    const token = authHeader.slice(7);
    if (!token) {
      throw new AuthenticationError("Invalid token");
    }

    const supabase = await createServerAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user || !user.email) {
      console.log('Auth error details:', {
        authError: authError?.message,
        userExists: !!user,
        tokenPresent: !!token
      });
      throw new AuthenticationError("Invalid authentication token");
    }

    userId = user.id;
    console.log('✅ Authenticated:', user.email);

    // Get customer_id for logging
    const { data: customer } = await supabase
      .from("customers")
      .select("customer_id")
      .eq("email", user.email.trim().toLowerCase())
      .single();

    const customerId = (customer as CustomerRow | null)?.customer_id;

    // Subscription Check
    if (process.env.NODE_ENV !== "development") {
      const subscribed = await hasActiveSubscription(user.email);
      if (!subscribed) {
        const debugInfo = await getSubscriptionDebugInfo(user.email);
        throw new SubscriptionError("Active subscription required", debugInfo);
      }
    } else {
      console.log("⚠️ Dev mode: skipping subscription check");
    }

    // Parse and Validate
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("Invalid JSON in request body");
    }

    const validationResult = ChatRequestSchema.safeParse(body);
    if (!validationResult.success) {
      throw new ValidationError(`Invalid request: ${validationResult.error.issues[0]?.message}`);
    }

    const { messages, model, temperature, maxTokens } = validationResult.data;

    // Call OpenRouter with Smart Fallback
    const result = await tryModelsWithFallback(
      messages,
      temperature,
      maxTokens,
      model
    );

    // Get updated remaining count
    const { remaining: updatedRemaining } = checkRateLimit();

    // Log AI usage to database (only if we have customer_id)
    if (customerId) {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
      await logAIUsage(customerId, result.model_used, lastUserMessage, result.content, result.usage);
    }

    await logRequest({
      userId: user.id,
      endpoint: '/api/ai/chat',
      timestamp: new Date().toISOString(),
      modelUsed: result.model_used,
      fallbackUsed: result.fallback_used,
      responseTime: Date.now() - startTime,
      status: 200,
    });

    return NextResponse.json({
      content: result.content,
      usage: result.usage,
      model_used: result.model_used,
      fallback_used: result.fallback_used,
      requests_remaining: updatedRemaining, // Dodato za frontend
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    await logRequest({
      userId: userId || 'unknown',
      endpoint: '/api/ai/chat',
      timestamp: new Date().toISOString(),
      responseTime,
      status: error instanceof APIError ? error.statusCode : 500,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    console.error("API error:", error);

    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    if (error instanceof SubscriptionError) {
      return NextResponse.json(
        { 
          error: error.message, 
          debug: error.debug,
          code: error.code 
        },
        { status: error.statusCode }
      );
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code,
          remaining: error.remaining || 0
        },
        { status: error.statusCode }
      );
    }

    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}