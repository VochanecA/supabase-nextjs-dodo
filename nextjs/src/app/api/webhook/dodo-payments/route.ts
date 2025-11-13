// src/app/api/webhook/dodo-payments/route.ts
import { Webhooks } from '@dodopayments/nextjs'
import { createServerAdminClient } from '@/lib/supabase/serverAdminClient'

// --- Type Definitions ---
interface DodoCustomer {
  customer_id: string
  email: string
  name?: string
}

interface DodoPaymentSucceededData {
  payment_id: string
  status: string
  total_amount: number
  currency: string
  customer: DodoCustomer
  subscription_id?: string
  payment_method?: string
  card_last_four?: string
  card_network?: string
  card_type?: string
  metadata?: Record<string, unknown>
}

interface DodoSubscriptionData {
  subscription_id: string
  status: string
  customer: DodoCustomer
  product_id?: string
  quantity?: number
  currency?: string
  start_date?: string
  next_billing_date?: string
  trial_period_days?: number
  metadata?: Record<string, unknown>
  created_at?: string
}

interface DodoRefundData {
  refund_id: string
  payment_id: string
  customer: DodoCustomer
  amount: number
  currency?: string
  is_partial?: boolean
  reason?: string
  status?: string
  created_at?: string
}

interface DodoDisputeData {
  dispute_id: string
  payment_id: string
  amount?: number
  currency?: string
  dispute_stage?: string
  dispute_status?: string
  remarks?: string
  created_at?: string
}

interface DodoWebhookPayload<T = unknown> {
  type: string
  data: T
  timestamp: string
}

type MyWebhookPayload = 
  | (DodoWebhookPayload<DodoPaymentSucceededData> & { type: 'payment.succeeded' })
  | (DodoWebhookPayload<DodoSubscriptionData> & { type: 'subscription.active' })
  | (DodoWebhookPayload<DodoSubscriptionData> & { type: 'subscription.created' })
  | (DodoWebhookPayload<DodoSubscriptionData> & { type: 'subscription.cancelled' })
  | (DodoWebhookPayload<DodoRefundData> & { type: 'payment.refund' })
  | (DodoWebhookPayload<DodoDisputeData> & { type: 'payment.dispute' })

// --- Custom Database Types with Index Signatures ---
interface CustomerRow extends Record<string, unknown> {
  customer_id: string
  email: string
  name: string | null
  auth_user_id?: string | null // Link to Supabase auth users
  created_at: string
  updated_at: string
}

interface ProductRow extends Record<string, unknown> {
  product_id: string
  name: string
  created_at: string
  updated_at: string
}

interface SubscriptionRow extends Record<string, unknown> {
  subscription_id: string
  customer_id: string
  product_id: string | null
  subscription_status: string
  quantity: number
  currency: string | null
  start_date: string
  next_billing_date: string | null
  trial_end_date: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

interface TransactionRow extends Record<string, unknown> {
  transaction_id: string
  subscription_id: string | null
  customer_id: string
  status: string
  amount: number
  currency: string
  payment_method: string | null
  card_last_four: string | null
  card_network: string | null
  card_type: string | null
  billed_at: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

interface RefundRow extends Record<string, unknown> {
  refund_id: string
  transaction_id: string
  customer_id: string
  amount: number
  currency: string | null
  is_partial: boolean
  reason: string | null
  status: string | null
  created_at: string
}

interface DisputeRow extends Record<string, unknown> {
  dispute_id: string
  transaction_id: string
  amount: number | null
  currency: string | null
  dispute_stage: string | null
  dispute_status: string | null
  remarks: string | null
  created_at: string
}

// --- Type Guards ---
const isPaymentSucceeded = (payload: MyWebhookPayload): payload is DodoWebhookPayload<DodoPaymentSucceededData> & { type: 'payment.succeeded' } =>
  payload.type === 'payment.succeeded'

const isSubscriptionActive = (payload: MyWebhookPayload): payload is DodoWebhookPayload<DodoSubscriptionData> & { type: 'subscription.active' } =>
  payload.type === 'subscription.active'

const isSubscriptionCreated = (payload: MyWebhookPayload): payload is DodoWebhookPayload<DodoSubscriptionData> & { type: 'subscription.created' } =>
  payload.type === 'subscription.created'

const isSubscriptionCancelled = (payload: MyWebhookPayload): payload is DodoWebhookPayload<DodoSubscriptionData> & { type: 'subscription.cancelled' } =>
  payload.type === 'subscription.cancelled'

const isRefund = (payload: MyWebhookPayload): payload is DodoWebhookPayload<DodoRefundData> & { type: 'payment.refund' } =>
  payload.type === 'payment.refund'

const isDispute = (payload: MyWebhookPayload): payload is DodoWebhookPayload<DodoDisputeData> & { type: 'payment.dispute' } =>
  payload.type === 'payment.dispute'

// --- Logging ---
const log = (...args: unknown[]): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args)
  }
}

