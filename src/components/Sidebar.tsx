import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanSearch,
  History,
  BarChart3,
  Cpu,
  Car,
} from 'lucide-react';

const menuItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/inspection', label: '품질검사', icon: ScanSearch },
  { to: '/history', label: '검사이력', icon: History },
  { to: '/statistics', label: '품질통계', icon: BarChart3 },
  { to: '/models', label: 'AI 모델 관리', icon: Cpu },
];

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-navy-900 text-navy-100 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-navy-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-navy-700 flex items-center justify-center">
            <Car className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              자동차 부품
              <br />
              품질검사 시스템
            </h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-navy-700 text-white'
                    : 'text-navy-300 hover:bg-navy-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-navy-800">
        <div className="flex items-center gap-2 text-xs text-navy-400">
          <Cpu className="w-3.5 h-3.5" />
          <span>AI 기반 자동차 부품 품질검사 시스템</span>
        </div>
      </div>
    </aside>
  );
}
