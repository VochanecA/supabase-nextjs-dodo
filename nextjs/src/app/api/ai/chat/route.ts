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
  },
} as const;

// Free → fallback ordering
const MODEL_PRIORITY = [
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'deepseek/deepseek-chat-v3.1:free',
  'google/gemini-2.5-flash-lite',
  'minimax/minimax-m2',
  'z-ai/glm-4.5-air:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'openrouter/auto',
] as const;

type ModelType = typeof MODEL_PRIORITY[number];

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
  constructor(message: string = "Rate limit exceeded") {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// --- Utility Functions ---
function cleanResponse(content: string): string {
  if (!content) return "No response generated";
  
  return content
    .replace(/^[!,.;\s]+/, '') // Remove from start
    .replace(/[!,.;\s]+$/, '') // Remove from end
    .replace(/\s+/g, ' ')     // Normalize whitespace
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

// Memoized version for performance
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
  // Validate input
  if (!userEmail || typeof userEmail !== 'string') {
    return false;
  }

  try {
    const supabase = await createServerAdminClient();
    
    // Get customer by email
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("customer_id")
      .eq("email", userEmail.trim().toLowerCase())
      .single();

    if (customerError || !customer) {
      return false;
    }

    // Get subscriptions with optimized query
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
    const supabase = await createServerAdminClient();
    
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("customer_id")
      .eq("email", userEmail)
      .single();

    if (customerError || !customer) {
      throw new Error('Customer not found');
    }

    const { data: allSubscriptions, error: subscriptionsError } = await supabase
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

// --- OpenRouter API Functions ---
async function tryModelsWithFallback(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  temperature: number,
  maxTokens: number,
  preferredModel?: string
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
  // Validate API key
  if (!config.openRouter.apiKey) {
    throw new APIError("OpenRouter API key not configured", 500, 'CONFIGURATION_ERROR');
  }

  let modelsToTry: string[] = [...MODEL_PRIORITY];
  
  // Prioritize preferred model if specified and valid
  if (preferredModel) {
    const isPreferredModelInPriority = MODEL_PRIORITY.includes(preferredModel as ModelType);
    if (isPreferredModelInPriority) {
      modelsToTry = [preferredModel, ...MODEL_PRIORITY.filter(m => m !== preferredModel)];
    } else {
      modelsToTry = [preferredModel, ...MODEL_PRIORITY];
    }
  }

  console.log(`Trying models in order: ${modelsToTry.join(' → ')}`);

  let lastError: Error | null = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    const isFallback = Boolean(i > 0 || (preferredModel && model !== preferredModel));
    
    try {
      console.log(`Attempting with model: ${model}${isFallback ? ' (fallback)' : ''}`);
      
      // Enhance messages with memoization
      const enhancedMessages = memoizedEnhanceMessages(messages);
      
      // Setup timeout
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
        console.log(`✅ Success with model: ${model}`);
        
        const rawContent = data.choices?.[0]?.message?.content ?? "No response generated";
        const cleanedContent = cleanResponse(rawContent);
        
        // Log response details for monitoring
        console.log(`Raw response: "${rawContent}"`);
        console.log(`Cleaned response: "${cleanedContent}"`);
        
        return {
          content: cleanedContent,
          usage: data.usage ?? undefined,
          model_used: model,
          fallback_used: isFallback,
        };
      } else {
        const errorText = await response.text();
        console.log(`❌ Model ${model} failed: ${response.status} - ${errorText}`);
        lastError = new Error(`Model ${model} failed: ${response.status} - ${errorText}`);
        
        // Handle rate limits specifically
        if (response.status === 429) {
          throw new RateLimitError(`Rate limit exceeded for model ${model}`);
        }
        
        // Continue with next model for other errors
        continue;
      }
    } catch (error) {
      console.log(`❌ Model ${model} error:`, error);
      
      if (error instanceof RateLimitError) {
        throw error;
      }
      
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // If last model, throw the error
      if (i === modelsToTry.length - 1) {
        throw lastError;
      }
      
      // Continue with next model
      continue;
    }
  }

  throw lastError || new APIError("All models failed", 500, 'ALL_MODELS_FAILED');
}

// --- Request Logging (Stub - implement based on your logging system) ---
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
  // Implement based on your logging system (Sentry, LogRocket, etc.)
  console.log('Request logged:', log);
}

// --- Main POST Handler ---
export async function POST(
  req: NextRequest
): Promise<
  NextResponse<
    ChatResponse | { error: string; debug?: SubscriptionDebugInfo; code?: string }
  >
> {
  const startTime = Date.now();
  let userId: string | undefined;
  
  try {
    // Validate environment
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

    // Verify token and get user
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
    console.log('✅ Authenticated user:', user.email);

    // --- Subscription Check ---
    if (process.env.NODE_ENV !== "development") {
      const subscribed = await hasActiveSubscription(user.email);
      if (!subscribed) {
        const debugInfo = await getSubscriptionDebugInfo(user.email);
        throw new SubscriptionError("Active subscription required", debugInfo);
      }
    } else {
      console.log("⚠️ Dev mode: skipping subscription check for:", user.email);
    }

    // --- Parse and Validate Request Body ---
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

    // --- Call OpenRouter with Fallback ---
    const result = await tryModelsWithFallback(
      messages,
      temperature,
      maxTokens,
      model
    );

    // Log successful request
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
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log error
    await logRequest({
      userId: userId || 'unknown',
      endpoint: '/api/ai/chat',
      timestamp: new Date().toISOString(),
      responseTime,
      status: error instanceof APIError ? error.statusCode : 500,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    console.error("API /api/ai/chat error:", error);

    // Handle specific error types
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
          error: "Rate limit exceeded. Please wait a bit before trying again.",
          code: error.code 
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

    // Generic error (don't expose internal details)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add OPTIONS handler for CORS if needed
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