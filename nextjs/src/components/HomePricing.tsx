"use client";
import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Star, Zap, Crown, Loader2 } from 'lucide-react';
import PricingService from "@/lib/pricing";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface PricingTier {
  name: string;
  description: string;
  price: number;
  popular?: boolean;
  features: string[];
  saved?: number;
  trial?: number;
  productId: string;
}

// Safe hook za useGlobal sa fallback-om
const useSafeGlobal = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useGlobal } = require('@/lib/context/GlobalContext');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useGlobal();
  } catch {
    return {
      user: null,
      loading: false
    };
  }
};

const HomePricing = () => {
  const tiers = useMemo(() => PricingService.getAllTiers(), []);
  const commonFeatures = useMemo(() => PricingService.getCommonFeatures(), []);
  const router = useRouter();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  
  const { user, loading: authLoading } = useSafeGlobal();
  const isAuthenticated = Boolean(user);

  const getTierIcon = useCallback((tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'starter':
        return <Star className="h-6 w-6 text-blue-500" />;
      case 'growth':
        return <Zap className="h-6 w-6 text-purple-500" />;
      case 'premium':
        return <Crown className="h-6 w-6 text-amber-500" />;
      default:
        return <Star className="h-6 w-6 text-gray-500" />;
    }
  }, []);

  const getTierGradient = useCallback((tierName: string): string => {
    switch (tierName.toLowerCase()) {
      case 'starter':
        return 'from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 dark:border-blue-700';
      case 'growth':
        return 'from-purple-50 to-purple-100 border-purple-200 dark:from-purple-900/20 dark:to-purple-800/20 dark:border-purple-700';
      case 'premium':
        return 'from-amber-50 to-orange-100 border-amber-200 dark:from-amber-900/20 dark:to-orange-800/20 dark:border-amber-700';
      default:
        return 'from-gray-50 to-gray-100 border-gray-200 dark:from-gray-800 dark:to-gray-700 dark:border-gray-600';
    }
  }, []);

  const getButtonStyle = useCallback((tierName: string, isPopular: boolean): string => {
    if (isPopular) {
      return 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 dark:from-purple-700 dark:to-purple-800 dark:hover:from-purple-800 dark:hover:to-purple-900';
    }
    
    switch (tierName.toLowerCase()) {
      case 'starter':
        return 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg dark:bg-blue-700 dark:hover:bg-blue-800';
      case 'growth':
        return 'bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg dark:bg-purple-700 dark:hover:bg-purple-800';
      case 'premium':
        return 'bg-amber-600 text-white hover:bg-amber-700 shadow-md hover:shadow-lg dark:bg-amber-700 dark:hover:bg-amber-800';
      default:
        return 'bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800';
    }
  }, []);

  const getProgressWidth = useCallback((tier: PricingTier): string => {
    if (tier.popular) return '85%';
    if (tier.name === 'Starter') return '60%';
    return '75%';
  }, []);

  const handleCheckout = useCallback(async (tier: PricingTier): Promise<void> => {
    if (!isAuthenticated) {
      router.push('/auth/register');
      return;
    }

    setLoadingTier(tier.name);

    try {
      const baseUrl = window.location.origin;
      
      // Get user email from your user object - OVO JE KLJUČNA ISPRAVKA
      const userEmail = user?.email || `${user?.id}@yourdomain.com`;
      
      // Payload prema Dodo Payments Checkout Sessions dokumentaciji
      const checkoutPayload = {
        product_cart: [
          { 
            product_id: tier.productId, 
            quantity: 1 
          }
        ],
        success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&tier=${encodeURIComponent(tier.name)}`,
        cancel_url: `${baseUrl}/payment/cancel?tier=${encodeURIComponent(tier.name)}`,
        customer_email: userEmail, // KORISTI PRAVI EMAIL
        metadata: {
          tier: tier.name,
          user_id: user?.id,
          product_id: tier.productId,
        },
        // Opcionalno: dodaj customer details za bolji UX
        customer: {
          email: userEmail, // KORISTI PRAVI EMAIL OVDJE TAKOĐER
          user_id: user?.id,
        }
      };

      console.log('🔄 Creating Dodo Payments checkout session...');
      console.log('📧 Using email:', userEmail);

      const response = await fetch('/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutPayload),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Ako ne možemo parsirati JSON
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.checkout_url && !data.url) {
        throw new Error('No checkout URL received from Dodo Payments');
      }

      const checkoutUrl = data.checkout_url || data.url;
      console.log('✅ Dodo Payments checkout session created!');
      console.log('🔗 Redirecting to:', checkoutUrl);
      
      // REDIRECT NA DODO PAYMENTS CHECKOUT
      window.location.href = checkoutUrl;

    } catch (error) {
      console.error('💥 Checkout failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Checkout failed';
      
      toast.error(`Payment error: ${errorMessage}`);
      
    } finally {
      setLoadingTier(null);
    }
  }, [isAuthenticated, router, user?.id, user?.email]);

  const getButtonText = useCallback((isLoading: boolean, isAuth: boolean, isPopular?: boolean): React.ReactNode => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </>
      );
    }
    
    if (isAuth) return 'Subscribe Now';
    if (isPopular) return 'Get Started Today';
    return 'Start Free Trial';
  }, []);

  // Loading skeleton
  const loadingSkeleton = useMemo(() => (
    <section id="pricing" className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mx-auto mb-4" />
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mx-auto mb-16" />
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-96" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  ), []);

  // Pricing cards
  const pricingCards = useMemo(() => 
    tiers.map((tier) => (
      <Card
        key={tier.name}
        className={`relative flex flex-col border-2 transition-all duration-300 hover:shadow-xl ${
          tier.popular 
            ? 'scale-105 border-purple-500 dark:border-purple-400 shadow-2xl' 
            : 'border-gray-200 dark:border-gray-600 shadow-md hover:scale-[1.02]'
        } ${getTierGradient(tier.name)}`}
      >
        {tier.popular && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold rounded-full shadow-lg dark:from-purple-700 dark:to-purple-800">
            ⭐ Most Popular
          </div>
        )}

        <CardHeader className="text-center pb-4">
          <div className="flex justify-center items-center mb-4">
            {getTierIcon(tier.name)}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">
            {tier.name}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300 mt-2">
            {tier.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-grow flex flex-col p-6">
          <div className="text-center mb-6">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-gray-900 dark:text-white">
                {PricingService.formatPrice(tier.price)}
              </span>
              <span className="text-gray-600 dark:text-gray-400 text-lg">/month</span>
            </div>
            {tier.saved && (
              <p className="text-green-600 dark:text-green-400 text-sm font-medium mt-2">
                Save {tier.saved}% annually
              </p>
            )}
          </div>

          <div className="mb-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: getProgressWidth(tier) }}
              />
            </div>
          </div>

          <ul className="space-y-4 mb-8 flex-grow">
            {tier.features.map((feature) => (
              <li 
                key={feature} 
                className="flex items-start gap-3"
              >
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-4 mt-auto">
            <button
              onClick={() => handleCheckout(tier)}
              disabled={loadingTier === tier.name || authLoading}
              className={`w-full text-center px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                loadingTier === tier.name || authLoading
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                  : getButtonStyle(tier.name, Boolean(tier.popular))
              }`}
              type="button"
            >
              {getButtonText(loadingTier === tier.name, isAuthenticated, tier.popular)}
            </button>
            
            {tier.trial && (
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
                {tier.trial} days free trial
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )), [tiers, getTierGradient, getTierIcon, getProgressWidth, handleCheckout, authLoading, loadingTier, getButtonStyle, getButtonText, isAuthenticated]);

  // Common features section
  const commonFeaturesSection = useMemo(() => (
    <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        All plans include Dodo Payments features:
      </h3>
      <div className="flex flex-wrap justify-center gap-6 text-gray-600 dark:text-gray-300">
        {commonFeatures.map((feature) => (
          <div key={feature} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-lg">
            <Check className="h-4 w-4 text-green-500" />
            <span>{feature}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <p className="text-blue-800 dark:text-blue-300 text-sm">
          💳 <strong>Secure payments</strong> powered by Dodo Payments • 
          🔒 <strong>PCI DSS compliant</strong> • 
          🌍 <strong>Global support</strong>
        </p>
      </div>
    </div>
  ), [commonFeatures]);

  if (authLoading) {
    return loadingSkeleton;
  }

  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            Choose the perfect plan for your business with secure Dodo Payments integration. 
            No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {pricingCards}
        </div>

        {commonFeaturesSection}
      </div>
    </section>
  );
};

export default HomePricing;