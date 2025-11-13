'use client';

import React from 'react';
import LegalDocument from '@/components/LegalDocument';
import { notFound } from 'next/navigation';

const legalDocuments = {
    'privacy': {
        title: 'Privacy Notice',
        path: '/terms/privacy-notice.md'
    },
    'terms': {
        title: 'Terms of Service',
        path: '/terms/terms-of-service.md'
    },
    'refund': {
        title: 'Refund Policy',
        path: '/terms/refund-policy.md'
    }
} as const;

type LegalDocumentType = keyof typeof legalDocuments;

interface LegalPageProps {
    params: Promise<{
        document: LegalDocumentType;
    }>;
}

export default function LegalPage({ params }: LegalPageProps) {
    // Properly unwrap the params Promise using React.use()
    const unwrappedParams = React.use(params);
    const { document } = unwrappedParams;

    if (!legalDocuments[document]) {
        notFound();
    }

    const { title, path } = legalDocuments[document];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <LegalDocument
                title={title}
                filePath={path}
            />
        </div>
    );
}