// --- Supabase Helpers ---
async function upsertRow<T extends Record<string, unknown>>(
  table: string,
  row: T,
  conflictColumn: keyof T
): Promise<void> {
  const supabase = await createServerAdminClient()
  
  // Use type assertion to bypass strict type checking
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(table) as any)
    .upsert([row], { 
      onConflict: conflictColumn as string 
    })
  
  if (error) {
    log(`❌ Failed to upsert ${table}:`, error.message)
    throw error
  }
  
  log(`✅ Upserted ${table}:`, conflictColumn, row[conflictColumn])
}

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  try {
    const supabase = await createServerAdminClient()
    
    // Use auth.admin to find user by email
    const { data, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      log('❌ Error fetching users:', error.message)
      return null
    }
    
    const user = data.users.find(u => u.email === email)
    return user?.id || null
  } catch (error) {
    log('❌ Error finding auth user:', error)
    return null
  }
}

async function upsertCustomer(customer: DodoCustomer): Promise<string> {
  const supabase = await createServerAdminClient()
  
  try {
    // Try to find existing customer by email
    const { data: existingByEmail, error: emailError } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('customers') as any)
      .select('customer_id, auth_user_id')
      .eq('email', customer.email)
      .single()

    if (emailError && emailError.code !== 'PGRST116') {
      throw emailError
    }
    
    if (existingByEmail?.customer_id) {
      log(`🔄 Reusing existing customer_id ${existingByEmail.customer_id} for email ${customer.email}`)
      
      // Update auth_user_id if not set
      if (!existingByEmail.auth_user_id) {
        const authUserId = await findAuthUserIdByEmail(customer.email)
        if (authUserId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('customers') as any)
            .update({ auth_user_id: authUserId, updated_at: new Date().toISOString() })
            .eq('customer_id', existingByEmail.customer_id)
        }
      }
      
      return existingByEmail.customer_id
    }

    // Find auth user ID for linking
    const authUserId = await findAuthUserIdByEmail(customer.email)

    const customerRow: CustomerRow = {
      customer_id: customer.customer_id,
      email: customer.email,
      name: customer.name ?? null,
      auth_user_id: authUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    await upsertRow('customers', customerRow, 'customer_id')
    return customer.customer_id
  } catch (error) {
    log('❌ Failed to upsert customer:', customer.email, error)
    return customer.customer_id
  }
}

