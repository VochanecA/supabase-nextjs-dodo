// app/api/change-plan/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface ChangePlanRequest {
  subscription_id: string;
  product_id: string;
  prorate?: 'prorated_immediately' | 'prorated_next_billing_cycle' | 'no_proration';
}

interface ChangePlanResponse {
  subscription_id: string;
  status: string;
  message?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ChangePlanRequest = await request.json();
    const { subscription_id, product_id, prorate = 'prorated_immediately' } = body;

    if (!subscription_id || !product_id) {
      return NextResponse.json(
        { error: 'subscription_id and product_id are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    const environment = process.env.DODO_PAYMENTS_ENVIRONMENT;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Use correct base URL based on environment
const baseUrl =
  environment === 'live_mode'
    ? 'https://live.dodopayments.com'
    : 'https://test.dodopayments.com';


    // Log the request for debugging
    console.log('Changing plan for subscription:', subscription_id);
    console.log('Target product:', product_id);
    console.log('Environment:', environment);
    console.log('API URL:', `${baseUrl}/v1/subscriptions/${subscription_id}/change-plan`);

    const response = await fetch(`${baseUrl}/v1/subscriptions/${subscription_id}/change-plan`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        product_id,
        prorate,
      }),
    });

    const responseText = await response.text();
    console.log('Dodo API Response:', response.status, responseText);

    if (!response.ok) {
      throw new Error(`Dodo Payments API error: ${response.status} ${responseText}`);
    }

    const data: ChangePlanResponse = JSON.parse(responseText);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Change plan API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to change plan' },
      { status: 500 }
    );
  }
}