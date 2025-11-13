# Dodo Payments SaaS Platform

A production-ready SaaS platform built with Next.js 15, Supabase, and Dodo Payments integration. This is a fork of the [Razikus Supabase SaaS Template](https://github.com/Razikus/supabase-nextjs-template) with comprehensive payment processing capabilities.

## 🎉 What's New & Enhanced

### Payment Processing & Subscription Management
- **Dodo Payments Integration** - Complete payment processing with checkout, subscriptions, and customer portal
- **Real-time Subscription Tracking** - Monitor subscription status, trial periods, and billing cycles
- **Transaction History** - Full payment transaction history with status tracking
- **Customer Portal** - Self-service subscription management for customers
- **Refund & Dispute Handling** - Comprehensive refund and dispute management system

### Enhanced Features
- **Type-Safe Architecture** - Full TypeScript implementation with strict type checking
- **Payment Webhooks** - Real-time webhook handling for payment events
- **Customer Management** - Automated customer profile creation and management
- **Subscription Analytics** - Dashboard with subscription metrics and billing information
- **Multi-tier Pricing** - Flexible pricing plans with trial support

## 🚀 Core Features

### Payment & Billing
- **Secure Checkout** - Dodo Payments powered checkout with multiple payment methods
- **Subscription Management** - Handle recurring payments and subscription lifecycle
- **Customer Portal** - Allow customers to manage their subscriptions and billing
- **Payment Webhooks** - Process payment events in real-time (success, failure, refunds, disputes)
- **Transaction Tracking** - Complete audit trail of all payment activities

### User Management & Security
- **Supabase Authentication** - Email/password auth with secure session management
- **Row Level Security** - Database-level security policies
- **Customer Profile Sync** - Automatic customer creation with payment integration
- **Secure File Storage** - Protected file upload and sharing capabilities

### Dashboard & Analytics
- **Subscription Overview** - Real-time subscription status and billing information
- **Payment History** - Complete transaction history with filtering
- **Customer Portal Access** - Direct integration with Dodo Customer Portal
- **Quick Actions** - Easy navigation to key features and settings

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** (App Router) with React 19
- **TypeScript** - Full type safety
- **Tailwind CSS** - Modern, responsive design
- **shadcn/ui** - Beautiful, accessible components
- **Lucide Icons** - Consistent iconography

### Backend & Payments
- **Supabase** - PostgreSQL database with real-time capabilities
- **Dodo Payments** - Payment processing and subscription management
- **Row Level Security** - Database security policies
- **Storage Buckets** - Secure file storage

### Authentication & Security
- **Supabase Auth** - Secure authentication with MFA support
- **API Route Protection** - Secure server-side operations
- **Webhook Signature Verification** - Secure payment webhook processing

## 📦 Getting Started

### Prerequisites
- Node.js 18+ 
- Supabase account
- Dodo Payments account


### Local Development

1. **Clone and setup Supabase:**
```bash
# Login to supabase
npx supabase login

# Link your project
npx supabase link

# Run migrations
npx supabase migrations up --linked