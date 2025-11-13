// nextjs/src/lib/supabase/unified.ts
import {SupabaseClient} from "@supabase/supabase-js";
import {Database} from "@/lib/types";

export enum ClientType {
    SERVER = 'server',
    SPA = 'spa'
}

export class SassClient {
    private client: SupabaseClient<Database, "public", "public">;
    private clientType: ClientType;

    constructor(client: SupabaseClient<Database, "public", "public">, clientType: ClientType) {
        this.client = client;
        this.clientType = clientType;
    }

    // Auth methods
    async loginEmail(email: string, password: string) {
        return this.client.auth.signInWithPassword({
            email: email,
            password: password
        });
    }

    async registerEmail(email: string, password: string) {
        return this.client.auth.signUp({
            email: email,
            password: password
        });
    }

    async exchangeCodeForSession(code: string) {
        return this.client.auth.exchangeCodeForSession(code);
    }

    async resendVerificationEmail(email: string) {
        return this.client.auth.resend({
            email: email,
            type: 'signup'
        })
    }

    async logout() {
        const { error } = await this.client.auth.signOut({
            scope: 'local',
        });
        if (error) throw error;
        if(this.clientType === ClientType.SPA) {
            window.location.href = '/auth/login';
        }
    }

    // Storage methods
    async uploadFile(myId: string, filename: string, file: File) {
        filename = filename.replace(/[^0-9a-zA-Z!\-_.*'()]/g, '_');
        filename = myId + "/" + filename
        return this.client.storage.from('files').upload(filename, file);
    }

    async getFiles(myId: string) {
        return this.client.storage.from('files').list(myId)
    }

    async deleteFile(myId: string, filename: string) {
        filename = myId + "/" + filename
        return this.client.storage.from('files').remove([filename])
    }

    async shareFile(myId: string, filename: string, timeInSec: number, forDownload: boolean = false) {
        filename = myId + "/" + filename
        return this.client.storage.from('files').createSignedUrl(filename, timeInSec, {
            download: forDownload
        });
    }

    // Customer methods
    async getCustomerByEmail(email: string) {
        return this.client
            .from('customers')
            .select('*')
            .eq('email', email)
            .single();
    }

    async getCustomerById(customerId: string) {
        return this.client
            .from('customers')
            .select('*')
            .eq('customer_id', customerId)
            .single();
    }

    async createCustomer(customerData: Database["public"]["Tables"]["customers"]["Insert"]) {
        return this.client
            .from('customers')
            .insert(customerData);
    }

    async updateCustomer(customerId: string, updates: Database["public"]["Tables"]["customers"]["Update"]) {
        return this.client
            .from('customers')
            .update(updates)
            .eq('customer_id', customerId);
    }

    // Subscription methods
    async getCustomerSubscriptions(customerId: string) {
        return this.client
            .from('subscriptions')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });
    }

    async getActiveSubscription(customerId: string) {
        return this.client
            .from('subscriptions')
            .select('*')
            .eq('customer_id', customerId)
            .in('subscription_status', ['active', 'trialing', 'past_due'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
    }

    async updateSubscriptionStatus(subscriptionId: string, status: string) {
        return this.client
            .from('subscriptions')
            .update({ 
                subscription_status: status,
                updated_at: new Date().toISOString()
            })
            .eq('subscription_id', subscriptionId);
    }

    // Transaction methods
    async getCustomerTransactions(customerId: string, limit: number = 10) {
        return this.client
            .from('transactions')
            .select('*')
            .eq('customer_id', customerId)
            .order('billed_at', { ascending: false })
            .limit(limit);
    }

    async getTransactionById(transactionId: string) {
        return this.client
            .from('transactions')
            .select('*')
            .eq('transaction_id', transactionId)
            .single();
    }

    async createTransaction(transactionData: Database["public"]["Tables"]["transactions"]["Insert"]) {
        return this.client
            .from('transactions')
            .insert(transactionData);
    }

    // Product methods
    async getAllProducts() {
        return this.client
            .from('products')
            .select('*')
            .order('name');
    }

    async getProductById(productId: string) {
        return this.client
            .from('products')
            .select('*')
            .eq('product_id', productId)
            .single();
    }

    // Refund methods
    async getTransactionRefunds(transactionId: string) {
        return this.client
            .from('refunds')
            .select('*')
            .eq('transaction_id', transactionId)
            .order('created_at', { ascending: false });
    }

    // Dispute methods
    async getTransactionDisputes(transactionId: string) {
        return this.client
            .from('disputes')
            .select('*')
            .eq('transaction_id', transactionId)
            .order('created_at', { ascending: false });
    }

    // Combined methods for dashboard
    async getCustomerDashboardData(customerId: string) {
        const [
            customerData,
            subscriptionData,
            transactionsData
        ] = await Promise.all([
            this.getCustomerById(customerId),
            this.getActiveSubscription(customerId),
            this.getCustomerTransactions(customerId, 5)
        ]);

        return {
            customer: customerData.data,
            subscription: subscriptionData.data,
            transactions: transactionsData.data
        };
    }

    // Check if user has active subscription
    async hasActiveSubscription(email: string): Promise<boolean> {
        try {
            const { data: customer } = await this.getCustomerByEmail(email);
            if (!customer) return false;

            const { data: subscription } = await this.getActiveSubscription(customer.customer_id);
            return Boolean(subscription);
        } catch (error) {
            console.error('Error checking subscription:', error);
            return false;
        }
    }

    getSupabaseClient() {
        return this.client;
    }
}