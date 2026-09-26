import { DEFECT_TYPES, PART_TYPES, HistoryFilters } from '../../types/inspection';

export default function FilterBar({ value, onChange }: { value: HistoryFilters; onChange: (f: HistoryFilters) => void }) {
  return (
    <div className="filters">
      <select
        value={value.periodDays}
        onChange={(e) => {
          const v = e.target.value;
          if (v === 'custom') {
            onChange({ ...value, periodDays: 'custom' });
          } else {
            onChange({ ...value, periodDays: Number(v) as 7 | 30 | 9999, startDate: undefined, endDate: undefined });
          }
        }}
      >
        <option value={7}>기간: 최근 7일</option>
        <option value={30}>최근 30일</option>
        <option value={9999}>전체</option>
        <option value="custom">기간 직접 선택</option>
      </select>

      {value.periodDays === 'custom' && (
        <span className="date-range">
          <input
            type="date"
            value={value.startDate ?? ''}
            max={value.endDate || undefined}
            onChange={(e) => onChange({ ...value, startDate: e.target.value || undefined })}
          />
          <span className="date-range-sep">~</span>
          <input
            type="date"
            value={value.endDate ?? ''}
            min={value.startDate || undefined}
            onChange={(e) => onChange({ ...value, endDate: e.target.value || undefined })}
          />
        </span>
      )}

      <select value={value.judgement} onChange={(e) => onChange({ ...value, judgement: e.target.value as HistoryFilters['judgement'] })}>
        <option value="all">판정: 전체</option>
        <option value="fail">불량만</option>
        <option value="pass">정상만</option>
      </select>
      <select value={value.partType} onChange={(e) => onChange({ ...value, partType: e.target.value })}>
        <option value="all">부품 유형: 전체</option>
        {PART_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
      </select>
      <select value={value.defectType} onChange={(e) => onChange({ ...value, defectType: e.target.value })}>
        <option value="all">불량 유형: 전체</option>
        {DEFECT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
      </select>
    </div>
  );
}
