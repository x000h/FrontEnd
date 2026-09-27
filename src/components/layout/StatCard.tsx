export default function StatCard({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return (
    <div className="stat-card">
      <div className="num" style={accent ? { color: accent } : undefined}>{value}</div>
      <div className="lbl">{label}</div>
    </div>
  );
}
