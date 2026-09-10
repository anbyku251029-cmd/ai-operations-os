import { redirect } from 'next/navigation';

// 루트 접속 시 즉시 캔버스 워크스페이스로 리다이렉트
export default function Home() {
  redirect('/canvas');
}
