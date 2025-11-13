'use client';

import React from 'react';

export default function LegalPage() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Legal Documents
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                    Select a document from the sidebar to view its contents.
                </p>
            </div>
        </div>
    );
}