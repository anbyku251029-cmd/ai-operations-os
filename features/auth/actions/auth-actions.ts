'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginSchema, signupSchema } from '../schemas/auth-schema';

export type AuthActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
};

export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const validated = loginSchema.safeParse({ email, password });
  if (!validated.success) {
    return {
      error: validated.error.issues[0]?.message || '입력값이 올바르지 않습니다.',
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  });

  if (error) {
    // 보안을 고려한 안전한 사용자 친화적 에러 메시지
    if (error.message.includes('Invalid login credentials')) {
      return { error: '이메일 또는 비밀번호가 일치하지 않습니다.' };
    }
    return { error: '로그인 중 오류가 발생했습니다. 다시 시도해 주세요.' };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signupAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  const validated = signupSchema.safeParse({
    email,
    password,
    confirmPassword,
  });

  if (!validated.success) {
    return {
      error: validated.error.issues[0]?.message || '입력값이 올바르지 않습니다.',
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
  });

  if (error) {
    if (error.message.includes('User already registered')) {
      return { error: '이미 등록된 이메일 계정입니다.' };
    }
    return { error: '회원가입 처리 중 오류가 발생했습니다. 다시 시도해 주세요.' };
  }

  // 이메일 인증이 활성화되어 세션이 즉시 생성되지 않은 경우 대응
  if (data.user && !data.session) {
    return {
      success: true,
      message: '가입 인증 메일이 발송되었습니다. 이메일을 확인해 주세요.',
    };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
