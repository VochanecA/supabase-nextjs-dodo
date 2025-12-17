// app/page.tsx
'use client';

import React, { useState, useEffect, memo, Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
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
  Moon,
  Sparkles,
  Zap,
  CheckCircle2
} from 'lucide-react';

// Lazy load komponenti
const AuthAwareButtons = dynamic(() => import('@/components/AuthAwareButtons'), {
  ssr: false,
  loading: () => <div className="h-11 w-28 bg-gradient-to-r from-primary-200 to-primary-300 dark:from-primary-900 dark:to-primary-800 rounded-xl animate-pulse" />
});

const HomePricing = dynamic(() => import('@/components/HomePricing'), {
  ssr: true,
  loading: () => <div className="h-96 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-3xl animate-pulse" />
});

const productName = process.env.NEXT_PUBLIC_PRODUCTNAME || 'Your SaaS';

const features = [
  { icon: Shield, title: 'Robust Authentication', description: 'Enterprise-grade security with MFA, SSO, and passwordless login options', color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  { icon: Database, title: 'File Management', description: 'Scalable cloud storage with CDN delivery and intelligent caching', color: 'from-orange-500 to-red-600', bg: 'bg-orange-50 dark:bg-orange-950' },
  { icon: Users, title: 'User Settings', description: 'Granular controls with role-based access and team management', color: 'from-rose-500 to-pink-600', bg: 'bg-rose-50 dark:bg-rose-950' },
  { icon: Clock, title: 'Task Management', description: 'Real-time collaboration with webhooks and automation workflows', color: 'from-cyan-500 to-blue-600', bg: 'bg-cyan-50 dark:bg-cyan-950' },
  { icon: Globe, title: 'Legal Documents', description: 'Compliant templates for GDPR, CCPA, and international regulations', color: 'from-purple-500 to-indigo-600', bg: 'bg-purple-50 dark:bg-purple-950' },
  { icon: Key, title: 'Cookie Consent', description: 'Smart consent management with analytics and preference tracking', color: 'from-blue-500 to-violet-600', bg: 'bg-blue-50 dark:bg-blue-950' }
] as const;

const stats = [
  { label: 'Active Users', value: '10K+', icon: Users },
  { label: 'Organizations', value: '2K+', icon: Globe },
  { label: 'Countries', value: '50+', icon: Sparkles },
  { label: 'Uptime', value: '99.9%', icon: Zap }
] as const;

const menuItems = [
  { href: "/#features", label: "Features", icon: Shield, iconColor: "text-emerald-600 dark:text-emerald-400", external: false },
  { href: "/#pricing", label: "Pricing", icon: Database, iconColor: "text-blue-600 dark:text-blue-400", external: false },
  { href: "https://github.com/Razikus/supabase-nextjs-template", label: "Docs", icon: Globe, iconColor: "text-purple-600 dark:text-purple-400", external: true }
] as const;

// Custom hook za theme
const useTheme = () => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  return { isDark, mounted, toggleTheme };
};

// Mobile Menu
const MobileMenu = memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { isDark, mounted, toggleTheme } = useTheme();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl border-l border-gray-200/50 dark:border-gray-700/50 transform transition-transform duration-300 ease-out">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-5 border-b border-gray-200/50 dark:border-gray-700/50">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 dark:from-primary-400 dark:via-primary-300 dark:to-primary-400 bg-clip-text text-transparent" onClick={onClose}>
              {productName}
            </Link>
            <div className="flex items-center gap-2">
              {mounted && (
                <button onClick={toggleTheme} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95" aria-label={isDark ? "Light mode" : "Dark mode"}>
                  {isDark ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-600" />}
                </button>
              )}
              <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95" aria-label="Close">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          <nav className="flex-1 p-5 overflow-y-auto">
            <div className="space-y-2">
              {menuItems.map((item, i) => {
                const Icon = item.icon;
                const content = (
                  <div className="flex items-center gap-3 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-950 dark:hover:to-primary-900 transition-all group active:scale-98">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 group-hover:from-white group-hover:to-gray-50 dark:group-hover:from-gray-700 dark:group-hover:to-gray-600 transition-all ${item.iconColor}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {item.label}
                    </span>
                  </div>
                );
                return item.external ? (
                  <a key={i} href={item.href} className="block" target="_blank" rel="noopener noreferrer" onClick={onClose}>{content}</a>
                ) : (
                  <Link key={i} href={item.href} className="block" onClick={onClose}>{content}</Link>
                );
              })}
            </div>
          </nav>
          <div className="p-5 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-800/50">
            <Suspense fallback={<div className="h-12 bg-gradient-to-r from-primary-200 to-primary-300 dark:from-primary-900 dark:to-primary-800 rounded-xl animate-pulse" />}>
              <AuthAwareButtons variant="mobile" />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
});
MobileMenu.displayName = 'MobileMenu';

