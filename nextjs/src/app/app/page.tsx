// src/app/app/page.tsx
"use client";
import React, { useCallback, useMemo, useState } from 'react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CalendarDays, Settings, ExternalLink, CreditCard, User, AlertCircle, CheckCircle2, Shield, RotateCcw, FileText, ExternalLinkIcon, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DashboardContent() {
  const { loading, user, customer, subscription, transactions, isSubscribed, isTrialActive, hasCustomerProfile } = useGlobal();
  const [portalLoading, setPortalLoading] = useState(false);
  const router = useRouter();

  const getDaysSinceRegistration = useCallback(() => {
    if (!user?.registered_at) return 0;
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - user.registered_at.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [user?.registered_at]);

  const getSubscriptionStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400';
      case 'trialing': return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400';
      case 'past_due': return 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400';
      case 'cancelled': return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400';
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400';
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const formatAmount = useCallback((amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount / 100);
  }, []);

  const openCustomerPortal = useCallback(async () => {
    if (!customer?.customer_id) return;

    setPortalLoading(true);
    try {
      const response = await fetch('/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customer.customer_id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const data = await response.json();
      
      if (data.link) {
        window.location.href = data.link;
      } else {
        throw new Error('No portal link received');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      alert('Failed to open customer portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  }, [customer?.customer_id]);

  const goToHomepage = useCallback(() => {
    router.push('/');
  }, [router]);

  // Memoized computed values
  const daysSinceRegistration = useMemo(() => getDaysSinceRegistration(), [getDaysSinceRegistration]);
  const recentTransactions = useMemo(() => transactions.slice(0, 3), [transactions]);
  const hasTransactions = useMemo(() => transactions.length > 0, [transactions.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-900 min-h-screen">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={goToHomepage}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Go back to homepage"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-medium">Back to Home</span>
        </button>
        <div className="flex-1" />
      </div>

      {/* Welcome Card */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl text-gray-900 dark:text-white">
            Welcome, {user?.email?.split('@')[0]}! 👋
          </CardTitle>
          <CardDescription className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <CalendarDays className="h-4 w-4" />
            Member for {daysSinceRegistration} days
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Subscription & Billing Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subscription Status */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
              <CreditCard className="h-5 w-5" />
              Subscription Status
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Your current plan and billing information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer ? (
              <>
                <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">Customer ID</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{customer.customer_id}</p>
                    </div>
                  </div>
                </div>

                {subscription ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Current Plan</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {subscription.product_id?.replace(/_/g, ' ') || 'Standard Plan'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSubscriptionStatusColor(subscription.subscription_status)}`}>
                        {subscription.subscription_status.charAt(0).toUpperCase() + subscription.subscription_status.slice(1)}
                      </span>
                    </div>

                    {isTrialActive && subscription.trial_end_date && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Trial ends on {formatDate(subscription.trial_end_date)}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {subscription.next_billing_date && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Next billing:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(subscription.next_billing_date)}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Started:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{formatDate(subscription.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">No active subscription</p>
                    <Link 
                      href="/pricing" 
                      className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium text-sm"
                    >
                      Choose a plan <ExternalLinkIcon className="h-3 w-3" />
                    </Link>
                  </div>
                )}

                {/* Customer Portal Access */}
                <button
                  onClick={openCustomerPortal}
                  disabled={portalLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {portalLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Opening Portal...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Manage Subscription & Billing
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">No customer profile found</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  Complete your first purchase to access billing features
                </p>
                <Link 
                  href="/pricing" 
                  className="inline-flex items-center gap-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  View Pricing Plans
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions & Activity */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
              <FileText className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Your latest transactions and payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasCustomerProfile ? (
              <>
                {hasTransactions ? (
                  <div className="space-y-3">
                    {recentTransactions.map((transaction) => (
                      <div key={transaction.transaction_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-full ${
                            transaction.status === 'succeeded' 
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {transaction.status === 'succeeded' ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate text-gray-900 dark:text-white">
                              {formatAmount(transaction.amount, transaction.currency)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(transaction.billed_at)}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          transaction.status === 'succeeded' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                            : transaction.status === 'refunded'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <RotateCcw className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">No transactions yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      Your payment history will appear here
                    </p>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{transactions.length}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Total Transactions</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isSubscribed ? 'Active' : 'Inactive'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Subscription</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No activity to show</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Complete a purchase to see your transaction history
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">Frequently used features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/app/user-settings"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group border-gray-200 dark:border-gray-600"
            >
              <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-full group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
                <Settings className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate text-gray-900 dark:text-white">User Settings</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Manage account preferences</p>
              </div>
            </Link>

            <Link
              href="/pricing"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group border-gray-200 dark:border-gray-600"
            >
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-full group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
                <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate text-gray-900 dark:text-white">Upgrade Plan</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Explore pricing options</p>
              </div>
            </Link>

            <Link
              href="/app/table"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group border-gray-200 dark:border-gray-600"
            >
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate text-gray-900 dark:text-white">Example Page</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Check out features</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}