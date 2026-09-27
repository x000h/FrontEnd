import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: ReactNode;
  icon: ReactNode;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
  accent?: 'navy' | 'green' | 'red' | 'amber';
}

const accentClasses = {
  navy: 'bg-navy-50 text-navy-700',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-600',
  amber: 'bg-amber-50 text-amber-600',
};

export default function StatCard({ title, value, icon, subtitle, trend, accent = 'navy' }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-navy-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1.5">{subtitle}</p>}
          {trend && !subtitle && (
            <p
              className={`text-xs font-medium mt-2 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}
            >
              {trend.value}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${accentClasses[accent]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
