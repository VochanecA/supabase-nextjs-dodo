// nextjs/src/app/api/ai/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerAdminClient } from '@/lib/supabase/serverAdminClient';

// Tipovi za AI logs
interface AILogRow {
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface CustomerRow {
  customer_id: string;
}

export async function GET(req: NextRequest) {
  try {
    // Authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const supabase = await createServerAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    // Get customer_id
    const { data: customer } = await supabase
      .from("customers")
      .select("customer_id")
      .eq("email", user.email.trim().toLowerCase())
      .single();

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const customerId = (customer as CustomerRow).customer_id;

    // Get today's date at midnight (UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Fetch all-time stats
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { data: allTimeData } = await supabase
      .from('ai_logs')
      .select('model, prompt_tokens, completion_tokens, total_tokens')
      .eq('customer_id', customerId);

    // Fetch today's stats
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { data: todayData } = await supabase
      .from('ai_logs')
      .select('model, prompt_tokens, completion_tokens, total_tokens')
      .eq('customer_id', customerId)
      .gte('created_at', today.toISOString());

    // Cast to proper types
    const allTimeLogs = (allTimeData as AILogRow[]) || [];
    const todayLogs = (todayData as AILogRow[]) || [];

    // Calculate statistics
    const total_requests = allTimeLogs.length;
    const total_tokens = allTimeLogs.reduce((sum, log) => sum + (log.total_tokens || 0), 0);
    const total_prompt_tokens = allTimeLogs.reduce((sum, log) => sum + (log.prompt_tokens || 0), 0);
    const total_completion_tokens = allTimeLogs.reduce((sum, log) => sum + (log.completion_tokens || 0), 0);

    const today_requests = todayLogs.length;
    const today_tokens = todayLogs.reduce((sum, log) => sum + (log.total_tokens || 0), 0);

    // Find most used model
    const modelCounts: Record<string, number> = {};
    allTimeLogs.forEach(log => {
      if (log.model) {
        modelCounts[log.model] = (modelCounts[log.model] || 0) + 1;
      }
    });

    const most_used_model = Object.entries(modelCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    return NextResponse.json({
      total_requests,
      total_tokens,
      total_prompt_tokens,
      total_completion_tokens,
      today_requests,
      today_tokens,
      most_used_model,
    });

  } catch (error) {
    console.error("Stats API error:", error);
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}