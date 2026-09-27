import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Percent,
  ArrowRight,
} from 'lucide-react';
import PageContainer from '@/components/PageContainer';
import StatCard from '@/components/StatCard';
import SectionTitle from '@/components/SectionTitle';

const failRateTrend = [
  { date: '09/14', rate: 6.2 },
  { date: '09/15', rate: 7.1 },
  { date: '09/16', rate: 5.8 },
  { date: '09/17', rate: 8.0 },
  { date: '09/18', rate: 6.9 },
  { date: '09/19', rate: 7.4 },
  { date: '09/20', rate: 6.5 },
];

const defectTypeData = [
  { name: '스크래치', count: 32, color: '#f59e0b' },
  { name: '크랙', count: 21, color: '#dc2626' },
  { name: '외관 손상', count: 18, color: '#8b5cf6' },
  { name: '조립 불량', count: 13, color: '#0891b2' },
  { name: '기타', count: 8, color: '#6b7280' },
];

interface RecentInspection {
  id: string;
  time: string;
  partName: string;
  result: 'pass' | 'fail';
  defectType: string | null;
  confidence: string;
  model: string;
}

const fallbackRecentInspections: RecentInspection[] = [
  { id: '1', time: '2026-09-20 14:32', partName: 'Brake Disc', result: 'pass', defectType: null, confidence: '98.2%', model: 'YOLO' },
  { id: '2', time: '2026-09-20 14:28', partName: 'Engine Part A', result: 'fail', defectType: '스크래치', confidence: '94.7%', model: 'YOLO' },
  { id: '3', time: '2026-09-20 14:21', partName: 'Brake Disc', result: 'pass', defectType: null, confidence: '97.1%', model: 'YOLO' },
  { id: '4', time: '2026-09-20 14:15', partName: 'Engine Part B', result: 'fail', defectType: '크랙', confidence: '91.8%', model: 'YOLO' },
  { id: '5', time: '2026-09-20 14:08', partName: 'Suspension Arm', result: 'pass', defectType: null, confidence: '96.5%', model: 'YOLO' },
  { id: '6', time: '2026-09-20 14:02', partName: 'Door Panel', result: 'fail', defectType: '외관 손상', confidence: '93.3%', model: 'YOLO' },
];

function loadRecentInspections(): RecentInspection[] {
  try {
    const parsed = JSON.parse(localStorage.getItem('inspectionRecords') || '[]') as Partial<RecentInspection>[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 6).map((record) => ({
        id: String(record.id ?? ''),
        time: String(record.time ?? ''),
        partName: String(record.partName ?? '자동차 부품'),
        result: record.result === 'fail' ? 'fail' : 'pass',
        defectType: record.defectType ?? null,
        confidence: String(record.confidence ?? '-'),
        model: String(record.model ?? '-'),
      }));
    }
  } catch {
    // 저장된 이력이 없거나 형식이 다르면 기본 예시를 표시한다.
  }
  return fallbackRecentInspections;
}
export default function Dashboard() {
  const navigate = useNavigate();
  const [recentInspections, setRecentInspections] = useState<RecentInspection[]>(loadRecentInspections);

  useEffect(() => {
    const refreshRecords = () => setRecentInspections(loadRecentInspections());
    window.addEventListener('storage', refreshRecords);
    window.addEventListener('inspectionRecordsUpdated', refreshRecords);
    return () => {
      window.removeEventListener('storage', refreshRecords);
      window.removeEventListener('inspectionRecordsUpdated', refreshRecords);
    };
  }, []);

  const handleRowClick = (record: RecentInspection) => {
    navigate('/history', { state: { focusId: record.id } });
  };

  return (
    <PageContainer>
      {/* 1. KPI 카드 영역 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="전체 검사 건수"
          value="1,248"
          subtitle="전체 누적 검사"
          icon={<ClipboardList className="w-5 h-5" />}
          accent="navy"
        />
        <StatCard
          title="정상"
          value="1,156"
          subtitle="정상 판정"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accent="green"
        />
        <StatCard
          title="불량"
          value="92"
          subtitle="불량 판정"
          icon={<XCircle className="w-5 h-5" />}
          accent="red"
        />
        <StatCard
          title="불량률"
          value="7.4%"
          subtitle="전체 검사 대비"
          icon={<Percent className="w-5 h-5" />}
          accent="amber"
        />
      </div>

      {/* 2 & 3. 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* 불량률 추이 Line Chart */}
        <div className="card p-5 lg:col-span-3">
          <SectionTitle title="기간별 불량률 추이" />
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={failRateTrend} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748b' }}
                domain={[0, 10]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                }}
                
              />
              <Line
                type="monotone"
                dataKey="rate"
                name="불량률"
                stroke="#dc2626"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#dc2626' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 불량 유형별 Bar Chart */}
        <div className="card p-5 lg:col-span-2">
          <SectionTitle title="불량 유형별 발생 현황" />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={defectTypeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="count" name="발생 건수" radius={[4, 4, 0, 0]} barSize={36}>
                {defectTypeData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. 최근 검사 이력 Table */}
      <div className="card overflow-hidden">
        <div className="p-5 pb-3">
          <SectionTitle
            title="최근 검사 이력"
            action={
              <button
                onClick={() => navigate('/history')}
                className="text-sm text-navy-600 hover:text-navy-800 flex items-center gap-1 font-medium"
              >
                전체 보기 <ArrowRight className="w-4 h-4" />
              </button>
            }
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200 text-gray-600">
                <th className="text-left px-5 py-3 font-medium whitespace-nowrap">검사 시간</th>
                <th className="text-left px-5 py-3 font-medium">부품명</th>
                <th className="text-left px-5 py-3 font-medium">검사 결과</th>
                <th className="text-left px-5 py-3 font-medium">불량 유형</th>
                <th className="text-left px-5 py-3 font-medium">신뢰도</th>
                <th className="text-left px-5 py-3 font-medium">사용 모델</th>
              </tr>
            </thead>
            <tbody>
              {recentInspections.map((record) => (
                <tr
                  key={record.id}
                  onClick={() => handleRowClick(record)}
                  className="border-b border-gray-100 hover:bg-navy-50/50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap font-mono">{record.time}</td>
                  <td className="px-5 py-3 font-medium text-navy-900">{record.partName}</td>
                  <td className="px-5 py-3">
                    {record.result === 'pass' ? (
                      <span className="badge-pass">정상</span>
                    ) : (
                      <span className="badge-fail">불량</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{record.defectType ?? '-'}</td>
                  <td className="px-5 py-3 text-gray-600 font-mono">{record.confidence}</td>
                  <td className="px-5 py-3 text-gray-600">{record.model}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
