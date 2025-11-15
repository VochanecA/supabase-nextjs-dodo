// src/app/api/webhook/dodo-payments/route.ts
import { createServerAdminClient } from '@/lib/supabase/serverAdminClient'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// --- Type Definitions based on actual Dodo payload ---
interface DodoCustomer {
  customer_id: string
  email: string
  name?: string
  phone_number?: string | null
}

interface DodoBillingAddress {
  city: string
  country: string
  state: string
  street: string
  zipcode: string
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
  expires_at?: string
  previous_billing_date?: string
  recurring_pre_tax_amount?: number
  cancelled_at?: string | null
  cancel_at_next_billing_date?: boolean
  billing?: DodoBillingAddress
  addons?: unknown[]
  meters?: unknown[]
  on_demand?: boolean
  payload_type?: string
  payment_frequency_count?: number
  payment_frequency_interval?: string
  subscription_period_count?: number
  subscription_period_interval?: string
  tax_id?: string | null
  tax_inclusive?: boolean
  discount_cycles_remaining?: number | null
  discount_id?: string | null
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
  business_id?: string
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

// --- Runtime Type Guards ---
function isValidCustomer(obj: unknown): obj is DodoCustomer {
  if (typeof obj !== 'object' || obj === null) return false
  
  const customer = obj as Record<string, unknown>
  return (
    typeof customer.customer_id === 'string' && 
    typeof customer.email === 'string'
  )
}

function isValidPaymentSucceededData(obj: unknown): obj is DodoPaymentSucceededData {
  if (typeof obj !== 'object' || obj === null) return false
  
  const data = obj as Record<string, unknown>
  return (
    typeof data.payment_id === 'string' && 
    typeof data.total_amount === 'number' &&
    isValidCustomer(data.customer)
  )
}

function isValidSubscriptionData(obj: unknown): obj is DodoSubscriptionData {
  if (typeof obj !== 'object' || obj === null) return false
  
  const data = obj as Record<string, unknown>
  return (
    typeof data.subscription_id === 'string' && 
    typeof data.status === 'string' &&
    isValidCustomer(data.customer)
  )
}

function isValidRefundData(obj: unknown): obj is DodoRefundData {
  if (typeof obj !== 'object' || obj === null) return false
  
  const data = obj as Record<string, unknown>
  return (
    typeof data.refund_id === 'string' && 
    typeof data.payment_id === 'string' &&
    typeof data.amount === 'number' &&
    isValidCustomer(data.customer)
  )
}

function isValidDisputeData(obj: unknown): obj is DodoDisputeData {
  if (typeof obj !== 'object' || obj === null) return false
  
  const data = obj as Record<string, unknown>
  return (
    typeof data.dispute_id === 'string' && 
    typeof data.payment_id === 'string'
  )
}

function isValidWebhookPayload(obj: unknown): obj is MyWebhookPayload {
  if (typeof obj !== 'object' || obj === null) return false
  
  const payload = obj as Record<string, unknown>
  const { type, data } = payload
  
  if (typeof type !== 'string' || !data) return false
  
  switch (type) {
    case 'payment.succeeded':
      return isValidPaymentSucceededData(data)
    case 'subscription.active':
    case 'subscription.created':
    case 'subscription.cancelled':
    case 'subscription.renewed':
      return isValidSubscriptionData(data)
    case 'payment.refund':
      return isValidRefundData(data)
    case 'payment.dispute':
      return isValidDisputeData(data)
    default:
      return false
  }
}

// --- Type Guards for discriminated union ---
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

// --- Standard Webhooks Signature Verification ---
function verifyWebhookSignature(
  payload: string, 
  signatureHeader: string,
  webhookId: string,
  timestampHeader: string
): boolean {
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET
  if (!webhookSecret) {
    log('❌ DODO_WEBHOOK_SECRET not configured')
    return false
  }

  // Remove 'whsec_' prefix if present and decode from base64
  let secret: Buffer
  try {
    const secretString = webhookSecret.startsWith('whsec_') 
      ? webhookSecret.slice(6) 
      : webhookSecret
    
    secret = Buffer.from(secretString, 'base64')
    
    log('🔐 Secret details:', {
      original: webhookSecret,
      cleaned: secretString,
      secretLength: secret.length,
      secretBytes: Array.from(secret).slice(0, 10) // First 10 bytes for debugging
    })
  } catch (error) {
    log('❌ Error decoding secret from base64:', error)
    return false
  }

  // Build the signed message according to Standard Webhooks spec
  const signedContent = `${webhookId}.${timestampHeader}.${payload}`
  
  log('🔐 Signed content:', {
    webhookId,
    timestamp: timestampHeader,
    payloadLength: payload.length,
    signedContentLength: signedContent.length
  })

  // Compute HMAC SHA256 with base64 output using the decoded binary secret
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedContent, 'utf8')
    .digest('base64')

