import { Metadata } from 'next';
import { SignupForm } from '@/features/auth/components/SignupForm';

export const metadata: Metadata = {
  title: '회원가입 - AI Operations OS',
  description: '새로운 OPS Blueprint 계정을 생성하세요.',
};

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <SignupForm />
      </div>
    </main>
  );
}
