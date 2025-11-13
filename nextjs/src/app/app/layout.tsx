// src/app/app/layout.tsx
import AppLayout from '@/components/AppLayout';
import { GlobalProvider } from '@/lib/context/GlobalContext';
import { ThemeProvider } from 'next-themes';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <GlobalProvider>
                <AppLayout>{children}</AppLayout>
            </GlobalProvider>
        </ThemeProvider>
    );
}