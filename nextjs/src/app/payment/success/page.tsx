"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowLeft, ExternalLink, CreditCard, Calendar, User, Tag } from 'lucide-react';
import Link from 'next/link';
import PricingService from '@/lib/pricing';

interface PaymentDetails {
  tier: string | null;
  price: string | null;
  productId: string | null;
  userId: string | null;
  mock: boolean;
  paymentStatus: string | null;
}

// Komponenta koja koristi useSearchParams - wrapana u Suspense
function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    tier: null,
    price: null,
    productId: null,
    userId: null,
    mock: false,
    paymentStatus: null
  });

  useEffect(() => {
    const tier = searchParams.get('tier');
    const price = searchParams.get('price');
    const productId = searchParams.get('product_id');
    const userId = searchParams.get('user_id');
    const mock = searchParams.get('mock') === 'true';
    const paymentStatus = searchParams.get('payment_status');
    
    setPaymentDetails({
      tier,
      price,
      productId,
      userId,
      mock,
      paymentStatus
    });

    console.log('Payment success details:', {
      tier, price, productId, userId, mock, paymentStatus
    });
  }, [searchParams]);

  const tierDetails = paymentDetails.tier ? PricingService.getTierByName(paymentDetails.tier) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-900/20 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          {paymentDetails.mock ? (
            <div className="flex flex-col items-center">
              <CreditCard className="h-20 w-20 text-blue-500 mb-4" />
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium mb-2">
                Demo Mode
              </div>
            </div>
          ) : (
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
          )}
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {paymentDetails.mock ? 'Demo Payment Successful!' : 'Payment Successful!'}
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300">
            {paymentDetails.mock 
              ? 'Your demo subscription has been activated successfully.' 
              : 'Thank you for your subscription! You will receive a confirmation email shortly.'
            }
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Order Summary
          </h2>
          
          <div className="space-y-3">
            {paymentDetails.tier && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Plan:</span>
                <span className="font-semibold text-gray-800 dark:text-white">{paymentDetails.tier}</span>
              </div>
            )}
            
            {paymentDetails.price && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Monthly Price:</span>
                <span className="font-semibold text-gray-800 dark:text-white">
                  {PricingService.formatPrice(parseFloat(paymentDetails.price))}
                </span>
              </div>
            )}
            
            {paymentDetails.productId && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Product ID:</span>
                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{paymentDetails.productId}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Billing Cycle:</span>
              <span className="font-semibold text-gray-800 dark:text-white">Monthly</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Status:</span>
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                {paymentDetails.paymentStatus || 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* User Information */}
        {paymentDetails.userId && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">User Account</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Subscription linked to your account
            </p>
          </div>
        )}

        {/* Plan Features */}
        {tierDetails && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Your Plan Includes:
            </h3>
            <ul className="space-y-2">
              {tierDetails.features.slice(0, 5).map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Next Steps</span>
          </div>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Access your dashboard to manage your subscription</li>
            <li>• Set up your payment methods in account settings</li>
            <li>• Explore all features available in your plan</li>
            {paymentDetails.mock && (
              <li>• <strong>Remember:</strong> This is a demo - no real payment was processed</li>
            )}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/app"
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
          >
            Go to Dashboard
            <ExternalLink className="h-4 w-4" />
          </Link>
          
          <Link
            href="/"
            className="w-full border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Homepage
          </Link>

          {paymentDetails.mock && (
            <div className="text-center">
              <Link
                href="/#pricing"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/#pricing';
                }}
              >
                ← Choose a different plan
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading komponenta za Suspense fallback
function PaymentSuccessLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-900/20 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading...</h1>
        <p className="text-gray-600 dark:text-gray-300">Processing your payment details</p>
      </div>
    </div>
  );
}

// Glavna komponenta sa Suspense boundary
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
