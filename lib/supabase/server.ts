import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase 환경 변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL 및 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인하세요.'
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component 내에서 호출된 경우 set 쿠키 오류 무시 (middleware에서 처리)
        }
      },
    },
  });
}