  log('🔐 Signature verification details:', {
    signatureHeader,
    expectedSignature,
    signedContentPreview: signedContent.substring(0, 100) + '...'
  })

  // Parse the signature header (can contain multiple signatures separated by spaces)
  const signatures = signatureHeader.split(' ')
  
  for (const sig of signatures) {
    // Signature format: "v1,base64signature"
    const [version, signature] = sig.split(',')
    
    if (version === 'v1' && signature) {
      // Compare signatures
      if (signature === expectedSignature) {
        log('✅ Signature verified successfully')
        return true
      } else {
        log(`❌ Signature mismatch for version ${version}`)
        log(`Received: ${signature}`)
        log(`Expected: ${expectedSignature}`)
        
        // Debug: check if it's a padding issue
        const receivedNoPadding = signature.replace(/=+$/, '')
        const expectedNoPadding = expectedSignature.replace(/=+$/, '')
        if (receivedNoPadding === expectedNoPadding) {
          log('⚠️ Signatures match without padding - padding issue detected')
          return true
        }
      }
    } else {
      log(`⚠️ Invalid signature format: ${sig}`)
    }
  }

  log('❌ No valid signature found')
  return false
}

// --- Timestamp Validation ---
function isTimestampValid(timestamp: string, toleranceMs: number = 5 * 60 * 1000): boolean {
  try {
    const now = Date.now()
    const timestampMs = parseInt(timestamp) * 1000 // Convert to milliseconds
    
    // Check if timestamp is within tolerance
    const diff = Math.abs(now - timestampMs)
    const isValid = diff <= toleranceMs
    
    log(`⏰ Timestamp validation: ${diff}ms diff, tolerance: ${toleranceMs}ms, valid: ${isValid}`)
    
    return isValid
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    log('❌ Invalid timestamp format')
    return false
  }
}

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
    if ('recurring_pre_tax_amount' in processedRow && typeof processedRow.recurring_pre_tax_amount === 'number') {
      processedRow.recurring_pre_tax_amount = Math.round(processedRow.recurring_pre_tax_amount * 100)
    }
    
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
    
    const { data: existingByEmail, error: emailError } = await supabase
      .from('customers')
      .select('customer_id, auth_user_id')
      .eq('email', customer.email)
      .single<CustomerQueryResult>()

    if (emailError && emailError.code !== 'PGRST116') {
      throw emailError
    }
    
    if (existingByEmail?.customer_id) {
      log(`🔄 Reusing existing customer_id ${existingByEmail.customer_id} for email ${customer.email}`)
      
      if (!existingByEmail.auth_user_id) {
        const authUserId = await findAuthUserIdByEmail(customer.email)
        if (authUserId) {
          const updateData = { 
            auth_user_id: authUserId, 
            updated_at: new Date().toISOString() 
          }
          
          await supabase
            .from('customers')
            .update(updateData as never)
            .eq('customer_id', existingByEmail.customer_id)
        }
      }
      
      return existingByEmail.customer_id
    }

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

  const enhancedMetadata: Record<string, unknown> = {
    ...data.metadata,
  }

  if (data.billing) {
    enhancedMetadata.billing_address = data.billing
  }
  if (data.cancelled_at) {
    enhancedMetadata.cancelled_at = data.cancelled_at
  }
  if (data.cancel_at_next_billing_date !== undefined) {
    enhancedMetadata.cancel_at_next_billing_date = data.cancel_at_next_billing_date
  }

  const subscriptionRow: SubscriptionRow = {
    subscription_id: data.subscription_id,
    customer_id: customerId,
    product_id: data.product_id ?? null,
    subscription_status: data.status,
    quantity: data.quantity ?? 1,
    currency: data.currency ?? null,
    start_date: data.created_at ?? new Date().toISOString(),
    next_billing_date: data.next_billing_date ?? null,
    trial_end_date: data.trial_period_days
      ? new Date(Date.now() + data.trial_period_days * 24 * 60 * 60 * 1000).toISOString()
      : null,
    metadata: enhancedMetadata,
    created_at: data.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  await upsertRow('subscriptions', subscriptionRow, 'subscription_id')
  log(`✅ Processed subscription ${data.subscription_id} with status: ${data.status}`)
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
  log(`✅ Processed payment ${data.payment_id} for subscription: ${data.subscription_id}`)
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
  log(`✅ Processed refund ${data.refund_id} for payment: ${data.payment_id}`)
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
  log(`✅ Processed dispute ${data.dispute_id} for payment: ${data.payment_id}`)
}

