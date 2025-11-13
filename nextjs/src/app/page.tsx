// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Globe, 
  Shield, 
  Users, 
  Key, 
  Database, 
  Clock,
  Menu,
  X 
} from 'lucide-react';
import AuthAwareButtons from '@/components/AuthAwareButtons';
import HomePricing from "@/components/HomePricing";

// Staticki podaci koji se ne mijenjaju cesto
const productName = process.env.NEXT_PUBLIC_PRODUCTNAME || 'Your SaaS';

const features = [
  {
    icon: Shield,
    title: 'Robust Authentication',
    description: 'Secure login with email/password, Multi-Factor Authentication, and SSO providers',
    color: 'text-green-600'
  },
  {
    icon: Database,
    title: 'File Management',
    description: 'Built-in file storage with secure sharing, downloads, and granular permissions',
    color: 'text-orange-600'
  },
  {
    icon: Users,
    title: 'User Settings',
    description: 'Complete user management with password updates, MFA setup, and profile controls',
    color: 'text-red-600'
  },
  {
    icon: Clock,
    title: 'Task Management',
    description: 'Built-in todo system with real-time updates and priority management',
    color: 'text-teal-600'
  },
  {
    icon: Globe,
    title: 'Legal Documents',
    description: 'Pre-configured privacy policy, terms of service, and refund policy pages',
    color: 'text-purple-600'
  },
  {
    icon: Key,
    title: 'Cookie Consent',
    description: 'GDPR-compliant cookie consent system with customizable preferences',
    color: 'text-blue-600'
  }
];

const stats = [
  { label: 'Active Users', value: '10K+' },
  { label: 'Organizations', value: '2K+' },
  { label: 'Countries', value: '50+' },
  { label: 'Uptime', value: '99.9%' }
];

// Mobile Menu Component
const MobileMenu = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              Menu
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-6">
            <div className="space-y-6">
              <Link
                href="#features"
                className="block text-lg font-medium text-gray-900 hover:text-primary-600 transition-colors py-2"
                onClick={onClose}
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="block text-lg font-medium text-gray-900 hover:text-primary-600 transition-colors py-2"
                onClick={onClose}
              >
                Pricing
              </Link>
              <Link
                href="https://github.com/Razikus/supabase-nextjs-template"
                className="block text-lg font-medium text-gray-900 hover:text-primary-600 transition-colors py-2"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
              >
                Documentation
              </Link>
              <Link
                href="https://github.com/Razikus/supabase-nextjs-template"
                className="block text-lg font-medium text-gray-900 hover:text-primary-600 transition-colors py-2"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
              >
                Grab This Template
              </Link>
            </div>
          </nav>

          {/* Auth Buttons */}
          <div className="p-6 border-t border-gray-100">
            <AuthAwareButtons variant="mobile" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Prefetch linkovi za glavne rute
const PrefetchLinks = () => (
  <>
    <Link href="/auth/login" prefetch className="hidden" />
    <Link href="/auth/register" prefetch className="hidden" />
    <Link href="/legal/privacy" prefetch className="hidden" />
    <Link href="/legal/terms" prefetch className="hidden" />
  </>
);

// Hero Section kao zasebna komponenta za bolju performance
const HeroSection = () => (
  <section className="relative pt-28 pb-20 md:pt-32 md:pb-24 overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
          Bootstrap Your SaaS
          <span className="block text-primary-600 mt-2">In 5 minutes</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Launch your SaaS product in days, not months. Complete with authentication and enterprise-grade security built right in.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <AuthAwareButtons />
        </div>
      </div>
    </div>
  </section>
);

// Stats Section
const StatsSection = () => (
  <section className="py-12 md:py-16 bg-gradient-to-b from-white to-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 md:gap-8">
        {stats.map((stat, index) => (
          <div key={index} className="text-center p-4">
            <div className="text-2xl xs:text-3xl sm:text-4xl font-bold text-primary-600">
              {stat.value}
            </div>
            <div className="mt-1 xs:mt-2 text-xs xs:text-sm text-gray-600 font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Features Section
const FeaturesSection = () => (
  <section id="features" className="py-16 md:py-20 bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          Everything You Need
        </h2>
        <p className="mt-3 md:mt-4 text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
          Built with modern technologies for reliability and speed
        </p>
      </div>
      <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <div
              key={index}
              className="bg-white p-5 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
            >
              <IconComponent className={`h-7 w-7 sm:h-8 sm:w-8 ${feature.color}`} />
              <h3 className="mt-3 sm:mt-4 text-lg sm:text-xl font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

// CTA Section
const CTASection = () => (
  <section className="py-16 md:py-20 bg-primary-600">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-2xl md:text-3xl font-bold text-white">
        Ready to Transform Your Idea into Reality?
      </h2>
      <p className="mt-3 md:mt-4 text-base md:text-lg text-primary-100 max-w-2xl mx-auto">
        Join thousands of developers building their SaaS with {productName}
      </p>
      <Link
        href="/auth/register"
        prefetch
        className="mt-6 md:mt-8 inline-flex items-center px-5 py-3 md:px-6 md:py-3 rounded-lg bg-white text-primary-600 font-semibold hover:bg-primary-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600 text-sm md:text-base"
      >
        Get Started Now
        <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
      </Link>
    </div>
  </section>
);

// Footer Component
const Footer = () => (
  <footer className="bg-gray-50 border-t border-gray-200">
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
        <div className="xs:col-span-2 md:col-span-1">
          <h4 className="text-sm font-semibold text-gray-900">Product</h4>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                Features
              </Link>
            </li>
            <li>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                Pricing
              </Link>
            </li>
          </ul>
        </div>
        <div className="xs:col-span-2 md:col-span-1">
          <h4 className="text-sm font-semibold text-gray-900">Resources</h4>
          <ul className="mt-3 space-y-2">
            <li>
              <Link 
                href="https://github.com/Razikus/supabase-nextjs-template" 
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                Documentation
              </Link>
            </li>
          </ul>
        </div>
        <div className="xs:col-span-2 md:col-span-1">
          <h4 className="text-sm font-semibold text-gray-900">Legal</h4>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/legal/privacy" prefetch className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/legal/terms" prefetch className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-200">
        <p className="text-center text-gray-600 text-sm">
          © {new Date().getFullYear()} {productName}. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

// Navigation Component
const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm z-40 border-b border-gray-100 supports-backdrop-blur:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            <div className="flex-shrink-0">
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                {productName}
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm lg:text-base">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm lg:text-base">
                Pricing
              </Link>
              <Link
                href="https://github.com/Razikus/supabase-nextjs-template"
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm lg:text-base"
                target="_blank"
                rel="noopener noreferrer"
              >
                Documentation
              </Link>
              <Link
                href="https://github.com/Razikus/supabase-nextjs-template"
                className="bg-primary-800 text-white px-4 py-2 rounded-lg hover:bg-primary-900 transition-colors font-medium text-sm lg:text-base"
                target="_blank"
                rel="noopener noreferrer"
              >
                Grab This Template
              </Link>
              <AuthAwareButtons variant="nav" />
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </>
  );
};

// Glavna komponenta
export default function Home() {
  return (
    <div className="min-h-screen">
      <PrefetchLinks />
      <Navigation />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HomePricing />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}