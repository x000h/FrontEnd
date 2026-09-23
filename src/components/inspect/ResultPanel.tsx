import { Inspection } from '../../types/inspection';
import Badge from '../layout/Badge';
import DefectOverlay from './DefectOverlay';

const STATUS_LABEL: Record<string, string> = {
  not_started: '검사 미시작',
  processing: 'AI 추론 중',
  completed: '검사 완료',
  inference_failed: '추론 실패',
  save_failed: '저장 실패',
};

export default function ResultPanel({ inspection, imageUrl }: { inspection: Inspection | null; imageUrl?: string }) {
  const status = inspection?.processStatus ?? 'not_started';
  const judgement = inspection?.judgement ?? 'pending';
  const defects = inspection?.defects ?? [];
  const model = inspection?.modelId ?? '—';

  return (
    <div className="panel result-panel">
      <div className="panel-head">
        <div>
          <div className="eyebrow">PREDICTION RESULT</div>
          <h2>검사 결과</h2>
        </div>
        {status === 'processing' && <span className="processing-pill"><span />처리 중</span>}
      </div>

      <DefectOverlay
        imageWidth={inspection?.imageWidth ?? 640}
        imageHeight={inspection?.imageHeight ?? 640}
        defects={defects}
        imageUrl={imageUrl}
        placeholderOnly={!inspection || status === 'processing'}
      />

      <div className="result-summary">
        <div className={`judgement ${judgement}`}>
          <span className="judgement-icon">{judgement === 'fail' ? '!' : judgement === 'pass' ? '✓' : '·'}</span>
          <div>
            <small>판정</small>
            <strong>{judgement === 'fail' ? '불량 (NG)' : judgement === 'pass' ? '정상 (OK)' : '대기'}</strong>
          </div>
        </div>
        <div className="defect-count"><strong>{defects.length}</strong><span>detections</span></div>
      </div>

      <div className="result-details">
        <div className="result-row"><span>처리상태</span><Badge kind={status === 'completed' ? 'pass' : status === 'processing' ? 'wait' : status.includes('failed') ? 'fail' : 'wait'}>{STATUS_LABEL[status]}</Badge></div>
        <div className="result-row"><span>불량 유형</span><span>{defects.map(d => d.type).join(', ') || '없음'}</span></div>
        <div className="result-row"><span>최고 Confidence</span><span>{defects.length ? `${(Math.max(...defects.map(d => d.confidence)) * 100).toFixed(1)}%` : '—'}</span></div>
        <div className="result-row"><span>사용 모델</span><span>{model}</span></div>
        <div className="result-row"><span>검사시각</span><span>{inspection?.inspectedAt ?? '—'}</span></div>
      </div>

      <div className="result-rule">
        <strong>판정 규칙</strong>
        <span>정상 = DefectDetection 0건 · 불량 = 1건 이상</span>
      </div>
    </div>
  );
}
