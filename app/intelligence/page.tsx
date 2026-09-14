import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppHeader } from '@/components/layout/AppHeader';
import { getOperationsIntelligenceAnalysis } from '@/features/intelligence/services/intelligence-service';
import { IntelligenceDashboard } from '@/features/intelligence/components/IntelligenceDashboard';

export const metadata: Metadata = {
  title: '운영 인텔리전스 - AI Operations OS',
  description: '조직 워크플로우의 운영 시간, 비용, 담당자 부하 및 룰 기반 병목 분석',
};

export default async function IntelligencePage() {
  // 1. 서버 세션 인증 검증 (인증 가드)
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 환경 변수가 설정된 상태에서 미인증 사용자 접근 시 로그인으로 보호 리다이렉트
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !user) {
      redirect('/login');
    }
  } catch {
    // 환경 변수 미설정 로컬 프로토타입 환경에서는 통과 허용
  }

  // 2. 전체 운영 인텔리전스 데이터 분석 수행
  let bundle;
  try {
    bundle = await getOperationsIntelligenceAnalysis();
  } catch (err) {
    console.error('[IntelligencePage] Error fetching intelligence:', err);
    bundle = {
      overview: {
        totalWorkflows: 0,
        totalTimeMinutes: 0,
        totalCostAmount: 0,
        bottleneckCount: 0,
        totalNodes: 0,
      },
      workflows: [],
      bottlenecks: [],
      ownerLoads: [],
      toolUsages: [],
      priorities: [],
      analyzedAt: new Date().toISOString(),
    };
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AppHeader />

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <IntelligenceDashboard initialBundle={bundle} />
      </main>
    </div>
  );
}
