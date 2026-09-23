import type { ReactNode } from 'react';
type BadgeKind = 'pass' | 'fail' | 'wait';

const LABELS: Record<BadgeKind, string> = {
  pass: '정상',
  fail: '불량',
  wait: '대기 중',
};

export default function Badge({ kind, children }: { kind: BadgeKind; children?: ReactNode }) {
  return (
    <span className={`badge ${kind}`}>
      <span className="dot" />
      {children ?? LABELS[kind]}
    </span>
  );
}
