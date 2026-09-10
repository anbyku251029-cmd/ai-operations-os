import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/canvas (기존 로컬 프로토타입 API 보호 제외)
     * - canvas (기존 로컬 프로토타입 캔버스 보호 제외)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/canvas|canvas|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
