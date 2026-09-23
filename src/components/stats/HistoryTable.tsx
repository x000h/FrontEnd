import { Inspection } from '../../types/inspection';
import Badge from '../layout/Badge';

export default function HistoryTable({ rows, onSelect }: { rows: Inspection[]; onSelect?: (row: Inspection) => void }) {
  if (rows.length === 0) return <div className="state-msg">조건에 맞는 완료 검사이력이 없습니다.</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>검사 ID</th><th>검사시각</th><th>판정</th><th>부품 유형</th><th>불량 유형</th><th>사용 모델</th><th /></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={onSelect ? 'clickable' : ''} onClick={() => onSelect?.(r)}>
              <td><code>{r.id}</code></td><td>{r.inspectedAt}</td>
              <td>{r.judgement === 'fail' ? <Badge kind="fail" /> : <Badge kind="pass" />}</td>
              <td>{r.partType}</td><td>{r.defects.length ? r.defects.map(d => d.type).join(', ') : '—'}</td>
              <td>{r.modelId === 'swin-t-v1.3' ? 'Swin-T + FPN v1.3' : r.modelId}</td><td>{onSelect && <span className="row-arrow">→</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
