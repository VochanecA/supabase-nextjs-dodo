'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Props {
  customerId: string;
  className?: string;
}

export default function CustomerPortalButton({ customerId, className }: Props) {
  return (
    <Link
      href={`/customer-portal?customer_id=${customerId}`}
      target="_blank"
      className={`flex items-center justify-center px-4 py-4 bg-blue-600 dark:bg-blue-700 text-white rounded-xl text-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm ${className ?? ''}`}
      aria-label="Open customer portal to manage billing and subscriptions"
    >
      <ExternalLink className="w-5 h-5 mr-2" aria-hidden="true" />
      Customer Portal
    </Link>
  );
}