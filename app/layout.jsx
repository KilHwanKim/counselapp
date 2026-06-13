import '@/css/lessons.css';
import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata = {
    title: '상담 관리자',
    description: 'counselapp admin',
};

export default function RootLayout({ children }) {
    return (
        <html lang="ko">
            <body className="h-screen overflow-hidden">
                <AppShell>{children}</AppShell>
            </body>
        </html>
    );
}
