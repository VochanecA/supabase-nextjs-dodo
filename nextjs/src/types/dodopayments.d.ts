declare module '@dodopayments/nextjs' {
  import { NextRequest } from 'next/server';

  interface CheckoutOptions {
    bearerToken: string;
    returnUrl: string;
    environment: 'test_mode' | 'live_mode';
    type?: 'static' | 'session' | 'dynamic';
  }

  interface CustomerPortalOptions {
    bearerToken: string;
    environment: 'test_mode' | 'live_mode';
  }

  // Webhook payload interfaces
  interface PaymentData {
    id: string;
    amount: number;
    currency: string;
    status: string;
    customer_id?: string;
    subscription_id?: string;
    metadata?: Record<string, string>;
    created_at: string;
  }

  interface SubscriptionData {
    id: string;
    status: string;
    customer_id: string;
    plan_id: string;
    current_period_start: string;
    current_period_end: string;
    metadata?: Record<string, string>;
  }

  interface RefundData {
    id: string;
    payment_id: string;
    amount: number;
    currency: string;
    status: string;
    reason?: string;
  }

  interface DisputeData {
    id: string;
    payment_id: string;
    amount: number;
    currency: string;
    status: string;
    reason?: string;
    evidence?: Record<string, unknown>;
  }

  interface LicenseKeyData {
    id: string;
    product_id: string;
    customer_id: string;
    key: string;
    status: string;
    expires_at?: string;
  }

  type WebhookData = 
    | { type: 'payment'; data: PaymentData }
    | { type: 'subscription'; data: SubscriptionData }
    | { type: 'refund'; data: RefundData }
    | { type: 'dispute'; data: DisputeData }
    | { type: 'license_key'; data: LicenseKeyData }
    | { type: string; data: Record<string, unknown> };

  interface WebhookPayload {
    id: string;
    type: string;
    event: string;
    data: WebhookData;
    created_at: string;
  }

  interface WebhooksOptions {
    webhookKey: string;
    onPayload?: (payload: WebhookPayload) => Promise<void>;
    onPaymentSucceeded?: (payload: WebhookPayload) => Promise<void>;
    onPaymentFailed?: (payload: WebhookPayload) => Promise<void>;
    onPaymentProcessing?: (payload: WebhookPayload) => Promise<void>;
    onPaymentCancelled?: (payload: WebhookPayload) => Promise<void>;
    onRefundSucceeded?: (payload: WebhookPayload) => Promise<void>;
    onRefundFailed?: (payload: WebhookPayload) => Promise<void>;
    onDisputeOpened?: (payload: WebhookPayload) => Promise<void>;
    onDisputeExpired?: (payload: WebhookPayload) => Promise<void>;
    onDisputeAccepted?: (payload: WebhookPayload) => Promise<void>;
    onDisputeCancelled?: (payload: WebhookPayload) => Promise<void>;
    onDisputeChallenged?: (payload: WebhookPayload) => Promise<void>;
    onDisputeWon?: (payload: WebhookPayload) => Promise<void>;
    onDisputeLost?: (payload: WebhookPayload) => Promise<void>;
    onSubscriptionActive?: (payload: WebhookPayload) => Promise<void>;
    onSubscriptionOnHold?: (payload: WebhookPayload) => Promise<void>;
    onSubscriptionRenewed?: (payload: WebhookPayload) => Promise<void>;
    onSubscriptionPlanChanged?: (payload: WebhookPayload) => Promise<void>;
    onSubscriptionCancelled?: (payload: WebhookPayload) => Promise<void>;
    onSubscriptionFailed?: (payload: WebhookPayload) => Promise<void>;
    onSubscriptionExpired?: (payload: WebhookPayload) => Promise<void>;
    onLicenseKeyCreated?: (payload: WebhookPayload) => Promise<void>;
  }

  export function Checkout(options: CheckoutOptions): (request: NextRequest) => Promise<Response>;
  export function CustomerPortal(options: CustomerPortalOptions): (request: NextRequest) => Promise<Response>;
  export function Webhooks(options: WebhooksOptions): (request: NextRequest) => Promise<Response>;
}