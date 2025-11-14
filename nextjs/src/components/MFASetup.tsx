import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createSPASassClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Factor } from "@supabase/auth-js";
import { MFAEnrollTOTPParams } from '@supabase/auth-js';

interface MFASetupProps {
    onStatusChange?: () => void;
}

interface FactorItemProps {
    factor: Factor;
    onUnenroll: (factorId: string) => void;
    actionInProgress: boolean;
}

// Memoizovana komponenta za prikaz faktora
const FactorItem = React.memo(({ factor, onUnenroll, actionInProgress }: FactorItemProps) => {
    const statusIcon = useMemo(() => 
        factor.status === 'verified' ? (
            <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
        ) : (
            <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
        ),
        [factor.status]
    );

    const formattedDate = useMemo(() => 
        new Date(factor.created_at).toLocaleDateString(),
        [factor.created_at]
    );

    return (
        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
                {statusIcon}
                <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                        {factor.friendly_name || 'Authenticator App'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Added on {formattedDate}
                    </p>
                </div>
            </div>
            <button
                onClick={() => onUnenroll(factor.id)}
                disabled={actionInProgress}
                className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 transition-colors"
            >
                Remove
            </button>
        </div>
    );
});

FactorItem.displayName = 'FactorItem';

export function MFASetup({ onStatusChange }: MFASetupProps) {
    const [factors, setFactors] = useState<Factor[]>([]);
    const [step, setStep] = useState<'list' | 'name' | 'enroll'>('list');
    const [factorId, setFactorId] = useState('');
    const [qr, setQR] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [friendlyName, setFriendlyName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionInProgress, setActionInProgress] = useState(false);

    // Memoizovani supabase klijent
    const getSupabaseClient = useCallback(async () => {
        const supabase = await createSPASassClient();
        return supabase.getSupabaseClient();
    }, []);

    // Memoizovana funkcija za fetch faktora
    const fetchFactors = useCallback(async () => {
        try {
            const client = await getSupabaseClient();
            const { data, error } = await client.auth.mfa.listFactors();

            if (error) throw error;

            setFactors(data.all || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching MFA factors:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch MFA status');
            setLoading(false);
        }
    }, [getSupabaseClient]);

    useEffect(() => {
        fetchFactors();
    }, [fetchFactors]);

    // Memoizovana funkcija za resetovanje enrollmenta
    const resetEnrollment = useCallback(() => {
        setStep('list');
        setFactorId('');
        setQR('');
        setVerifyCode('');
        setFriendlyName('');
        setError('');
    }, []);

    // Memoizovana funkcija za početak enrollmenta
    const startEnrollment = useCallback(async () => {
        if (!friendlyName.trim()) {
            setError('Please provide a name for this authentication method');
            return;
        }

        setError('');
        setActionInProgress(true);

        try {
            const client = await getSupabaseClient();
            const enrollParams: MFAEnrollTOTPParams = {
                factorType: 'totp',
                friendlyName: friendlyName.trim()
            };

            const { data, error } = await client.auth.mfa.enroll(enrollParams);

            if (error) throw error;

            setFactorId(data.id);
            setQR(data.totp.qr_code);
            setStep('enroll');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start MFA enrollment');
            setStep('name');
        } finally {
            setActionInProgress(false);
        }
    }, [friendlyName, getSupabaseClient]);

    // Memoizovana funkcija za verifikaciju faktora
    const verifyFactor = useCallback(async () => {
        setError('');
        setActionInProgress(true);

        try {
            const client = await getSupabaseClient();

            const challenge = await client.auth.mfa.challenge({ factorId });
            if (challenge.error) throw challenge.error;

            const verify = await client.auth.mfa.verify({
                factorId,
                challengeId: challenge.data.id,
                code: verifyCode
            });
            if (verify.error) throw verify.error;

            await fetchFactors();
            resetEnrollment();
            onStatusChange?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to verify MFA code');
        } finally {
            setActionInProgress(false);
        }
    }, [factorId, verifyCode, getSupabaseClient, fetchFactors, resetEnrollment, onStatusChange]);

    // Memoizovana funkcija za unenroll faktora
    const unenrollFactor = useCallback(async (unenrollFactorId: string) => {
        setError('');
        setActionInProgress(true);

        try {
            const client = await getSupabaseClient();
            const { error } = await client.auth.mfa.unenroll({ factorId: unenrollFactorId });

            if (error) throw error;

            await fetchFactors();
            onStatusChange?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to unenroll MFA factor');
        } finally {
            setActionInProgress(false);
        }
    }, [getSupabaseClient, fetchFactors, onStatusChange]);

    // Memoizovani handleri za input promjene
    const handleFriendlyNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFriendlyName(e.target.value);
    }, []);

    const handleVerifyCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setVerifyCode(e.target.value.trim());
    }, []);

    const handleSetStep = useCallback((newStep: 'list' | 'name' | 'enroll') => {
        setStep(newStep);
    }, []);

    // Memoizovani loading komponent
    const loadingComponent = useMemo(() => (
        <Card>
            <CardContent className="flex justify-center items-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-gray-400" />
            </CardContent>
        </Card>
    ), []);

    // Memoizovani error alert
    const errorAlert = useMemo(() => 
        error ? (
            <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <AlertDescription className="text-red-800 dark:text-red-200">
                    {error}
                </AlertDescription>
            </Alert>
        ) : null,
        [error]
    );

    // Memoizovani faktor lista
    const factorsList = useMemo(() => 
        factors.length > 0 && step === 'list' ? (
            <div className="space-y-4">
                {factors.map((factor) => (
                    <FactorItem
                        key={factor.id}
                        factor={factor}
                        onUnenroll={unenrollFactor}
                        actionInProgress={actionInProgress}
                    />
                ))}
            </div>
        ) : null,
        [factors, step, unenrollFactor, actionInProgress]
    );

    // Memoizovani name step
    const nameStep = useMemo(() => 
        step === 'name' ? (
            <div className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="friendly-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Device Name
                    </label>
                    <input
                        id="friendly-name"
                        type="text"
                        value={friendlyName}
                        onChange={handleFriendlyNameChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 transition-colors"
                        placeholder="e.g., Work Phone, Personal iPhone"
                        autoFocus
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Give this authentication method a name to help you identify it later
                    </p>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={resetEnrollment}
                        disabled={actionInProgress}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={startEnrollment}
                        disabled={actionInProgress || !friendlyName.trim()}
                        className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                    >
                        {actionInProgress ? 'Processing...' : 'Continue'}
                    </button>
                </div>
            </div>
        ) : null,
        [step, friendlyName, actionInProgress, handleFriendlyNameChange, resetEnrollment, startEnrollment]
    );

    // Memoizovani enroll step
    const enrollStep = useMemo(() => 
        step === 'enroll' ? (
            <div className="space-y-4">
                <div className="flex justify-center">
                    {qr && (
                        <img
                            src={qr}
                            alt="QR Code"
                            className="w-48 h-48 border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800"
                        />
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="verify-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Verification Code
                    </label>
                    <input
                        id="verify-code"
                        type="text"
                        value={verifyCode}
                        onChange={handleVerifyCodeChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 transition-colors"
                        placeholder="Enter code from your authenticator app"
                    />
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={resetEnrollment}
                        disabled={actionInProgress}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={verifyFactor}
                        disabled={actionInProgress || verifyCode.length === 0}
                        className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                    >
                        {actionInProgress ? 'Verifying...' : 'Verify'}
                    </button>
                </div>
            </div>
        ) : null,
        [step, qr, verifyCode, actionInProgress, handleVerifyCodeChange, resetEnrollment, verifyFactor]
    );

    // Memoizovani list step
    const listStep = useMemo(() => 
        step === 'list' ? (
            <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {factors.length === 0
                        ? 'Protect your account with two-factor authentication. When enabled, you\'ll need to enter a code from your authenticator app in addition to your password when signing in.'
                        : 'You can add additional authentication methods or remove existing ones.'}
                </p>
                <button
                    onClick={() => handleSetStep('name')}
                    disabled={actionInProgress}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                >
                    {actionInProgress ? 'Processing...' : 'Add New Authentication Method'}
                </button>
            </div>
        ) : null,
        [step, factors.length, actionInProgress, handleSetStep]
    );

    if (loading) {
        return loadingComponent;
    }

    return (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Key className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    Two-Factor Authentication (2FA)
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                    Add an additional layer of security to your account
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {errorAlert}
                {factorsList}
                {nameStep}
                {enrollStep}
                {listStep}
            </CardContent>
        </Card>
    );
}

export default React.memo(MFASetup);