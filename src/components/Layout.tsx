import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

const pageMeta: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: 'Dashboard', subtitle: '자동차 부품 품질검사 현황을 한눈에 확인합니다.' },
  '/inspection': { title: '품질검사', subtitle: '라인 검사 또는 개발·테스트용 이미지 업로드를 선택합니다.' },
  '/history': { title: '검사이력', subtitle: '과거 품질검사 결과를 조회하고 상세 내용을 확인합니다.' },
  '/statistics': { title: '품질통계', subtitle: '기간별 품질 지표 및 불량 분석' },
  '/models': { title: 'AI 모델 관리', subtitle: 'AI 검사 모델 버전 및 성능 관리' },
};

export default function Layout() {
  const location = useLocation();
  const meta = pageMeta[location.pathname] ?? { title: '자동차 부품 품질검사 시스템' };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={meta.title} subtitle={meta.subtitle} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