// Hero Section
const HeroSection = memo(() => (
  <section className="relative pt-20 pb-16 sm:pt-24 sm:pb-20 md:pt-32 md:pb-28 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-100/20 via-transparent to-transparent dark:from-primary-900/10" />
    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-300/30 to-transparent dark:from-purple-600/10 blur-3xl rounded-full" />
    <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-primary-300/30 to-transparent dark:from-primary-600/10 blur-3xl rounded-full" />
    
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary-100 to-purple-100 dark:from-primary-900/50 dark:to-purple-900/50 border border-primary-200 dark:border-primary-800 mb-6 sm:mb-8 backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          <span className="text-xs sm:text-sm font-semibold text-primary-700 dark:text-primary-300">Launch in minutes, not months</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
            Bootstrap Your SaaS
          </span>
          <span className="block mt-2 bg-gradient-to-r from-primary-600 via-purple-600 to-primary-600 dark:from-primary-400 dark:via-purple-400 dark:to-primary-400 bg-clip-text text-transparent">
            In 5 Minutes
          </span>
        </h1>

        <p className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed font-medium">
          Launch your SaaS product in <span className="text-primary-600 dark:text-primary-400 font-bold">days</span>, not months. Complete with authentication and enterprise-grade security built right in.
        </p>

        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Suspense fallback={<div className="h-12 w-36 bg-gradient-to-r from-primary-200 to-primary-300 dark:from-primary-900 dark:to-primary-800 rounded-xl animate-pulse" />}>
            <AuthAwareButtons />
          </Suspense>
        </div>

        <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>No credit card</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  </section>
));
HeroSection.displayName = 'HeroSection';

// Stats Section
const StatsSection = memo(() => (
  <section className="py-12 sm:py-16 md:py-20 bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="group relative p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all hover:shadow-lg hover:-translate-y-1">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400 mb-2 sm:mb-3 opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-br from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
));
StatsSection.displayName = 'StatsSection';

