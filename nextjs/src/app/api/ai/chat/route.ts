import { NextRequest, NextResponse } from "next/server";
import { createServerAdminClient } from '@/lib/supabase/serverAdminClient';
import { config } from 'dotenv';
import { resolve } from 'path';

// Učitaj .env.local iz roditeljskog direktorijuma
config({ path: resolve(process.cwd(), '..', '.env.local') });

// --- Interfaces ---
interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

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

// Free → fallback ordering
const MODEL_PRIORITY = [
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'deepseek/deepseek-chat-v3.1:free',
  'google/gemini-2.5-flash-lite',
  'minimax/minimax-m2',
  'z-ai/glm-4.5-air:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'openrouter/auto',
];

// --- Clean response function ---
function cleanResponse(content: string): string {
  if (!content) return "No response generated";
  
  return content
    .replace(/^[!,.;\s]+/, '') // Ukloni sa početka
    .replace(/[!,.;\s]+$/, '') // Ukloni sa kraja
    .replace(/\s+/g, ' ') // Normalizuj razmake
    .trim();
}

// --- Enhance messages function ---
function enhanceMessages(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>) {
  // Dodaj system prompt ako već ne postoji
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

// --- Check active subscription ---
async function hasActiveSubscription(userEmail: string): Promise<boolean> {
  try {
    const supabase = await createServerAdminClient();
    
    if (!userEmail) return false;

    // Get customer by email
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("customer_id")
      .eq("email", userEmail)
      .single();

    if (customerError || !customer) return false;

    // Get subscriptions
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("customer_id", (customer as CustomerRow).customer_id);

    if (subscriptionsError || !subscriptions) return false;

    const activeSubscriptions = (subscriptions as SubscriptionRow[]).filter(
      (sub: SubscriptionRow) =>
        sub.subscription_status === "active" ||
        sub.subscription_status === "trialing"
    );

    return activeSubscriptions.length > 0;
  } catch (err) {
    console.error("Subscription check failed:", err);
    return false;
  }
}

// --- Try models in priority order ---
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
  let modelsToTry = MODEL_PRIORITY;
  
  // Ako je specificiran preferred model, stavite ga na prvo mesto
  if (preferredModel && MODEL_PRIORITY.includes(preferredModel)) {
    modelsToTry = [preferredModel, ...MODEL_PRIORITY.filter(m => m !== preferredModel)];
  } else if (preferredModel) {
    // Ako preferred model nije u listi, dodajte ga na početak
    modelsToTry = [preferredModel, ...MODEL_PRIORITY];
  }

  console.log(`Trying models in order: ${modelsToTry.join(' → ')}`);

  let lastError: Error | null = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    const isFallback = Boolean(i > 0 || (preferredModel && model !== preferredModel));
    
    try {
      console.log(`Attempting with model: ${model}${isFallback ? ' (fallback)' : ''}`);
      
      // Poboljšaj poruke pre slanja
      const enhancedMessages = enhanceMessages(messages);
      
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer":
              process.env.NEXT_PUBLIC_APP_URL ?? "https://yourapp.vercel.app",
            "X-Title": "AI Service",
          },
          body: JSON.stringify({
            model: model,
            messages: enhancedMessages,
            max_tokens: maxTokens,
            temperature: temperature,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success with model: ${model}`);
        
        const rawContent = data.choices?.[0]?.message?.content ?? "No response generated";
        const cleanedContent = cleanResponse(rawContent);
        
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
        
        // Ako nije rate limit, nastavite sa sledećim modelom
        if (response.status !== 429) {
          continue;
        } else {
          // Za rate limit, bacite grešku odmah
          throw new Error(`Rate limit exceeded for model ${model}`);
        }
      }
    } catch (error) {
      console.log(`❌ Model ${model} error:`, error);
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Ako je poslednji model u listi, baci grešku
      if (i === modelsToTry.length - 1) {
        throw lastError;
      }
      // Inače, nastavi sa sledećim modelom
      continue;
    }
  }

  throw lastError || new Error("All models failed");
}

// --- POST Handler ---
export async function POST(
  req: NextRequest
): Promise<
  NextResponse<
    ChatResponse | { error: string; debug?: SubscriptionDebugInfo }
  >
> {
  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    // Verify token and get user
    const supabase = await createServerAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user || !user.email) {
      console.log('Auth error details:', {
        authError,
        user: user ? { email: user.email, id: user.id } : 'no user',
        tokenPresent: !!token
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ Authenticated user:', user.email);

    // --- Subscription Check ---
    if (process.env.NODE_ENV !== "development") {
      const subscribed = await hasActiveSubscription(user.email);
      if (!subscribed) {
        try {
          // Get customer data
          const { data: customer, error: customerError } = await supabase
            .from("customers")
            .select("customer_id")
            .eq("email", user.email)
            .single();

          if (customerError) {
            console.log('Customer error:', customerError);
            throw new Error('Failed to fetch customer data');
          }

          const { data: allSubscriptions, error: subscriptionsError } = await supabase
            .from("subscriptions")
            .select("subscription_id, subscription_status, created_at")
            .eq("customer_id", (customer as CustomerRow)?.customer_id ?? "");

          if (subscriptionsError) {
            console.log('Subscriptions error:', subscriptionsError);
            throw new Error('Failed to fetch subscriptions');
          }

          const debugInfo: SubscriptionDebugInfo = {
            userEmail: user.email,
            customerId: (customer as CustomerRow)?.customer_id,
            subscriptionsFound: (allSubscriptions as SubscriptionRow[])?.length ?? 0,
            subscriptions: (allSubscriptions as SubscriptionRow[])?.map((sub: SubscriptionRow) => ({
              subscription_id: sub.subscription_id,
              subscription_status: sub.subscription_status,
              created_at: sub.created_at
            })),
          };

          return NextResponse.json(
            { error: "Subscription required", debug: debugInfo },
            { status: 403 }
          );
        } catch (debugError) {
          console.error("Debug info collection failed:", debugError);
          return NextResponse.json(
            { error: "Subscription required" },
            { status: 403 }
          );
        }
      }
    } else {
      console.log("⚠️ Dev mode: skipping subscription check for:", user.email);
    }

    // --- Parse body ---
    const body: ChatRequest = await req.json();
    const { messages, model, temperature, maxTokens } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        {
          error: "Server is not configured with an OpenRouter API key.",
        },
        { status: 500 }
      );
    }

    // --- Call OpenRouter with fallback ---
    const result = await tryModelsWithFallback(
      messages,
      temperature ?? 0.7,
      maxTokens ?? 1000,
      model // preferred model from frontend
    );

    return NextResponse.json({
      content: result.content,
      usage: result.usage,
      model_used: result.model_used,
      fallback_used: result.fallback_used,
    });
  } catch (error) {
    console.error("API /api/ai/chat error:", error);
    
    if (error instanceof Error && error.message.includes('Rate limit')) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait a bit before trying again.",
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}