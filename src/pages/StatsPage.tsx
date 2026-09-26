import { useEffect, useState } from 'react';
import DefectOverlay from '../components/inspect/DefectOverlay';
import Badge from '../components/layout/Badge';
import { Inspection } from '../types/inspection';
import StatCard from '../components/layout/StatCard';
import FilterBar from '../components/stats/FilterBar';
import TrendChart from '../components/stats/TrendChart';
import HistoryTable from '../components/stats/HistoryTable';
import { useInspectionHistory, useInspectionStats } from '../api/inspections';
import { HistoryFilters } from '../types/inspection';

const DEFAULT_FILTERS: HistoryFilters = { periodDays: 30, judgement: 'all', defectType: 'all', partType: 'all' };

export default function StatsPage() {
  const [filters, setFilters] = useState<HistoryFilters>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Inspection | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const { data: stats, isLoading: statsLoading } = useInspectionStats(filters);
  const { data: history, isLoading: historyLoading } = useInspectionHistory(filters);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected]);

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">QUALITY DATA</div>
          <h1>검사이력 · 품질 통계</h1>
        </div>
      </div>

      <div className="filter-shell">
        <div><span className="eyebrow">FILTER</span><strong>조회 조건</strong></div>
        <FilterBar value={filters} onChange={setFilters} />
      </div>

      <div className="stat-row">
        <StatCard value={statsLoading ? '—' : stats!.totalCount.toLocaleString()} label="완료 검사 건수" />
        <StatCard value={statsLoading ? '—' : `${(stats!.defectRate * 100).toFixed(1)}%`} label="불량률" accent="var(--red)" />
        <StatCard value={statsLoading ? '—' : stats!.passCount.toLocaleString()} label="정상" accent="var(--green)" />
        <StatCard value={statsLoading ? '—' : stats!.failCount.toLocaleString()} label="불량" accent="var(--red)" />
      </div>

      <div className="analytics-grid">
        <div className="panel">
          <div className="panel-head"><div><div className="eyebrow">TREND</div><h2>기간별 불량률 추이</h2></div></div>
          {!statsLoading && stats && stats.trend.length > 0 ? <TrendChart trend={stats.trend} /> : <div className="state-msg">선택한 조건에서는 기간별 추이를 표시하지 않습니다.</div>}
        </div>
        <div className="panel">
          <div className="panel-head"><div><div className="eyebrow">DEFECT ANALYSIS</div><h2>불량 유형별 빈도</h2></div></div>
          <div className="bar-list">
            {(stats?.defectTypeCounts ?? []).map((item) => {
              const max = Math.max(...(stats?.defectTypeCounts ?? []).map(x => x.count), 1);
              return <div className="bar-item" key={item.type}><div><span>{item.type}</span><strong>{item.count}</strong></div><div className="bar-track"><span style={{ width: `${item.count / max * 100}%` }} /></div></div>;
            })}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div><div className="eyebrow">PART ANALYSIS</div><h2>부품 유형별 검사 건수</h2></div></div>
          <div className="bar-list">
            {(stats?.partTypeCounts ?? []).map((item) => {
              const max = Math.max(...(stats?.partTypeCounts ?? []).map(x => x.count), 1);
              return <div className="bar-item" key={item.type}><div><span>{item.type}</span><strong>{item.count}</strong></div><div className="bar-track"><span style={{ width: `${item.count / max * 100}%` }} /></div></div>;
            })}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><div><div className="eyebrow">HISTORY</div><h2>검사이력</h2></div><span className="subtle-chip">{history?.length ?? 0} records</span></div>
        {historyLoading ? <div className="state-msg">불러오는 중...</div> : <HistoryTable rows={history ?? []} onSelect={(row) => { setSelected(row); setShowHeatmap(true); }} />}
      </div>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal-panel panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-head">
              <div><div className="eyebrow">INSPECTION DETAIL</div><h2>{selected.id}</h2></div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {selected.defects.length > 0 && (
                  <button className="ghost" onClick={() => setShowHeatmap((v) => !v)}>
                    {showHeatmap ? '판정 근거 숨기기' : '판정 근거 보기'}
                  </button>
                )}
                <button className="icon-button" onClick={() => setSelected(null)}>×</button>
              </div>
            </div>
            <div className="detail-grid">
              <DefectOverlay imageWidth={selected.imageWidth} imageHeight={selected.imageHeight} defects={selected.defects} showHeatmap={showHeatmap} />
              <div className="detail-fields">
                <div className="detail-result">{selected.judgement === 'fail' ? <Badge kind="fail">불량 (NG)</Badge> : <Badge kind="pass">정상 (OK)</Badge>}</div>
                <div className="result-row"><span>검사시각</span><span>{selected.inspectedAt}</span></div>
                <div className="result-row"><span>사용 모델</span><span>{selected.modelId}</span></div>
                <div className="result-row"><span>탐지 건수</span><span>{selected.defects.length}</span></div>
                {selected.defects.map((d, i) => <div className="detection-card" key={i}><strong>{d.type}</strong><span>Confidence {(d.confidence * 100).toFixed(1)}%</span><small>bbox [{d.bbox.join(', ')}]</small></div>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
