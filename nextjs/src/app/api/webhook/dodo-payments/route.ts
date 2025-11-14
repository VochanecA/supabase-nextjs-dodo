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
  | (DodoWebhookPayload<DodoSubscriptionData> & { type: 'subscription.renewed' })
  | (DodoWebhookPayload<DodoRefundData> & { type: 'payment.refund' })
  | (DodoWebhookPayload<DodoDisputeData> & { type: 'payment.dispute' })

// --- Database Row Types ---
interface CustomerRow {
  customer_id: string
  email: string
  name: string | null
  auth_user_id?: string | null
  created_at: string
  updated_at: string
}

interface ProductRow {
  product_id: string
  name: string
  description?: string | null
  created_at: string
  updated_at: string
}

interface SubscriptionRow {
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

interface TransactionRow {
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

interface RefundRow {
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

interface DisputeRow {
  dispute_id: string
  transaction_id: string
  amount: number | null
  currency: string | null
  dispute_stage: string | null
  dispute_status: string | null
  remarks: string | null
  created_at: string
}

// Explicit types for query results
interface CustomerQueryResult {
  customer_id: string
  auth_user_id: string | null
}

interface ProductQueryResult {
  product_id: string
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

const isSubscriptionRenewed = (payload: MyWebhookPayload): payload is DodoWebhookPayload<DodoSubscriptionData> & { type: 'subscription.renewed' } =>
  payload.type === 'subscription.renewed'

const isRefund = (payload: MyWebhookPayload): payload is DodoWebhookPayload<DodoRefundData> & { type: 'payment.refund' } =>
  payload.type === 'payment.refund'

const isDispute = (payload: MyWebhookPayload): payload is DodoWebhookPayload<DodoDisputeData> & { type: 'payment.dispute' } =>
  payload.type === 'payment.dispute'

// --- Logging ---
const log = (...args: unknown[]): void => {
  console.log('🔔 Dodo Webhook:', ...args)
}

// --- Database Table Types ---
type DatabaseTable = 
  | 'customers' 
  | 'products' 
  | 'subscriptions' 
  | 'transactions' 
  | 'refunds' 
  | 'disputes'

type DatabaseRow = 
  | CustomerRow 
  | ProductRow 
  | SubscriptionRow 
  | TransactionRow 
  | RefundRow 
  | DisputeRow

// --- Supabase Helpers ---
async function upsertRow<T extends DatabaseRow>(
  table: DatabaseTable,
  row: T,
  conflictColumn: keyof T
): Promise<void> {
  try {
    const supabase = await createServerAdminClient()
    
    // Create a processed row with amount conversion
    const processedRow: Record<string, unknown> = { ...row }
    
    // Convert amount fields to cents for bigint storage
    if ('amount' in processedRow && typeof processedRow.amount === 'number') {
      processedRow.amount = Math.round(processedRow.amount * 100)
    }
    if ('total_amount' in processedRow && typeof processedRow.total_amount === 'number') {
      processedRow.total_amount = Math.round(processedRow.total_amount * 100)
    }
    
    // Use type assertion for Supabase upsert with proper typing
    const { error } = await supabase
      .from(table)
      .upsert([processedRow] as never[], { 
        onConflict: conflictColumn as string 
      })
  
    if (error) {
      log(`❌ Failed to upsert ${table}:`, error.message)
      throw error
    }
  
    const conflictValue = processedRow[conflictColumn as string]
    log(`✅ Upserted ${table}:`, String(conflictColumn), conflictValue)
  } catch (error) {
    log(`❌ Error upserting ${table}:`, error)
    throw error
  }
}

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  try {
    const supabase = await createServerAdminClient()
    
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
  try {
    const supabase = await createServerAdminClient()
    
    // Explicitly type the query result
    const { data: existingByEmail, error: emailError } = await supabase
      .from('customers')
      .select('customer_id, auth_user_id')
      .eq('email', customer.email)
      .single<CustomerQueryResult>()

    // Handle "no rows returned" error gracefully
    if (emailError && emailError.code !== 'PGRST116') {
      throw emailError
    }
    
    if (existingByEmail?.customer_id) {
      log(`🔄 Reusing existing customer_id ${existingByEmail.customer_id} for email ${customer.email}`)
      
      // Update auth_user_id if not set
      if (!existingByEmail.auth_user_id) {
        const authUserId = await findAuthUserIdByEmail(customer.email)
        if (authUserId) {
          const updateData = { 
            auth_user_id: authUserId, 
            updated_at: new Date().toISOString() 
          }
          
          // Use type assertion for update
          await supabase
            .from('customers')
            .update(updateData as never)
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
      auth_user_id: authUserId ?? null,
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
  try {
    const supabase = await createServerAdminClient()
    
    // Check if product already exists with explicit typing
    const { data: existingProduct } = await supabase
      .from('products')
      .select('product_id')
      .eq('product_id', productId)
      .single<ProductQueryResult>()

    if (!existingProduct) {
      const productRow: ProductRow = {
        product_id: productId,
        name: productId,
        description: `Product ${productId}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await upsertRow('products', productRow, 'product_id')
    }
  } catch (error) {
    log('❌ Error ensuring product exists:', productId, error)
  }
}

// --- Event Handlers ---
async function handleSubscription(
  payload: DodoWebhookPayload<DodoSubscriptionData>
): Promise<void> {
  const { data } = payload
  
  log(`📝 Handling subscription: ${data.subscription_id}, status: ${data.status}, type: ${payload.type}`)
  
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
  
  log(`💰 Handling payment: ${data.payment_id}, amount: ${data.total_amount}`)
  
  const customerId = await upsertCustomer(data.customer)

  if (data.subscription_id) {
    const subscriptionUpdate: SubscriptionRow = {
      subscription_id: data.subscription_id,
      customer_id: customerId,
      product_id: null,
      subscription_status: 'active',
      quantity: 1,
      currency: null,
      start_date: new Date().toISOString(),
      next_billing_date: null,
      trial_end_date: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    await upsertRow('subscriptions', subscriptionUpdate, 'subscription_id')
  }

  const transactionRow: TransactionRow = {
    transaction_id: data.payment_id,
    subscription_id: data.subscription_id ?? null,
    customer_id: customerId,
    status: data.status ?? 'succeeded',
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
  
  log(`💸 Handling refund: ${data.refund_id}, amount: ${data.amount}`)
  
  const customerId = await upsertCustomer(data.customer)
  
  const refundRow: RefundRow = {
    refund_id: data.refund_id,
    transaction_id: data.payment_id,
    customer_id: customerId,
    amount: data.amount,
    currency: data.currency ?? null,
    is_partial: data.is_partial ?? false,
    reason: data.reason ?? null,
    status: data.status ?? 'completed',
    created_at: data.created_at ?? new Date().toISOString()
  }

  await upsertRow('refunds', refundRow, 'refund_id')
}

async function handleDispute(
  payload: DodoWebhookPayload<DodoDisputeData>
): Promise<void> {
  const { data } = payload
  
  log(`⚖️ Handling dispute: ${data.dispute_id}`)
  
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
  webhookKey: process.env.DODO_WEBHOOK_SECRET!,
  
  onPayload: async (payload: unknown) => {
    try {
      const webhookPayload = payload as MyWebhookPayload
      
      log(`🔔 Received webhook event: ${webhookPayload.type}`)

      // Handle customer upsert for all events that have customer data
      if (webhookPayload.data && 'customer' in webhookPayload.data && webhookPayload.data.customer) {
        await upsertCustomer(webhookPayload.data.customer)
      }

      // Route to appropriate handler
      if (isPaymentSucceeded(webhookPayload)) {
        await handleTransaction(webhookPayload)
      } else if (
        isSubscriptionActive(webhookPayload) || 
        isSubscriptionCreated(webhookPayload) || 
        isSubscriptionCancelled(webhookPayload) ||
        isSubscriptionRenewed(webhookPayload)
      ) {
        await handleSubscription(webhookPayload)
      } else if (isRefund(webhookPayload)) {
        await handleRefund(webhookPayload)
      } else if (isDispute(webhookPayload)) {
        await handleDispute(webhookPayload)
      } else {
        const unhandledPayload = payload as { type: string }
        log(`⚠️ Unhandled webhook event type: ${unhandledPayload.type}`)
      }

      log(`✅ Successfully processed webhook: ${webhookPayload.type}`)
      
    } catch (error) {
      console.error('❌ Webhook processing error:', error)
      throw error
    }
  }
})