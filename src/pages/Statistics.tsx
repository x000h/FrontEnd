import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { Calendar, TrendingDown, TrendingUp, Download } from 'lucide-react';
import PageContainer from '@/components/PageContainer';
import StatCard from '@/components/StatCard';
import SectionTitle from '@/components/SectionTitle';

import { PART_CATEGORIES } from '@/types';

const periodOptions = [
  { key: 'week', label: '주간' },
  { key: 'month', label: '월간' },
  { key: 'quarter', label: '분기' },
];



export default function Statistics() {
  const [period, setPeriod] = useState('week');

  const [records, setRecords] = useState<any[]>([]);


  useEffect(() => {
    const refreshRecords = () => {
      try {
        const savedRecords = JSON.parse(localStorage.getItem('inspectionRecords') || '[]');
        setRecords(Array.isArray(savedRecords) ? savedRecords : []);
      } catch {
        setRecords([]);
      }
    };

    refreshRecords();
    window.addEventListener('storage', refreshRecords);
    window.addEventListener('inspectionRecordsUpdated', refreshRecords);
    return () => {
      window.removeEventListener('storage', refreshRecords);
      window.removeEventListener('inspectionRecordsUpdated', refreshRecords);
    };
  }, []);

  const now = new Date();

  const filteredRecords = records.filter((record) => {
    const recordDate = new Date(record.time);

    if (period === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);

      return recordDate >= weekAgo && recordDate <= now;
    }

    if (period === 'month') {
      return (
        recordDate.getFullYear() === now.getFullYear() &&
        recordDate.getMonth() === now.getMonth()
      );
    }

    if (period === 'quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);

      return (
        recordDate.getFullYear() === now.getFullYear() &&
        Math.floor(recordDate.getMonth() / 3) === currentQuarter
      );
    }

    return true;
  });

  const totalPass = filteredRecords.filter(
    (r) => r.result === 'pass'
  ).length;

  const totalFail = filteredRecords.filter(
    (r) => r.result === 'fail'
  ).length;

  const totalRecords = filteredRecords.length;

  const categoryStats = PART_CATEGORIES.map((cat) => {
    const categoryRecords = filteredRecords.filter(
      (record) => record.category === cat.key
    );

    const passCount = categoryRecords.filter(
      (record) => record.result === 'pass'
    ).length;

    const failCount = categoryRecords.filter(
      (record) => record.result === 'fail'
    ).length;

    return {
      name: cat.label,
      pass: passCount,
      fail: failCount,
      total: categoryRecords.length,
      passRate:
        categoryRecords.length > 0
          ? Math.round((passCount / categoryRecords.length) * 1000) / 10
          : 0,
    };
  });
  const monthlyTrend = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();

    // 최근 6개월을 계산
    date.setMonth(date.getMonth() - (5 - index));

    const year = date.getFullYear();
    const month = date.getMonth();

    const monthRecords = records.filter((record) => {
      const recordDate = new Date(record.time);

      return (
        recordDate.getFullYear() === year &&
        recordDate.getMonth() === month
      );
    });

    const passCount = monthRecords.filter(
      (record) => record.result === 'pass'
    ).length;

    const failCount = monthRecords.filter(
      (record) => record.result === 'fail'
    ).length;

    const total = monthRecords.length;

    return {
      label: `${month + 1}월`,
      passRate: total > 0
        ? Math.round((passCount / total) * 1000) / 10
        : 0,
      failRate: total > 0
        ? Math.round((failCount / total) * 1000) / 10
        : 0,
    };
  });

  const quarterlyTrend = Array.from({ length: 4 }, (_, index) => {
    const now = new Date();

    // 최근 4개 분기
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const quarterOffset = 3 - index;

    const targetQuarter = currentQuarter - quarterOffset;

    const quarterDate = new Date(
      now.getFullYear(),
      targetQuarter * 3,
      1
    );

    const year = quarterDate.getFullYear();
    const quarter = Math.floor(quarterDate.getMonth() / 3);

    const quarterRecords = records.filter((record) => {
      const recordDate = new Date(record.time);

      return (
        recordDate.getFullYear() === year &&
        Math.floor(recordDate.getMonth() / 3) === quarter
      );
    });

    const passCount = quarterRecords.filter(
      (record) => record.result === 'pass'
    ).length;

    const failCount = quarterRecords.filter(
      (record) => record.result === 'fail'
    ).length;

    const total = quarterRecords.length;

    return {
      label: `${year}년 ${quarter + 1}분기`,
      passRate:
        total > 0
          ? Math.round((passCount / total) * 1000) / 10
          : 0,
      failRate:
        total > 0
          ? Math.round((failCount / total) * 1000) / 10
          : 0,
    };
  });

  const weeklyData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));

    const dateKey = date.toISOString().slice(0, 10);

    const dayRecords = records.filter((record) => {
      const recordDate = new Date(record.time)
        .toISOString()
        .slice(0, 10);

      return recordDate === dateKey;
    });

    return {
      day: `${date.getMonth() + 1}/${date.getDate()}`,
      pass: dayRecords.filter((record) => record.result === 'pass').length,
      fail: dayRecords.filter((record) => record.result === 'fail').length,
    };
  });

  const weeklyTrend = weeklyData.map((day) => {
    const total = day.pass + day.fail;

    return {
      label: day.day,
      passRate:
        total > 0
          ? Math.round((day.pass / total) * 1000) / 10
          : 0,
      failRate:
        total > 0
          ? Math.round((day.fail / total) * 1000) / 10
          : 0,
    };
  });

  const inspectionVolumeData =
    period === 'week'
      ? weeklyData
      : period === 'month'
        ? Array.from(
          {
            length: new Date().getDate(),
          },
          (_, index) => {
            const now = new Date();
            const date = new Date(
              now.getFullYear(),
              now.getMonth(),
              index + 1
            );

            const dateKey = date.toISOString().slice(0, 10);

            const dayRecords = records.filter((record) => {
              const recordDate = new Date(record.time)
                .toISOString()
                .slice(0, 10);

              return recordDate === dateKey;
            });

            return {
              day: `${date.getMonth() + 1}/${date.getDate()}`,
              pass: dayRecords.filter(
                (record) => record.result === 'pass'
              ).length,
              fail: dayRecords.filter(
                (record) => record.result === 'fail'
              ).length,
            };
          })
        : Array.from({ length: 3 }, (_, index) => {
          const now = new Date();

          const currentQuarter = Math.floor(now.getMonth() / 3);
          const quarterStartMonth = currentQuarter * 3;

          const monthDate = new Date(
            now.getFullYear(),
            quarterStartMonth + index,
            1
          );

          const year = monthDate.getFullYear();
          const month = monthDate.getMonth();

          const monthRecords = records.filter((record) => {
            const recordDate = new Date(record.time);

            return (
              recordDate.getFullYear() === year &&
              recordDate.getMonth() === month
            );
          });

          return {
            day: `${year}년 ${month + 1}월`,
            pass: monthRecords.filter(
              (record) => record.result === 'pass'
            ).length,
            fail: monthRecords.filter(
              (record) => record.result === 'fail'
            ).length,
          };
        });

  const resultData = [
    {
      name: '정상',
      value: totalPass,
      fill: '#16a34a',
    },
    {
      name: '불량',
      value: totalFail,
      fill: '#dc2626',
    },
  ].filter((item) => item.value > 0);

  const passRate =
    totalRecords > 0
      ? Math.round((totalPass / totalRecords) * 1000) / 10
      : 0;
  const radialData = [
    {
      name: '정상률',
      value: passRate,
      fill: '#16a34a',
    },
  ];

  const getPreviousPeriodRecords = () => {
    const now = new Date();

    if (period === 'week') {
      const previousStart = new Date(now);
      previousStart.setDate(now.getDate() - 14);

      const previousEnd = new Date(now);
      previousEnd.setDate(now.getDate() - 7);

      return records.filter((record) => {
        const recordDate = new Date(record.time);
        return recordDate >= previousStart && recordDate < previousEnd;
      });
    }

    if (period === 'month') {
      const previousMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );

      const nextMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

      return records.filter((record) => {
        const recordDate = new Date(record.time);

        return (
          recordDate >= previousMonth &&
          recordDate < nextMonth
        );
      });
    }

    const currentQuarter = Math.floor(now.getMonth() / 3);

    const previousQuarterStart = new Date(
      now.getFullYear(),
      (currentQuarter - 1) * 3,
      1
    );

    const currentQuarterStart = new Date(
      now.getFullYear(),
      currentQuarter * 3,
      1
    );

    return records.filter((record) => {
      const recordDate = new Date(record.time);

      return (
        recordDate >= previousQuarterStart &&
        recordDate < currentQuarterStart
      );
    });
  };

  const previousPeriodRecords = getPreviousPeriodRecords();

  const previousPassRate =
    previousPeriodRecords.length > 0
      ? Math.round(
        (previousPeriodRecords.filter(
          (record) => record.result === 'pass'
        ).length /
          previousPeriodRecords.length) *
        1000
      ) / 10
      : 0;

  const passRateChange =
    Math.round((passRate - previousPassRate) * 10) / 10;

  const previousFailCount = previousPeriodRecords.filter(
    (record) => record.result === 'fail'
  ).length;

  const failCountChange = totalFail - previousFailCount;

  const averageConfidence =
    totalRecords > 0
      ? Math.round(
        (filteredRecords.reduce(
          (sum, record) => sum + parseFloat(record.confidence),
          0
        ) / totalRecords) * 10
      ) / 10
      : 0;


  const defectTypeMap: Record<string, { label: string; color: string }> = {
    scratch: { label: '스크래치', color: '#f59e0b' },
    appearance: { label: '외관 손상', color: '#8b5cf6' },
    step: { label: '단차', color: '#dc2626' },
    mounting: { label: '장착 불량', color: '#0891b2' },
    fixing: { label: '고정 불량', color: '#16a34a' },
    pin_fixing: { label: '고정핀 불량', color: '#ca8a04' },
    connection: { label: '연계 불량', color: '#2563eb' },
    looseness: { label: '유격 불량', color: '#9333ea' },
    fastening: { label: '체결 불량', color: '#ea580c' },
    sealing: { label: '실링 불량', color: '#0d9488' },
    hemming: { label: '헤밍 불량', color: '#db2777' },
    hole_deformation: { label: '홀 변형', color: '#475569' },
  };


  const defectStats = Object.entries(defectTypeMap)
    .map(([key, info]) => ({
      name: info.label,
      count: filteredRecords.filter((r) =>
        r.defects?.some((d: any) => d.typeKey === key || d.typeLabel === info.label || d.type === info.label)
      ).length,
      color: info.color,
    }))
    .filter((d) => d.count > 0);

  return (
    <PageContainer>
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {periodOptions.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${period === p.key
                ? 'bg-navy-700 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button className="btn-secondary">
          <Download className="w-4 h-4" />
          보고서 다운로드
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="기간 내 총 검사"
          value={totalRecords}
          icon={<Calendar className="w-5 h-5" />}
          accent="navy"
        />
        <StatCard
          title="정상률"
          value={`${passRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{
            value: `${passRateChange >= 0 ? '+' : ''
              }${passRateChange}%p ${period === 'week'
                ? '전주 대비'
                : period === 'month'
                  ? '전월 대비'
                  : '전분기 대비'
              }`,
            positive: passRateChange >= 0,
          }}
          accent="green"
        />
        <StatCard
          title="불량 건수"
          value={totalFail}
          icon={<TrendingDown className="w-5 h-5" />}
          trend={{
            value: `${
              failCountChange >= 0 ? '+' : ''
            }${failCountChange}건 ${
              period === 'week'
                ? '전주 대비'
                : period === 'month'
                  ? '전월 대비'
                  : '전분기 대비'
            }`,
            positive: failCountChange <= 0,
          }}
          accent="red"
        />
        <StatCard
          title="평균 신뢰도"
          value={`${averageConfidence}%`}
          icon={<Calendar className="w-5 h-5" />}
          accent="amber"
        />
      </div>

      {/* Trend chart */}
      <div className="card p-5">
        <SectionTitle
          title={
            period === 'week'
              ? '주간 품질 추이'
              : period === 'month'
                ? '월별 품질 추이'
                : '분기별 품질 추이'
          }
        />
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={
              period === 'week'
                ? weeklyTrend
                : period === 'quarter'
                  ? quarterlyTrend
                  : monthlyTrend
            }
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '13px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Line type="monotone" dataKey="passRate" name="정상률 (%)" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="failRate" name="불량률 (%)" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly + Radial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <SectionTitle
            title={
              period === 'week'
                ? '주간 검사량 (정상/불량)'
                : period === 'month'
                  ? '월간 검사량 (정상/불량)'
                  : '분기 검사량 (정상/불량)'
            }
          />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={inspectionVolumeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="pass" name="정상" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="fail" name="불량" fill="#dc2626" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <SectionTitle title="정상률 게이지" />
          <ResponsiveContainer width="100%" height={260}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="65%"
              outerRadius="100%"
              data={radialData}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar background dataKey="value" cornerRadius={10} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="text-center -mt-32 mb-20">
            <p className="text-3xl font-bold text-navy-900">{passRate}%</p>
            <p className="text-xs text-gray-500">정상률</p>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="card p-5">
        <SectionTitle title="부품 분류별 품질 현황" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th className="text-left px-4 py-2.5 font-medium">부품 분류</th>
                <th className="text-center px-4 py-2.5 font-medium">총 검사</th>
                <th className="text-center px-4 py-2.5 font-medium">정상</th>
                <th className="text-center px-4 py-2.5 font-medium">불량</th>
                <th className="text-center px-4 py-2.5 font-medium">정상률</th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ width: '30%' }}>현황</th>
              </tr>
            </thead>
            <tbody>
              {categoryStats.map((cat) => (
                <tr key={cat.name} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-navy-900">{cat.name}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{cat.total}</td>
                  <td className="px-4 py-3 text-center text-green-600 font-medium">{cat.pass}</td>
                  <td className="px-4 py-3 text-center text-red-600 font-medium">{cat.fail}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-bold ${cat.passRate >= 95
                        ? 'text-green-600'
                        : cat.passRate >= 90
                          ? 'text-amber-600'
                          : 'text-red-600'
                        }`}
                    >
                      {cat.passRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cat.passRate >= 95
                          ? 'bg-green-500'
                          : cat.passRate >= 90
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                          }`}
                        style={{ width: `${cat.passRate}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Defect analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <SectionTitle title="불량 유형 분포" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={defectStats} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                }}
              />
              <Bar dataKey="count" name="건수" radius={[4, 4, 0, 0]} barSize={32}>
                {defectStats.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <SectionTitle title="검사 결과 분포" />
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={resultData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}건`}
                labelLine={false}
                style={{ fontSize: 12 }}
              >
                {resultData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageContainer>
  );
}
