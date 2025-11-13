// nextjs/src/lib/context/GlobalContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createSPASassClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/types';

// Types based on your Database schema
type User = {
  email: string;
  id: string;
  registered_at: Date;
};

type Customer = Database['public']['Tables']['customers']['Row'];
type Subscription = Database['public']['Tables']['subscriptions']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];

interface GlobalContextType {
  loading: boolean;
  user: User | null;
  customer: Customer | null;
  subscription: Subscription | null;
  transactions: Transaction[];
  isSubscribed: boolean;
  isTrialActive: boolean;
  hasCustomerProfile: boolean;
  refreshData: () => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadUserData = useCallback(async (): Promise<void> => {
    try {
      const supabase = await createSPASassClient();
      const client = supabase.getSupabaseClient();

      // Get user data from auth
      const { data: { user: authUser }, error: authError } = await client.auth.getUser();
      
      // If no authenticated user, just set loading to false and return
      if (authError || !authUser) {
        console.log('No authenticated user found - this is normal for public pages');
        setUser(null);
        setCustomer(null);
        setSubscription(null);
        setTransactions([]);
        return;
      }

      const userData: User = {
        email: authUser.email!,
        id: authUser.id,
        registered_at: new Date(authUser.created_at),
      };
      setUser(userData);

      // Use the new unified methods to load customer data
      const { data: customerData, error: customerError } = await supabase.getCustomerByEmail(authUser.email!);

      if (!customerError && customerData) {
        setCustomer(customerData);

        // Load active subscription
        const { data: subscriptionData, error: subscriptionError } = await supabase.getActiveSubscription(customerData.customer_id);
        
        if (!subscriptionError && subscriptionData) {
          setSubscription(subscriptionData);
        } else {
          setSubscription(null);
        }

        // Load recent transactions
        const { data: transactionsData, error: transactionsError } = await supabase.getCustomerTransactions(customerData.customer_id, 10);
        
        if (!transactionsError && transactionsData) {
          setTransactions(transactionsData);
        } else {
          setTransactions([]);
        }
      } else {
        // No customer profile found - this is normal for new users
        setCustomer(null);
        setSubscription(null);
        setTransactions([]);
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      // Don't reset user here to avoid redirect loops
      // Only reset customer-related data
      setCustomer(null);
      setSubscription(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUserData();
  }, [loadUserData]);

  const refreshData = useCallback(async (): Promise<void> => {
    setLoading(true);
    await loadUserData();
    setLoading(false);
  }, [loadUserData]);

  // Helper computed values
  const isSubscribed = Boolean(
    subscription && 
    ['active', 'trialing', 'past_due'].includes(subscription.subscription_status)
  );

  const isTrialActive = Boolean(
    subscription?.trial_end_date && 
    new Date(subscription.trial_end_date) > new Date()
  );

  const hasCustomerProfile = Boolean(customer);

  const contextValue: GlobalContextType = {
    loading, 
    user, 
    customer,
    subscription,
    transactions,
    isSubscribed,
    isTrialActive,
    hasCustomerProfile,
    refreshData,
  };

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
}

export const useGlobal = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};