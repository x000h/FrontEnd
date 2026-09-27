import { CandidateModel, NFR_THRESHOLDS } from '../../types/model';
import Badge from '../layout/Badge';

export default function SelectionStatusPanel({ applied }: { applied: CandidateModel | undefined }) {
  return (
    <div className="grid2">
      <div className="panel">
        <div className="panel-head"><div><div className="eyebrow">SELECTION RULE</div><h2>운영 모델 선정 원칙</h2></div></div>
        <div className="result-row"><span>탐지 성능 기준</span><span>Recall ≥ {NFR_THRESHOLDS.minRecall * 100}%, Precision ≥ {NFR_THRESHOLDS.minPrecision * 100}%</span></div>
        <div className="result-row"><span>처리·자원 기준</span><span>p95 ≤ {NFR_THRESHOLDS.maxP95LatencyMs}ms, GPU ≤ {NFR_THRESHOLDS.maxGpuMemoryGb}GB</span></div>
        <div className="result-row"><span>우선 지표</span><span>Recall (FN 최소화 우선)</span></div>
        <div className="result-row"><span>보조 지표</span><span>p95 지연 · GPU 메모리 · Precision</span></div>
        <div className="result-row"><span>Swin-T 비고</span><span>FPN 결합 탐지 모델 구현·검증</span></div>
      </div>
      <div className="panel">
        <div className="panel-head"><div><div className="eyebrow">OPERATING MODEL</div><h2>현재 적용 상태</h2></div><Badge kind={applied ? 'pass' : 'wait'}>{applied ? 'ACTIVE' : 'PENDING'}</Badge></div>
        <div className="result-row"><span>적용 모델</span><span>{applied?.name ?? '미선정'}</span></div>
        <div className="result-row"><span>버전</span><span>{applied?.id ?? '—'}</span></div>
        <div className="result-row"><span>적용 확인</span><span>{applied ? '연동·추론 확인됨' : '선정 대기'}</span></div>
        <div className="result-row"><span>선정 근거</span><span>{applied ? '요구조건 충족 후 Recall 우선 + 속도·자원 비교' : '—'}</span></div>
      </div>
    </div>
  );
}
