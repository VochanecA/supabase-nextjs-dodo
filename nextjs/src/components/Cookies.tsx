'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, X } from 'lucide-react';
import { setCookie, getCookie } from 'cookies-next/client';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'cookie-accept';
const COOKIE_EXPIRY_DAYS = 365;

const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = getCookie(COOKIE_CONSENT_KEY);
        if (!consent) {
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        setCookie(COOKIE_CONSENT_KEY, 'accepted', {
            expires: new Date(Date.now() + COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            path: '/'
        });
        setIsVisible(false);
    };

    const handleDecline = () => {
        setCookie(COOKIE_CONSENT_KEY, 'declined', {
            expires: new Date(Date.now() + COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            path: '/'
        });
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 transform transition-transform duration-500 ease-in-out">
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                        <div className="flex-shrink-0 mt-1">
                            <Shield className="h-7 w-7 text-orange-500 dark:text-orange-400" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-base text-gray-800 dark:text-gray-200 leading-relaxed">
                                We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                                By clicking &quot;Accept&quot;, you consent to our use of cookies.
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Read our{' '}
                                <Link 
                                    href="/legal/privacy" 
                                    className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 underline font-medium transition-colors"
                                >
                                    Privacy Policy
                                </Link>{' '}
                                and{' '}
                                <Link 
                                    href="/legal/terms" 
                                    className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 underline font-medium transition-colors"
                                >
                                    Terms of Service
                                </Link>{' '}
                                for more information.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDecline}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-base px-4 py-2"
                        >
                            Decline
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleAccept}
                            className="bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-base px-4 py-2 font-medium transition-colors"
                        >
                            Accept
                        </Button>
                        <button
                            onClick={handleDecline}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;