// Features Section
const FeaturesSection = memo(() => (
  <section id="features" className="py-16 sm:py-20 md:py-28 bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12 sm:mb-16 md:mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/50 border border-primary-200 dark:border-primary-800 mb-4">
          <Zap className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          <span className="text-xs sm:text-sm font-semibold text-primary-700 dark:text-primary-300">Powerful Features</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Everything You Need
        </h2>
        <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Built with modern technologies for reliability, speed, and scalability
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <div
              key={i}
              className="group relative p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
            >
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-300`} />
              
              <div className={`inline-flex p-3 rounded-2xl ${feature.bg} border border-gray-200 dark:border-gray-700 mb-4 sm:mb-5`}>
                <Icon className={`h-6 w-6 sm:h-7 sm:w-7 text-gray-900 dark:text-white`} />
              </div>
              
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
));
FeaturesSection.displayName = 'FeaturesSection';

// CTA Section
const CTASection = memo(() => (
  <section className="relative py-16 sm:py-20 md:py-28 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-purple-600 to-primary-700 dark:from-primary-900 dark:via-purple-900 dark:to-primary-950" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-400/20 to-transparent blur-3xl rounded-full animate-pulse" />
    <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-primary-400/20 to-transparent blur-3xl rounded-full animate-pulse" />
    
    <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 sm:mb-8">
        <Sparkles className="h-4 w-4 text-white" />
        <span className="text-xs sm:text-sm font-semibold text-white">Join 10,000+ developers</span>
      </div>

      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg">
        Ready to Transform Your
        <span className="block mt-2">Idea into Reality?</span>
      </h2>

      <p className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed font-medium">
        Join thousands of developers building amazing products with <span className="font-bold text-white underline decoration-2 underline-offset-4">{productName}</span>
      </p>

      <div className="mt-8 sm:mt-10 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
        <Link
          href="/auth/register"
          prefetch
          className="group w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-white text-gray-900 font-bold hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-2xl hover:shadow-3xl text-base md:text-lg"
        >
          Get Started Free
          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          href="/demo"
          prefetch
          className="group w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/50 text-white font-bold hover:bg-white/20 transition-all duration-200 transform hover:scale-105 active:scale-95 text-base md:text-lg"
        >
          Watch Demo
          <Play className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
        </Link>
      </div>

      <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-white/80">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>No credit card required</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Free 14-day trial</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Cancel anytime</span>
        </div>
      </div>
    </div>
  </section>
));
CTASection.displayName = 'CTASection';

// Footer
const Footer = memo(() => (
  <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
    <div className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-8 sm:gap-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 bg-clip-text text-transparent">
            {productName}
          </Link>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Launch your SaaS in minutes with enterprise-grade infrastructure.
          </p>
        </div>
        
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Product</h4>
          <ul className="space-y-3">
            <li><Link href="/#features" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Features</Link></li>
            <li><Link href="/#pricing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Pricing</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Resources</h4>
          <ul className="space-y-3">
            <li><Link href="https://github.com/Razikus/supabase-nextjs-template" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" target="_blank" rel="noopener noreferrer">Documentation</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Legal</h4>
          <ul className="space-y-3">
            <li><Link href="/legal/privacy" prefetch className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Privacy</Link></li>
            <li><Link href="/legal/terms" prefetch className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Terms</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} {productName}. All rights reserved.
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
          <Zap className="h-3 w-3" />
          <span>Powered by Vercel</span>
        </div>
      </div>
    </div>
  </footer>
));
Footer.displayName = 'Footer';

// Navigation
const Navigation = memo(() => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isDark, mounted, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 w-full z-40 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-700/50' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-18 items-center">
            <Link href="/" className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary-600 via-purple-600 to-primary-600 dark:from-primary-400 dark:via-purple-400 dark:to-primary-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              {productName}
            </Link>
            
            <div className="hidden md:flex items-center gap-2 lg:gap-4">
              {menuItems.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  className="px-4 py-2 rounded-xl text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all font-medium text-sm lg:text-base"
                  {...(item.external && { target: "_blank", rel: "noopener noreferrer" })}
                >
                  {item.label}
                </Link>
              ))}
              
              {mounted && (
                <button onClick={toggleTheme} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95" aria-label={isDark ? "Light mode" : "Dark mode"}>
                  {isDark ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-600" />}
                </button>
              )}
              
              <Suspense fallback={<div className="h-11 w-28 bg-gradient-to-r from-primary-200 to-primary-300 dark:from-primary-900 dark:to-primary-800 rounded-xl animate-pulse" />}>
                <AuthAwareButtons variant="nav" />
              </Suspense>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              {mounted && (
                <button onClick={toggleTheme} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95" aria-label={isDark ? "Light mode" : "Dark mode"}>
                  {isDark ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-600" />}
                </button>
              )}
              <button className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95" onClick={() => setIsMobileMenuOpen(true)} aria-label="Menu">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
});
Navigation.displayName = 'Navigation';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <Suspense fallback={<div className="h-96 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 animate-pulse" />}>
          <HomePricing />
        </Suspense>
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}