async function ensureProductExists(productId: string): Promise<void> {
  const productRow: ProductRow = {
    product_id: productId,
    name: productId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  await upsertRow('products', productRow, 'product_id')
}

// --- Event Handlers ---
async function handleSubscription(
  payload: DodoWebhookPayload<DodoSubscriptionData>
): Promise<void> {
  const { data } = payload
  
  if (data.product_id) {
    await ensureProductExists(data.product_id)
  }
  
  const customerId = await upsertCustomer(data.customer)

  const subscriptionRow: SubscriptionRow = {
    subscription_id: data.subscription_id,
    customer_id: customerId,
    product_id: data.product_id ?? null,
    subscription_status: data.status,
    quantity: data.quantity ?? 1,
    currency: data.currency ?? null,
    start_date: data.start_date ?? new Date().toISOString(),
    next_billing_date: data.next_billing_date ?? null,
    trial_end_date: data.trial_period_days
      ? new Date(Date.now() + data.trial_period_days * 24 * 60 * 60 * 1000).toISOString()
      : null,
    metadata: data.metadata ?? {},
    created_at: data.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  await upsertRow('subscriptions', subscriptionRow, 'subscription_id')
}

async function handleTransaction(
  payload: DodoWebhookPayload<DodoPaymentSucceededData>
): Promise<void> {
  const { data } = payload
  const customerId = await upsertCustomer(data.customer)

  if (data.subscription_id) {
    const subscriptionUpdate: Partial<SubscriptionRow> = {
      subscription_id: data.subscription_id,
      customer_id: customerId,
      subscription_status: 'active',
      updated_at: new Date().toISOString()
    }
    
    await upsertRow(
      'subscriptions', 
      { ...subscriptionUpdate } as SubscriptionRow, 
      'subscription_id'
    )
  }

  const transactionRow: TransactionRow = {
    transaction_id: data.payment_id,
    subscription_id: data.subscription_id ?? null,
    customer_id: customerId,
    status: data.status ?? 'unknown',
    amount: data.total_amount,
    currency: data.currency ?? 'USD',
    payment_method: data.payment_method ?? null,
    card_last_four: data.card_last_four ?? null,
    card_network: data.card_network ?? null,
    card_type: data.card_type ?? null,
    billed_at: payload.timestamp,
    metadata: data.metadata ?? {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  await upsertRow('transactions', transactionRow, 'transaction_id')
}

async function handleRefund(
  payload: DodoWebhookPayload<DodoRefundData>
): Promise<void> {
  const { data } = payload
  const customerId = await upsertCustomer(data.customer)
  
  const refundRow: RefundRow = {
    refund_id: data.refund_id,
    transaction_id: data.payment_id,
    customer_id: customerId,
    amount: data.amount,
    currency: data.currency ?? null,
    is_partial: data.is_partial ?? false,
    reason: data.reason ?? null,
    status: data.status ?? null,
    created_at: data.created_at ?? new Date().toISOString()
  }

  await upsertRow('refunds', refundRow, 'refund_id')
}

async function handleDispute(
  payload: DodoWebhookPayload<DodoDisputeData>
): Promise<void> {
  const { data } = payload
  
  const disputeRow: DisputeRow = {
    dispute_id: data.dispute_id,
    transaction_id: data.payment_id,
    amount: data.amount ?? null,
    currency: data.currency ?? null,
    dispute_stage: data.dispute_stage ?? null,
    dispute_status: data.dispute_status ?? null,
    remarks: data.remarks ?? null,
    created_at: data.created_at ?? new Date().toISOString()
  }

  await upsertRow('disputes', disputeRow, 'dispute_id')
}

// --- Webhook Handler ---
export const POST = Webhooks({
 webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY!,
  
  onPayload: async (payload: unknown) => {
    const webhookPayload = payload as MyWebhookPayload
    
    log('🔔 Received webhook event:', webhookPayload.type)

    // Handle customer upsert for all events that have customer data
    if (
      webhookPayload.data && 
      'customer' in webhookPayload.data && 
      webhookPayload.data.customer
    ) {
      await upsertCustomer(webhookPayload.data.customer)
    }

    // Route to appropriate handler
    if (isPaymentSucceeded(webhookPayload)) {
      await handleTransaction(webhookPayload)
    } else if (
      isSubscriptionActive(webhookPayload) || 
      isSubscriptionCreated(webhookPayload) || 
      isSubscriptionCancelled(webhookPayload)
    ) {
      await handleSubscription(webhookPayload)
    } else if (isRefund(webhookPayload)) {
      await handleRefund(webhookPayload)
    } else if (isDispute(webhookPayload)) {
      await handleDispute(webhookPayload)
    } else {
      // log(`🔔 Unhandled webhook event type: ${webhookPayload.type}`)
    }
  }
})