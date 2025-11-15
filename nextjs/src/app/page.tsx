// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Globe, 
  Shield, 
  Users, 
  Play,
  Key, 
  Database, 
  Clock,
  Menu,
  X,
  Sun,
  Moon
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

// Mobile Menu Component sa ikonicama
const MobileMenu = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setIsDark(theme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

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

  // Menu items sa ikonicama
  const menuItems = [
    {
      href: "/#features",
      label: "Features",
      icon: Shield,
      iconColor: "text-green-600"
    },
    {
      href: "/#pricing",
      label: "Pricing",
      icon: Database,
      iconColor: "text-blue-600"
    },
    {
      href: "https://github.com/Razikus/supabase-nextjs-template",
      label: "Documentation",
      icon: Globe,
      iconColor: "text-purple-600",
      external: true
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm dark:bg-black/40"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-xl border-l border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header sa theme toggle */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
            <Link 
              href="/" 
              className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent"
              onClick={onClose}
            >
              Menu
            </Link>
            <div className="flex items-center space-x-2">
              {/* Theme Toggle u mobile menu header */}
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDark ? (
                    <Sun className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Navigation Links sa ikonicama */}
          <nav className="flex-1 p-6">
            <div className="space-y-4">
              {menuItems.map((item, index) => {
                const IconComponent = item.icon;
                const linkContent = (
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                    <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700 transition-colors ${item.iconColor}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {item.label}
                    </span>
                  </div>
                );

                if (item.external) {
                  return (
                    <a
                      key={index}
                      href={item.href}
                      className="block"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onClose}
                    >
                      {linkContent}
                    </a>
                  );
                }

                return (
                  <Link
                    key={index}
                    href={item.href}
                    className="block"
                    onClick={onClose}
                  >
                    {linkContent}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Auth Buttons */}
          <div className="p-6 border-t border-gray-100 dark:border-gray-800">
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
  <section className="relative pt-28 pb-20 md:pt-32 md:pb-24 overflow-hidden bg-white dark:bg-gray-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
          Bootstrap Your SaaS
          <span className="block text-primary-600 dark:text-primary-400 mt-2">In 5 minutes</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
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
  <section className="py-12 md:py-16 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 md:gap-8">
        {stats.map((stat, index) => (
          <div key={index} className="text-center p-4">
            <div className="text-2xl xs:text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400">
              {stat.value}
            </div>
            <div className="mt-1 xs:mt-2 text-xs xs:text-sm text-gray-600 dark:text-gray-400 font-medium">
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
  <section id="features" className="py-16 md:py-20 bg-gray-50 dark:bg-gray-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Everything You Need
        </h2>
        <p className="mt-3 md:mt-4 text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Built with modern technologies for reliability and speed
        </p>
      </div>
      <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              <IconComponent className={`h-7 w-7 sm:h-8 sm:w-8 ${feature.color}`} />
              <h3 className="mt-3 sm:mt-4 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
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
  <section className="py-16 md:py-20 bg-gradient-to-r from-orange-400 to-purple-600 dark:from-slate-800 dark:to-slate-900">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-2xl md:text-4xl font-bold text-white dark:text-white drop-shadow-sm">
        Ready to Transform Your Idea into Reality?
      </h2>
      <p className="mt-4 md:mt-6 text-lg md:text-xl text-white/90 dark:text-white/80 max-w-2xl mx-auto leading-relaxed">
        Join thousands of developers building their SaaS with <span className="font-semibold text-white">{productName}</span>
      </p>
      <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/auth/register"
          prefetch
          className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-slate-900 font-bold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg hover:shadow-xl text-base md:text-lg min-w-[160px]"
        >
          Get Started Now
          <ArrowRight className="ml-3 h-5 w-5" />
        </Link>
        <Link
          href="/demo"
          prefetch
          className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-transparent border-2 border-white text-white font-bold hover:bg-white/10 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/30 text-base md:text-lg min-w-[160px]"
        >
          Live Demo
          <Play className="ml-3 h-5 w-5" />
        </Link>
      </div>
      <p className="mt-6 text-sm md:text-base text-white/70 dark:text-white/60">
        No credit card required • Free 14-day trial
      </p>
    </div>
  </section>
);

// Footer Component
const Footer = () => (
  <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
        <div className="xs:col-span-2 md:col-span-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Product</h4>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/#features" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">
                Features
              </Link>
            </li>
            <li>
              <Link href="/#pricing" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">
                Pricing
              </Link>
            </li>
          </ul>
        </div>
        <div className="xs:col-span-2 md:col-span-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Resources</h4>
          <ul className="mt-3 space-y-2">
            <li>
              <Link 
                href="https://github.com/Razikus/supabase-nextjs-template" 
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                Documentation
              </Link>
            </li>
          </ul>
        </div>
        <div className="xs:col-span-2 md:col-span-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Legal</h4>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/legal/privacy" prefetch className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/legal/terms" prefetch className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-200 dark:border-gray-700">
        <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
          © {new Date().getFullYear()} {productName}. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

// Navigation Component
const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Provjeri trenutni theme
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setIsDark(theme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <>
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm z-40 border-b border-gray-100 supports-backdrop-blur:bg-white/60 dark:bg-gray-900/80 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            <div className="flex-shrink-0">
              <Link 
                href="/" 
                className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent dark:from-primary-400 dark:to-primary-300 hover:opacity-80 transition-opacity"
              >
                {productName}
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              <Link href="/#features" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors font-medium text-sm lg:text-base">
                Features
              </Link>
              <Link href="/#pricing" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors font-medium text-sm lg:text-base">
                Pricing
              </Link>
              <Link
                href="https://github.com/Razikus/supabase-nextjs-template"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors font-medium text-sm lg:text-base"
                target="_blank"
                rel="noopener noreferrer"
              >
                Documentation
              </Link>
              
              {/* Theme Toggle Button */}
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                  title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDark ? (
                    <Sun className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              )}
              
              <AuthAwareButtons variant="nav" />
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-2 md:hidden">
              {/* Theme Toggle Button za mobile */}
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDark ? (
                    <Sun className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              )}
              
              <button
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
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