import { useNavigate } from 'react-router-dom';
import StatCard from '../components/layout/StatCard';
import Badge from '../components/layout/Badge';
import TrendChart from '../components/stats/TrendChart';
import HistoryTable from '../components/stats/HistoryTable';
import { useInspectionHistory, useInspectionStats } from '../api/inspections';
import { useCandidateModels } from '../api/models';
import { HistoryFilters } from '../types/inspection';

const RECENT_FILTERS: HistoryFilters = { periodDays: 7, judgement: 'all', defectType: 'all', partType: 'all' };

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useInspectionStats(RECENT_FILTERS);
  const { data: history, isLoading: historyLoading } = useInspectionHistory(RECENT_FILTERS);
  const { data: models } = useCandidateModels();
  const appliedModel = models?.find((m) => m.isApplied);

  return (
    <>
      <div className="page-heading">
        <div><div className="eyebrow">PROJECT OVERVIEW</div><h1>자동차 부품 품질검사</h1><p className="lede">검사 결과와 프로젝트 상태를 확인합니다.</p></div>
        <button className="primary" onClick={() => navigate('/inspect')}>+ 새 검사</button>
      </div>

      <div className="stat-row">
        <StatCard value={statsLoading ? '—' : stats!.totalCount.toLocaleString()} label="완료 검사 · 최근 7일" />
        <StatCard value={statsLoading ? '—' : `${(stats!.defectRate * 100).toFixed(1)}%`} label="불량률" accent="var(--red)" />
        <StatCard value={statsLoading ? '—' : stats!.topDefectType} label="최다 불량 유형" />
        <StatCard value={appliedModel?.name ?? '—'} label="운영 모델" />
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-head"><div><div className="eyebrow">QUALITY TREND</div><h2>불량률 추이</h2></div><span className="subtle-chip">최근 7일</span></div>
          {!statsLoading && stats && <TrendChart trend={stats.trend} />}
        </div>
        <div className="panel model-status">
          <div className="panel-head"><div><div className="eyebrow">DEPLOYED MODEL</div><h2>운영 모델</h2></div><Badge kind={appliedModel ? 'pass' : 'wait'}>{appliedModel ? '연동 정상' : '선정 필요'}</Badge></div>
          <div className="model-name">{appliedModel?.name ?? '미선정'}</div>
          <div className="result-row"><span>NFR-01·02</span><span>{appliedModel?.nfrStatus === 'met' ? '충족' : '—'}</span></div>
          <div className="result-row"><span>Recall</span><span>{appliedModel ? `${(appliedModel.metrics.recall * 100).toFixed(1)}%` : '—'}</span></div>
          <button className="ghost full" onClick={() => navigate('/models')}>모델 비교 및 적용 상태 보기 →</button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><div><div className="eyebrow">RECENT INSPECTIONS</div><h2>최근 검사 이력</h2></div><button className="link-button" onClick={() => navigate('/stats')}>전체 보기 →</button></div>
        {historyLoading ? <div className="state-msg">불러오는 중...</div> : <HistoryTable rows={(history ?? []).slice(0, 5)} />}
      </div>
    </>
  );
}
