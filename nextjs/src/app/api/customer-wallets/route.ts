// app/api/customer-wallets/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface CustomerWallet {
  wallet_id: string;
  balance: number;
  currency: string;
  created_at: string;
}

interface DodoWalletsResponse {
  wallets: CustomerWallet[];
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
      return NextResponse.json(
        { error: 'customer_id parameter is required' },
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
    const baseUrl = environment === 'live_mode' 
      ? 'https://live.dodopayments.com' 
      : 'https://test.dodopayments.com';

    const response = await fetch(`${baseUrl}/v1/customers/${customerId}/wallets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If wallets endpoint doesn't exist, return empty wallets
      if (response.status === 404) {
        return NextResponse.json({ wallets: [] });
      }
      throw new Error(`Dodo Payments API error: ${response.status}`);
    }

    const data: DodoWalletsResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Customer wallets API error:', error);
    // Return empty wallets array if API fails
    return NextResponse.json({ wallets: [] });
  }
}