// --- Main Webhook Handler ---
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get Standard Webhooks headers
    const signatureHeader = request.headers.get('webhook-signature')
    const webhookId = request.headers.get('webhook-id')
    const timestampHeader = request.headers.get('webhook-timestamp')
    const payload = await request.text()

    log('🔔 Headers received:', {
      signature: signatureHeader ? `present (${signatureHeader.substring(0, 50)}...)` : 'missing',
      webhookId: webhookId ? `present (${webhookId})` : 'missing', 
      timestamp: timestampHeader ? `present (${timestampHeader})` : 'missing',
      payloadLength: payload.length
    })

    // Validate required headers
    if (!signatureHeader || !webhookId || !timestampHeader) {
      log('❌ Missing required webhook headers')
      return NextResponse.json({ error: 'Missing required headers' }, { status: 401 })
    }

    // Validate timestamp (prevent replay attacks)
    if (!isTimestampValid(timestampHeader)) {
      log('❌ Invalid timestamp')
      return NextResponse.json({ error: 'Invalid timestamp' }, { status: 401 })
    }

    // Verify webhook signature according to Standard Webhooks spec
    const isValid = verifyWebhookSignature(payload, signatureHeader, webhookId, timestampHeader)
    
    if (!isValid) {
      log('❌ Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    let parsedPayload: unknown
    try {
      parsedPayload = JSON.parse(payload)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (parseError) {
      log('❌ Invalid JSON payload')
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Runtime validation
    if (!isValidWebhookPayload(parsedPayload)) {
      log('❌ Invalid webhook payload structure')
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 })
    }

    const webhookPayload = parsedPayload
    
    log(`🔔 Received webhook event: ${webhookPayload.type}`)

    // Handle customer upsert for all events that have customer data
    if ('customer' in webhookPayload.data && webhookPayload.data.customer) {
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
   //   log(`⚠️ Unhandled webhook event type: ${webhookPayload.type}`)
    }

    log(`✅ Successfully processed webhook: ${webhookPayload.type}`)
    
    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}



//novo netestirano

// src/app/api/webhook/dodo-payments/route.ts
// import { createServerAdminClient } from '@/lib/supabase/serverAdminClient'
// import { NextRequest, NextResponse } from 'next/server'
// import { Webhook } from 'standardwebhooks'

// // --- Type Definitions based on actual Dodo payload ---
// interface DodoCustomer {
//   customer_id: string
//   email: string
//   name?: string
//   phone_number?: string | null
// }

// interface DodoBillingAddress {
//   city: string
//   country: string
//   state: string
//   street: string
//   zipcode: string
// }

// interface DodoSubscriptionData {
//   subscription_id: string
//   status: string
//   customer: DodoCustomer
//   product_id?: string
//   quantity?: number
//   currency?: string
//   start_date?: string
//   next_billing_date?: string
//   trial_period_days?: number
//   metadata?: Record<string, unknown>
//   created_at?: string
//   expires_at?: string
//   previous_billing_date?: string
//   recurring_pre_tax_amount?: number
//   cancelled_at?: string | null
//   cancel_at_next_billing_date?: boolean
//   billing?: DodoBillingAddress
//   addons?: unknown[]
//   meters?: unknown[]
//   on_demand?: boolean
//   payload_type?: string
//   payment_frequency_count?: number
//   payment_frequency_interval?: string
//   subscription_period_count?: number
//   subscription_period_interval?: string
//   tax_id?: string | null
//   tax_inclusive?: boolean
//   discount_cycles_remaining?: number | null
//   discount_id?: string | null
// }

// interface DodoPaymentSucceededData {
//   payment_id: string
//   status: string
//   total_amount: number
//   currency: string
//   customer: DodoCustomer
//   subscription_id?: string
//   payment_method?: string
//   card_last_four?: string
//   card_network?: string
//   card_type?: string
//   metadata?: Record<string, unknown>
// }

// interface DodoRefundData {
//   refund_id: string
//   payment_id: string
//   customer: DodoCustomer
//   amount: number
//   currency?: string
//   is_partial?: boolean
//   reason?: string
//   status?: string
//   created_at?: string
// }

// interface DodoDisputeData {
//   dispute_id: string
//   payment_id: string
//   amount?: number
//   currency?: string
//   dispute_stage?: string
//   dispute_status?: string
//   remarks?: string
//   created_at?: string
// }

// interface DodoWebhookPayload<T = unknown> {
//   type: string
//   data: T
//   timestamp: string
//   business_id?: string
// }

// type MyWebhookPayload = 
//   | (DodoWebhookPayload<DodoPaymentSucceededData> & { type: 'payment.succeeded' })
//   | (DodoWebhookPayload<DodoSubscriptionData> & { type: 'subscription.active' })
//   | (DodoWebhookPayload<DodoSubscriptionData> & { type: 'subscription.created' })
//   | (DodoWebhookPayload<DodoSubscriptionData> & { type: 'subscription.cancelled' })
//   | (DodoWebhookPayload<DodoSubscriptionData> & { type: 'subscription.renewed' })
//   | (DodoWebhookPayload<DodoRefundData> & { type: 'payment.refund' })
//   | (DodoWebhookPayload<DodoDisputeData> & { type: 'payment.dispute' })

// // --- Database Row Types ---
// interface CustomerRow {
//   customer_id: string
//   email: string
//   name: string | null
//   auth_user_id?: string | null
//   created_at: string
//   updated_at: string
// }

// interface ProductRow {
//   product_id: string
//   name: string
//   description?: string | null
//   created_at: string
//   updated_at: string
// }

// interface SubscriptionRow {
//   subscription_id: string
//   customer_id: string
//   product_id: string | null
//   subscription_status: string
//   quantity: number
//   currency: string | null
//   start_date: string
//   next_billing_date: string | null
//   trial_end_date: string | null
//   metadata: Record<string, unknown>
//   created_at: string
//   updated_at: string
// }

// interface TransactionRow {
//   transaction_id: string
//   subscription_id: string | null
//   customer_id: string
//   status: string
//   amount: number
//   currency: string
//   payment_method: string | null
//   card_last_four: string | null
//   card_network: string | null
//   card_type: string | null
//   billed_at: string
//   metadata: Record<string, unknown>
//   created_at: string
//   updated_at: string
// }

// interface RefundRow {
//   refund_id: string
//   transaction_id: string
//   customer_id: string
//   amount: number
//   currency: string | null
//   is_partial: boolean
//   reason: string | null
//   status: string | null
//   created_at: string
// }

// interface DisputeRow {
//   dispute_id: string
//   transaction_id: string
//   amount: number | null
//   currency: string | null
//   dispute_stage: string | null
//   dispute_status: string | null
//   remarks: string | null
//   created_at: string
// }

// // Explicit types for query results
// interface CustomerQueryResult {
//   customer_id: string
//   auth_user_id: string | null
// }

// interface ProductQueryResult {
//   product_id: string
// }

// // --- Runtime Type Guards ---
// function isValidCustomer(obj: unknown): obj is DodoCustomer {
//   if (typeof obj !== 'object' || obj === null) return false
  
//   const customer = obj as Record<string, unknown>
//   return (
//     typeof customer.customer_id === 'string' && 
//     typeof customer.email === 'string'
//   )
// }

// function isValidPaymentSucceededData(obj: unknown): obj is DodoPaymentSucceededData {
//   if (typeof obj !== 'object' || obj === null) return false
  
//   const data = obj as Record<string, unknown>
//   return (
//     typeof data.payment_id === 'string' && 
//     typeof data.total_amount === 'number' &&
//     isValidCustomer(data.customer)
//   )
// }

// function isValidSubscriptionData(obj: unknown): obj is DodoSubscriptionData {
//   if (typeof obj !== 'object' || obj === null) return false
  
//   const data = obj as Record<string, unknown>
//   return (
//     typeof data.subscription_id === 'string' && 
//     typeof data.status === 'string' &&
//     isValidCustomer(data.customer)
//   )
// }

// function isValidRefundData(obj: unknown): obj is DodoRefundData {
//   if (typeof obj !== 'object' || obj === null) return false
  
//   const data = obj as Record<string, unknown>
//   return (
//     typeof data.refund_id === 'string' && 
//     typeof data.payment_id === 'string' &&
//     typeof data.amount === 'number' &&
//     isValidCustomer(data.customer)
//   )
// }

// function isValidDisputeData(obj: unknown): obj is DodoDisputeData {
//   if (typeof obj !== 'object' || obj === null) return false
  
//   const data = obj as Record<string, unknown>
//   return (
//     typeof data.dispute_id === 'string' && 
//     typeof data.payment_id === 'string'
//   )
// }

// function isValidWebhookPayload(obj: unknown): obj is MyWebhookPayload {
//   if (typeof obj !== 'object' || obj === null) return false
  
//   const payload = obj as Record<string, unknown>
//   const { type, data } = payload
  
//   if (typeof type !== 'string' || !data) return false
  
//   switch (type) {
//     case 'payment.succeeded':
//       return isValidPaymentSucceededData(data)
//     case 'subscription.active':
//     case 'subscription.created':
//     case 'subscription.cancelled':
//     case 'subscription.renewed':
//       return isValidSubscriptionData(data)
//     case 'payment.refund':
//       return isValidRefundData(data)
//     case 'payment.dispute':
//       return isValidDisputeData(data)
//     default:
//       return false
//   }
// }

// // --- Type Guards for discriminated union ---
// const isPaymentSucceeded = (payload: MyWebhookPayload): payload is DodoWebhookPayload<DodoPaymentSucceededData> & { type: 'payment.succeeded' } =>
//   payload.type === 'payment.succeeded'

// const isSubscriptionActive = (payload: MyWebhookPayload): payload is DodoWebhookPayload<DodoSubscriptionData> & { type: 'subscription.active' } =>
//   payload.type === 'subscription.active'

// const isSubscriptionCreated = (payload: MyWebhookPayload): payload is DodoWebhookPayload<DodoSubscriptionData> & { type: 'subscription.created' } =>
//   payload.type === 'subscription.created'

// const isSubscriptionCancelled = (payload: MyWebhookPayload): payload is DodoWebhookPayload<DodoSubscriptionData> & { type: 'subscription.cancelled' } =>
//   payload.type === 'subscription.cancelled'

// const isSubscriptionRenewed = (payload: MyWebhookPayload): payload is DodoWebhookPayload<DodoSubscriptionData> & { type: 'subscription.renewed' } =>
//   payload.type === 'subscription.renewed'

// const isRefund = (payload: MyWebhookPayload): payload is DodoWebhookPayload<DodoRefundData> & { type: 'payment.refund' } =>
//   payload.type === 'payment.refund'

// const isDispute = (payload: MyWebhookPayload): payload is DodoWebhookPayload<DodoDisputeData> & { type: 'payment.dispute' } =>
//   payload.type === 'payment.dispute'

// // --- Logging ---
// const log = (...args: unknown[]): void => {
//   console.log('🔔 Dodo Webhook:', ...args)
// }

// // --- Database Table Types ---
// type DatabaseTable = 
//   | 'customers' 
//   | 'products' 
//   | 'subscriptions' 
//   | 'transactions' 
//   | 'refunds' 
//   | 'disputes'

// type DatabaseRow = 
//   | CustomerRow 
//   | ProductRow 
//   | SubscriptionRow 
//   | TransactionRow 
//   | RefundRow 
//   | DisputeRow

// // --- Supabase Helpers ---
// async function upsertRow<T extends DatabaseRow>(
//   table: DatabaseTable,
//   row: T,
//   conflictColumn: keyof T
// ): Promise<void> {
//   try {
//     const supabase = await createServerAdminClient()
    
//     // Create a processed row with amount conversion
//     const processedRow: Record<string, unknown> = { ...row }
    
//     // Convert amount fields to cents for bigint storage
//     if ('amount' in processedRow && typeof processedRow.amount === 'number') {
//       processedRow.amount = Math.round(processedRow.amount * 100)
//     }
//     if ('total_amount' in processedRow && typeof processedRow.total_amount === 'number') {
//       processedRow.total_amount = Math.round(processedRow.total_amount * 100)
//     }
//     if ('recurring_pre_tax_amount' in processedRow && typeof processedRow.recurring_pre_tax_amount === 'number') {
//       processedRow.recurring_pre_tax_amount = Math.round(processedRow.recurring_pre_tax_amount * 100)
//     }
    
//     const { error } = await supabase
//       .from(table)
//       .upsert([processedRow] as never[], { 
//         onConflict: conflictColumn as string 
//       })
  
//     if (error) {
//       log(`❌ Failed to upsert ${table}:`, error.message)
//       throw error
//     }
  
//     const conflictValue = processedRow[conflictColumn as string]
//     log(`✅ Upserted ${table}:`, String(conflictColumn), conflictValue)
//   } catch (error) {
//     log(`❌ Error upserting ${table}:`, error)
//     throw error
//   }
// }

// async function findAuthUserIdByEmail(email: string): Promise<string | null> {
//   try {
//     const supabase = await createServerAdminClient()
    
//     const { data, error } = await supabase.auth.admin.listUsers()
    
//     if (error) {
//       log('❌ Error fetching users:', error.message)
//       return null
//     }
    
//     const user = data.users.find(u => u.email === email)
//     return user?.id || null
//   } catch (error) {
//     log('❌ Error finding auth user:', error)
//     return null
//   }
// }

// async function upsertCustomer(customer: DodoCustomer): Promise<string> {
//   try {
//     const supabase = await createServerAdminClient()
    
//     const { data: existingByEmail, error: emailError } = await supabase
//       .from('customers')
//       .select('customer_id, auth_user_id')
//       .eq('email', customer.email)
//       .single<CustomerQueryResult>()

//     if (emailError && emailError.code !== 'PGRST116') {
//       throw emailError
//     }
    
//     if (existingByEmail?.customer_id) {
//       log(`🔄 Reusing existing customer_id ${existingByEmail.customer_id} for email ${customer.email}`)
      
//       if (!existingByEmail.auth_user_id) {
//         const authUserId = await findAuthUserIdByEmail(customer.email)
//         if (authUserId) {
//           const updateData = { 
//             auth_user_id: authUserId, 
//             updated_at: new Date().toISOString() 
//           }
          
//           await supabase
//             .from('customers')
//             .update(updateData as never)
//             .eq('customer_id', existingByEmail.customer_id)
//         }
//       }
      
//       return existingByEmail.customer_id
//     }

//     const authUserId = await findAuthUserIdByEmail(customer.email)

//     const customerRow: CustomerRow = {
//       customer_id: customer.customer_id,
//       email: customer.email,
//       name: customer.name ?? null,
//       auth_user_id: authUserId ?? null,
//       created_at: new Date().toISOString(),
//       updated_at: new Date().toISOString()
//     }

//     await upsertRow('customers', customerRow, 'customer_id')
//     return customer.customer_id
//   } catch (error) {
//     log('❌ Failed to upsert customer:', customer.email, error)
//     return customer.customer_id
//   }
// }

// async function ensureProductExists(productId: string): Promise<void> {
//   try {
//     const supabase = await createServerAdminClient()
    
//     const { data: existingProduct } = await supabase
//       .from('products')
//       .select('product_id')
//       .eq('product_id', productId)
//       .single<ProductQueryResult>()

//     if (!existingProduct) {
//       const productRow: ProductRow = {
//         product_id: productId,
//         name: productId,
//         description: `Product ${productId}`,
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString()
//       }

//       await upsertRow('products', productRow, 'product_id')
//     }
//   } catch (error) {
//     log('❌ Error ensuring product exists:', productId, error)
//   }
// }

// // --- Event Handlers ---
// async function handleSubscription(
//   payload: DodoWebhookPayload<DodoSubscriptionData>
// ): Promise<void> {
//   const { data } = payload
  
//   log(`📝 Handling subscription: ${data.subscription_id}, status: ${data.status}, type: ${payload.type}`)
  
//   if (data.product_id) {
//     await ensureProductExists(data.product_id)
//   }
  
//   const customerId = await upsertCustomer(data.customer)

//   const enhancedMetadata: Record<string, unknown> = {
//     ...data.metadata,
//   }

//   if (data.billing) {
//     enhancedMetadata.billing_address = data.billing
//   }
//   if (data.cancelled_at) {
//     enhancedMetadata.cancelled_at = data.cancelled_at
//   }
//   if (data.cancel_at_next_billing_date !== undefined) {
//     enhancedMetadata.cancel_at_next_billing_date = data.cancel_at_next_billing_date
//   }

//   const subscriptionRow: SubscriptionRow = {
//     subscription_id: data.subscription_id,
//     customer_id: customerId,
//     product_id: data.product_id ?? null,
//     subscription_status: data.status,
//     quantity: data.quantity ?? 1,
//     currency: data.currency ?? null,
//     start_date: data.created_at ?? new Date().toISOString(),
//     next_billing_date: data.next_billing_date ?? null,
//     trial_end_date: data.trial_period_days
//       ? new Date(Date.now() + data.trial_period_days * 24 * 60 * 60 * 1000).toISOString()
//       : null,
//     metadata: enhancedMetadata,
//     created_at: data.created_at ?? new Date().toISOString(),
//     updated_at: new Date().toISOString()
//   }

//   await upsertRow('subscriptions', subscriptionRow, 'subscription_id')
//   log(`✅ Processed subscription ${data.subscription_id} with status: ${data.status}`)
// }

// async function handleTransaction(
//   payload: DodoWebhookPayload<DodoPaymentSucceededData>
// ): Promise<void> {
//   const { data } = payload
  
//   log(`💰 Handling payment: ${data.payment_id}, amount: ${data.total_amount}`)
  
//   const customerId = await upsertCustomer(data.customer)

//   if (data.subscription_id) {
//     const subscriptionUpdate: SubscriptionRow = {
//       subscription_id: data.subscription_id,
//       customer_id: customerId,
//       product_id: null,
//       subscription_status: 'active',
//       quantity: 1,
//       currency: null,
//       start_date: new Date().toISOString(),
//       next_billing_date: null,
//       trial_end_date: null,
//       metadata: {},
//       created_at: new Date().toISOString(),
//       updated_at: new Date().toISOString()
//     }
    
//     await upsertRow('subscriptions', subscriptionUpdate, 'subscription_id')
//   }

//   const transactionRow: TransactionRow = {
//     transaction_id: data.payment_id,
//     subscription_id: data.subscription_id ?? null,
//     customer_id: customerId,
//     status: data.status ?? 'succeeded',
//     amount: data.total_amount,
//     currency: data.currency ?? 'USD',
//     payment_method: data.payment_method ?? null,
//     card_last_four: data.card_last_four ?? null,
//     card_network: data.card_network ?? null,
//     card_type: data.card_type ?? null,
//     billed_at: payload.timestamp,
//     metadata: data.metadata ?? {},
//     created_at: new Date().toISOString(),
//     updated_at: new Date().toISOString()
//   }

//   await upsertRow('transactions', transactionRow, 'transaction_id')
//   log(`✅ Processed payment ${data.payment_id} for subscription: ${data.subscription_id}`)
// }

// async function handleRefund(
//   payload: DodoWebhookPayload<DodoRefundData>
// ): Promise<void> {
//   const { data } = payload
  
//   log(`💸 Handling refund: ${data.refund_id}, amount: ${data.amount}`)
  
//   const customerId = await upsertCustomer(data.customer)
  
//   const refundRow: RefundRow = {
//     refund_id: data.refund_id,
//     transaction_id: data.payment_id,
//     customer_id: customerId,
//     amount: data.amount,
//     currency: data.currency ?? null,
//     is_partial: data.is_partial ?? false,
//     reason: data.reason ?? null,
//     status: data.status ?? 'completed',
//     created_at: data.created_at ?? new Date().toISOString()
//   }

//   await upsertRow('refunds', refundRow, 'refund_id')
//   log(`✅ Processed refund ${data.refund_id} for payment: ${data.payment_id}`)
// }

// async function handleDispute(
//   payload: DodoWebhookPayload<DodoDisputeData>
// ): Promise<void> {
//   const { data } = payload
  
//   log(`⚖️ Handling dispute: ${data.dispute_id}`)
  
//   const disputeRow: DisputeRow = {
//     dispute_id: data.dispute_id,
//     transaction_id: data.payment_id,
//     amount: data.amount ?? null,
//     currency: data.currency ?? null,
//     dispute_stage: data.dispute_stage ?? null,
//     dispute_status: data.dispute_status ?? null,
//     remarks: data.remarks ?? null,
//     created_at: data.created_at ?? new Date().toISOString()
//   }

//   await upsertRow('disputes', disputeRow, 'dispute_id')
//   log(`✅ Processed dispute ${data.dispute_id} for payment: ${data.payment_id}`)
// }

// // --- Main Webhook Handler ---
// export async function POST(request: NextRequest): Promise<NextResponse> {
//   try {
//     const webhookSecret = process.env.DODO_WEBHOOK_SECRET
//     if (!webhookSecret) {
//       log('❌ DODO_WEBHOOK_SECRET not configured')
//       return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
//     }

//     // Initialize webhook with secret
//     const webhook = new Webhook(webhookSecret)

//     // Get Standard Webhooks headers
//     const signatureHeader = request.headers.get('webhook-signature')
//     const webhookId = request.headers.get('webhook-id')
//     const timestampHeader = request.headers.get('webhook-timestamp')
//     const payload = await request.text()

//     log('🔔 Headers received:', {
//       signature: signatureHeader ? `present (${signatureHeader.substring(0, 50)}...)` : 'missing',
//       webhookId: webhookId ? `present (${webhookId})` : 'missing', 
//       timestamp: timestampHeader ? `present (${timestampHeader})` : 'missing',
//       payloadLength: payload.length
//     })

//     // Prepare headers for verification
//     const headers: Record<string, string> = {
//       'webhook-id': webhookId || '',
//       'webhook-timestamp': timestampHeader || '',
//       'webhook-signature': signatureHeader || '',
//     }

//     // Verify webhook signature using standardwebhooks library
//     try {
//       webhook.verify(payload, headers)
//       log('✅ Webhook signature verified successfully')
//     } catch (error) {
//       log('❌ Invalid webhook signature:', error)
//       return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
//     }

//     let parsedPayload: unknown
//     try {
//       parsedPayload = JSON.parse(payload)
//     } catch (parseError) {
//       log('❌ Invalid JSON payload')
//       return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
//     }

//     // Runtime validation
//     if (!isValidWebhookPayload(parsedPayload)) {
//       log('❌ Invalid webhook payload structure')
//       return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 })
//     }

//     const webhookPayload = parsedPayload
    
//     log(`🔔 Received webhook event: ${webhookPayload.type}`)

//     // Handle customer upsert for all events that have customer data
//     if ('customer' in webhookPayload.data && webhookPayload.data.customer) {
//       await upsertCustomer(webhookPayload.data.customer)
//     }

//     // Route to appropriate handler
//     if (isPaymentSucceeded(webhookPayload)) {
//       await handleTransaction(webhookPayload)
//     } else if (
//       isSubscriptionActive(webhookPayload) || 
//       isSubscriptionCreated(webhookPayload) || 
//       isSubscriptionCancelled(webhookPayload) ||
//       isSubscriptionRenewed(webhookPayload)
//     ) {
//       await handleSubscription(webhookPayload)
//     } else if (isRefund(webhookPayload)) {
//       await handleRefund(webhookPayload)
//     } else if (isDispute(webhookPayload)) {
//       await handleDispute(webhookPayload)
//     } else {
//       log(`⚠️ Unhandled webhook event type: ${webhookPayload.type}`)
//     }

//     log(`✅ Successfully processed webhook: ${webhookPayload.type}`)
    
//     return NextResponse.json({ received: true })

//   } catch (error) {
//     console.error('❌ Webhook processing error:', error)
//     return NextResponse.json(
//       { error: 'Internal server error' }, 
//       { status: 500 }
//     )
//   }
// }