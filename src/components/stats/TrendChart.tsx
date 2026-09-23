interface Point { label: string; defectRate: number }

export default function TrendChart({ trend }: { trend: Point[] }) {
  if (!trend.length) return null;
  const w = 640, h = 180, pad = { top: 18, right: 16, bottom: 30, left: 12 };
  const maxRate = Math.max(...trend.map((t) => t.defectRate), 0.01) * 1.15;
  const stepX = trend.length === 1 ? 0 : (w - pad.left - pad.right) / (trend.length - 1);
  const points = trend.map((t, i) => {
    const x = trend.length === 1 ? w / 2 : pad.left + i * stepX;
    const y = pad.top + (1 - t.defectRate / maxRate) * (h - pad.top - pad.bottom);
    return { x, y, label: t.label, value: t.defectRate };
  });
  return (
    <div className="trend-chart">
      <div className="trend-scale"><span>{(maxRate * 100).toFixed(0)}%</span><span>0%</span></div>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="기간별 불량률 추이">
        {[0, .5, 1].map((r) => <line key={r} x1={pad.left} x2={w - pad.right} y1={pad.top + r * (h-pad.top-pad.bottom)} y2={pad.top + r * (h-pad.top-pad.bottom)} stroke="var(--line)" strokeDasharray="4 5" />)}
        <polyline points={points.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="var(--blue)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p) => <g key={p.label}><circle cx={p.x} cy={p.y} r={4} fill="var(--panel)" stroke="var(--blue)" strokeWidth={2}/><text x={p.x} y={h - 8} textAnchor="middle" fontSize="10" fill="var(--ink-soft)">{p.label}</text></g>)}
      </svg>
    </div>
  );
}
