import { CandidateModel, NFR_THRESHOLDS } from '../../types/model';

export default function ModelCompareTable({
  models,
  onSelect,
  selectingId,
}: {
  models: CandidateModel[];
  onSelect: (id: string) => void;
  selectingId?: string;
}) {
  return (
    <div className="panel" style={{ overflowX: 'auto', marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 10 }}>
        탐지 성능 기준: Recall ≥ {NFR_THRESHOLDS.minRecall * 100}%, Precision ≥ {NFR_THRESHOLDS.minPrecision * 100}% (FN 최소화 우선)
        {' · '}
        처리·자원 기준: 이미지 처리 p95 ≤ {NFR_THRESHOLDS.maxP95LatencyMs}ms, 최대 GPU 메모리 ≤ {NFR_THRESHOLDS.maxGpuMemoryGb}GB
      </div>
      <table className="mtable">
        <thead>
          <tr>
            <th>모델</th>
            <th>Recall</th>
            <th>Precision</th>
            <th>mAP@0.5</th>
            <th>p95 지연</th>
            <th>GPU 메모리</th>
            <th>요구조건 충족</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m) => (
            <tr key={m.id}>
              <td>
                {m.name}
                {m.note && <span style={{ color: 'var(--ink-soft)', fontSize: 11, marginLeft: 6 }}>({m.note})</span>}
                {m.isApplied && <span className="selected-tag">운영 적용</span>}
              </td>
              <td>{(m.metrics.recall * 100).toFixed(1)}%</td>
              <td>{(m.metrics.precision * 100).toFixed(1)}%</td>
              <td>{m.metrics.map50.toFixed(3)}</td>
              <td>{m.metrics.p95LatencyMs}ms</td>
              <td>{m.metrics.gpuMemoryGb}GB</td>
              <td>
                {m.nfrStatus === 'met' ? (
                  <span className="check">충족</span>
                ) : (
                  <span className="cross">미충족 ({m.unmetReason})</span>
                )}
              </td>
              <td>
                {m.isApplied ? (
                  <button className="ghost" disabled>선정됨</button>
                ) : m.nfrStatus === 'unmet' ? (
                  <button className="ghost" disabled>선정 보류</button>
                ) : (
                  <button className="primary" disabled={selectingId === m.id} onClick={() => onSelect(m.id)}>
                    {selectingId === m.id ? '적용 중...' : '운영 모델로 선정'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
