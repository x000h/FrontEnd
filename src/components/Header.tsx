import { Circle, Bell, ChevronDown } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        <h2 className="text-lg font-bold text-navy-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
          <Circle className="w-2.5 h-2.5 fill-green-500 text-green-500" />
          <span className="text-xs font-medium text-green-700">시스템 정상</span>
        </div>

        <button className="relative p-2 text-gray-500 hover:text-navy-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
          <div className="w-9 h-9 rounded-full bg-navy-700 flex items-center justify-center text-white text-sm font-semibold">
            관
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-navy-900">관리자</p>
            <p className="text-xs text-gray-500">admin@factory.com</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </header>
  );
}
