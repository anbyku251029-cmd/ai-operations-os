import { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata: Metadata = {
  title: '로그인 - AI Operations OS',
  description: 'OPS Blueprint 워크스페이스에 로그인하세요.',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}
