import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Target,
  Clock,
  Cpu,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  Crosshair,
  Trash2,
} from 'lucide-react';
import PageContainer from '@/components/PageContainer';

type ResultType = 'pass' | 'fail';
type ResultFilter = 'all' | ResultType;
type DefectFilter =
  | 'all'
  | 'scratch'
  | 'appearance'
  | 'step'
  | 'mounting'
  | 'fixing'
  | 'pin_fixing'
  | 'connection'
  | 'looseness'
  | 'fastening'
  | 'sealing'
  | 'hemming'
  | 'hole_deformation';
type ModelFilter = 'all' | 'YOLO' | 'Faster R-CNN' | 'SSD + MobileNetV3';

interface Bbox {
  x: number;
  y: number;
  width: number;
  height: number;
}


interface Defect {
  id: string;
  typeKey: DefectFilter;
  typeLabel: string;
  typeEn: string;
  confidence: number;
  bbox: Bbox;
}

interface HistoryRecord {
  id: string;
  source?: 'localStorage' | 'simulation' | 'mock';
  time: string;
  partName: string;
  category?: string;
  image?: string | null;
  result: ResultType;
  defectType: string | null;
  defectKey: DefectFilter | null;
  confidence: string;
  model: string;
  processingTimeMs?: number;
  defects: Defect[];
}


const defectColorMap: Record<DefectFilter, string> = {
  all: '#6b7280',
  scratch: '#f59e0b',
  appearance: '#8b5cf6',
  step: '#dc2626',
  mounting: '#0891b2',
  fixing: '#16a34a',
  pin_fixing: '#ca8a04',
  connection: '#2563eb',
  looseness: '#9333ea',
  fastening: '#ea580c',
  sealing: '#0d9488',
  hemming: '#db2777',
  hole_deformation: '#475569',
};

const bboxStyle = (bbox: Bbox) => ({
  left: `${(bbox.x / 600) * 100}%`,
  top: `${(bbox.y / 400) * 100}%`,
  width: `${(bbox.width / 600) * 100}%`,
  height: `${(bbox.height / 400) * 100}%`,
});

const partNames = ['Brake Disc', 'Engine Part A', 'Engine Part B', 'Suspension Arm', 'Door Panel', 'Transmission Case', 'Wheel Hub', 'Exhaust Manifold'];
const models: ModelFilter[] = ['YOLO', 'Faster R-CNN', 'SSD + MobileNetV3'];
const defectLabels: Record<DefectFilter, string> = {
  all: '전체',
  scratch: '스크래치',
  appearance: '외관 손상',
  step: '단차',
  mounting: '장착 불량',
  fixing: '고정 불량',
  pin_fixing: '고정핀 불량',
  connection: '연계 불량',
  looseness: '유격 불량',
  fastening: '체결 불량',
  sealing: '실링 불량',
  hemming: '헤밍 불량',
  hole_deformation: '홀 변형',
};
const defectEn: Record<DefectFilter, string> = {
  all: 'All',
  scratch: 'Scratch',
  appearance: 'Appearance',
  step: 'Step',
  mounting: 'Mounting',
  fixing: 'Fixing',
  pin_fixing: 'Pin Fixing',
  connection: 'Connection',
  looseness: 'Looseness',
  fastening: 'Fastening',
  sealing: 'Sealing',
  hemming: 'Hemming',
  hole_deformation: 'Hole Deformation',
};

function generateMockRecords(): HistoryRecord[] {
  const records: HistoryRecord[] = [];
  const baseDate = new Date('2026-09-20');
  let timeOffset = 0;

  for (let i = 0; i < 35; i++) {
    const isPass = Math.random() > 0.35;
    const partName = partNames[i % partNames.length];
    const model = models[i % models.length];
    const date = new Date(baseDate.getTime() - timeOffset * 60000);
    const timeStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    let defects: Defect[] = [];
    let defectType: string | null = null;
    let defectKey: DefectFilter | null = null;

    if (!isPass) {
      const numDefects = Math.floor(Math.random() * 2) + 1;
      const types: DefectFilter[] = [
        'scratch',
        'appearance',
        'step',
        'mounting',
        'fixing',
        'pin_fixing',
        'connection',
        'looseness',
        'fastening',
        'sealing',
        'hemming',
        'hole_deformation',
      ];
      const shuffled = [...types].sort(() => Math.random() - 0.5).slice(0, numDefects);
      defects = shuffled.map((t, idx) => ({
        id: `${i}-d${idx}`,
        typeKey: t,
        typeLabel: defectLabels[t],
        typeEn: defectEn[t],
        confidence: Math.round(Math.random() * 10 + 88),
        bbox: {
          x: Math.round(Math.random() * 350 + 60),
          y: Math.round(Math.random() * 200 + 40),
          width: Math.round(Math.random() * 100 + 50),
          height: Math.round(Math.random() * 80 + 40),
        },
      }));
      defectType = defects[0].typeLabel;
      defectKey = defects[0].typeKey;
    }

    records.push({
      id: `INS-${String(20250920 - i).padStart(6, '0')}`,
      time: timeStr,
      partName,
      result: isPass ? 'pass' : 'fail',
      defectType,
      defectKey,
      confidence: `${(Math.random() * 8 + 91).toFixed(1)}%`,
      model,
      defects,
    });

    timeOffset += Math.floor(Math.random() * 30 + 15);
  }

  return records;
}

const getRecords = (): HistoryRecord[] => {
  const savedRecords = localStorage.getItem('inspectionRecords');

  if (savedRecords) {
    return JSON.parse(savedRecords);
  }

  return generateMockRecords();
};

const PAGE_SIZE = 8;

export default function History() {
  const location = useLocation();
  const focusId = (location.state as { focusId?: string } | null)?.focusId;

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const [defectFilter, setDefectFilter] = useState<DefectFilter>('all');
  const [modelFilter, setModelFilter] = useState<ModelFilter>('all');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<HistoryRecord | null>(null);
  const [recordsVersion, setRecordsVersion] = useState(0);

  const filtered = useMemo(() => {
    const allRecords = getRecords();

    return allRecords.filter((r) => {
      if (resultFilter !== 'all' && r.result !== resultFilter) return false;
      if (defectFilter !== 'all' && r.defectKey !== defectFilter) return false;
      if (modelFilter !== 'all' && r.model !== modelFilter) return false;
      if (dateFrom) {
        const from = new Date(dateFrom);
        const recDate = new Date(r.time);
        if (recDate < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59);
        const recDate = new Date(r.time);
        if (recDate > to) return false;
      }
      return true;
    });
  }, [searchTrigger, resultFilter, defectFilter, modelFilter, dateFrom, dateTo, recordsVersion]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRecords = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  useEffect(() => {
    if (focusId) {
      const allRecords = getRecords();
      const record = allRecords.find((r) => r.id === focusId);

      if (record) {
        setSelected(record);
      }
    }
  }, [focusId]);

  const handleSearch = () => {
    setSearchTrigger((s) => s + 1);
    setPage(0);
  };

  const handleReset = () => {
    setDateFrom('');
    setDateTo('');
    setResultFilter('all');
    setDefectFilter('all');
    setModelFilter('all');
    setSearchTrigger((s) => s + 1);
    setPage(0);
  };

  const handleDelete = (id: string) => {
    const confirmed = window.confirm(
      '이 검사 결과를 삭제하시겠습니까?'
    );

    if (!confirmed) return;

    const savedRecords = localStorage.getItem('inspectionRecords');

    if (!savedRecords) {
      return;
    }

    const records = JSON.parse(savedRecords);

    const updatedRecords = records.filter(
      (record: HistoryRecord) => record.id !== id
    );

    localStorage.setItem(
      'inspectionRecords',
      JSON.stringify(updatedRecords)
    );

    // 현재 선택된 상세 화면 닫기
    setSelected((current) =>
      current?.id === id ? null : current
    );

    // 검사이력 목록 다시 계산
    setRecordsVersion((prev) => prev + 1);
  };


  const hasActiveFilters =
    dateFrom !== '' || dateTo !== '' || resultFilter !== 'all' || defectFilter !== 'all' || modelFilter !== 'all';

  return (
    <PageContainer>
      {/* Filter Card */}
      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {/* Date From */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">검사 기간 시작일</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-8 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">검사 기간 종료일</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-8 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Result filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">검사 결과</label>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value as ResultFilter)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
            >
              <option value="all">전체</option>
              <option value="pass">정상</option>
              <option value="fail">불량</option>
            </select>
          </div>

          {/* Defect type filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">불량 유형</label>
            <select
              value={defectFilter}
              onChange={(e) => setDefectFilter(e.target.value as DefectFilter)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
            >
              <option value="all">전체</option>
              <option value="scratch">스크래치</option>
              <option value="appearance">외관 손상</option>
              <option value="step">단차</option>
              <option value="mounting">장착 불량</option>
              <option value="fixing">고정 불량</option>
              <option value="pin_fixing">고정핀 불량</option>
              <option value="connection">연계 불량</option>
              <option value="looseness">유격 불량</option>
              <option value="fastening">체결 불량</option>
              <option value="sealing">실링 불량</option>
              <option value="hemming">헤밍 불량</option>
              <option value="hole_deformation">홀 변형</option>
            </select>
          </div>

          {/* Model filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">사용 모델</label>
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value as ModelFilter)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
            >
              <option value="all">전체</option>
              <option value="YOLO">YOLO</option>
              <option value="Faster R-CNN">Faster R-CNN</option>
              <option value="SSD + MobileNetV3">SSD + MobileNetV3</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {hasActiveFilters ? `필터 적용됨 · ` : ''}총 {filtered.length}건
          </span>
          <div className="flex items-center gap-2">
            <button className="btn-secondary" onClick={handleReset} disabled={!hasActiveFilters}>
              <RotateCcw className="w-4 h-4" />
              초기화
            </button>
            <button className="btn-primary" onClick={handleSearch}>
              <Search className="w-4 h-4" />
              검색
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <th className="text-left px-4 py-3 font-medium whitespace-nowrap">검사 이미지</th>
                <th className="text-left px-4 py-3 font-medium whitespace-nowrap">검사 시간</th>
                <th className="text-left px-4 py-3 font-medium">부품명</th>
                <th className="text-left px-4 py-3 font-medium">검사 결과</th>
                <th className="text-left px-4 py-3 font-medium">불량 유형</th>
                <th className="text-left px-4 py-3 font-medium">신뢰도</th>
                <th className="text-left px-4 py-3 font-medium">사용 모델</th>
              </tr>
            </thead>
            <tbody>
              {pageRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium text-navy-700">검색 결과가 없습니다.</p>
                    <p className="text-xs text-gray-500 mt-1">조건을 변경하여 다시 검색해주세요.</p>
                  </td>
                </tr>
              ) : (
                pageRecords.map((record) => (
                  <tr
                    key={record.id}
                    onClick={() => setSelected(record)}
                    className="border-b border-gray-100 hover:bg-navy-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                        {record.image ? (
                          <img
                            src={record.image}
                            alt={record.category ?? record.partName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap font-mono">{record.time}</td>
                    <td className="px-4 py-3 font-medium text-navy-900">{record.category ?? record.partName}</td>
                    <td className="px-4 py-3">
                      {record.result === 'pass' ? (
                        <span className="badge-pass">정상</span>
                      ) : (
                        <span className="badge-fail">불량</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{record.defectType ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{record.confidence}</td>
                    <td className="px-4 py-3 text-gray-600">{record.model}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-100">
            <button
              onClick={() => setPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="p-2 text-gray-500 hover:text-navy-700 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === i
                  ? 'bg-navy-700 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-2 text-gray-500 hover:text-navy-700 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="ml-2 text-sm text-gray-500">다음</span>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-xl">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between z-10">
              <h3 className="text-base font-bold text-navy-900">검사 상세 정보</h3>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Inspection image with bounding boxes */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">검사 이미지</p>
                <div className="relative aspect-[3/2] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  {selected.image ? (
                    <img
                      src={selected.image}
                      alt={selected.category ?? selected.partName}
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}

                  {selected.defects.map((defect) => {
                    const color = defectColorMap[defect.typeKey] ?? '#dc2626';
                    return (
                      <div
                        key={defect.id}
                        className="absolute border-2 rounded"
                        style={{ ...bboxStyle(defect.bbox), borderColor: color }}
                      >
                        <span
                          className="absolute -top-5 left-0 text-[10px] font-medium px-1.5 py-0.5 rounded text-white whitespace-nowrap"
                          style={{ backgroundColor: color }}
                        >
                          {defect.typeEn} {defect.confidence}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Result */}
              <div
                className={`p-4 rounded-lg border ${selected.result === 'pass'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
                  }`}
              >
                <div className="flex items-center gap-3">
                  {selected.result === 'pass' ? (
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600" />
                  )}
                  <div>
                    <p
                      className={`text-lg font-bold ${selected.result === 'pass' ? 'text-green-700' : 'text-red-700'
                        }`}
                    >
                      {selected.result === 'pass' ? '정상' : '불량'}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {selected.result === 'pass'
                        ? '이상이 발견되지 않았습니다.'
                        : '불량이 탐지되었습니다.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Inspection info */}
              <div className="grid grid-cols-2 gap-3">
                <InfoItem icon={<Clock className="w-3.5 h-3.5" />} label="검사 시간" value={selected.time} />
                <InfoItem icon={<Cpu className="w-3.5 h-3.5" />} label="사용 AI 모델" value={selected.model} />
                <InfoItem icon={<Target className="w-3.5 h-3.5" />} label="신뢰도" value={selected.confidence} />
                <InfoItem icon={<FileText className="w-3.5 h-3.5" />} label="부품명" value={selected.category ?? selected.partName} />
                <InfoItem icon={<Clock className="w-3.5 h-3.5" />} label="처리 시간" value={selected.processingTimeMs !== undefined
                  ? `${selected.processingTimeMs} ms`
                  : '-'
                }
                />
              </div>

              {/* Defect details */}
              {selected.defects.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-navy-900 mb-3">
                    불량 상세 정보 ({selected.defects.length}건)
                  </p>
                  <div className="space-y-3">
                    {selected.defects.map((defect, idx) => {
                      const color = defectColorMap[defect.typeKey] ?? '#dc2626';
                      return (
                        <div key={defect.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                              <span className="text-sm font-medium text-navy-900">
                                불량 #{idx + 1}: {defect.typeLabel}
                              </span>
                            </div>
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: color }}
                            >
                              {defect.typeEn}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="flex items-center gap-1.5">
                              <Crosshair className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-gray-500">불량 위치:</span>
                              <span className="font-medium text-navy-900">
                                ({defect.bbox.x}, {defect.bbox.y})
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-gray-500">Confidence:</span>
                              <span className="font-medium text-navy-900">{defect.confidence}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Delete button */}
              <button
                onClick={() => handleDelete(selected.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                검사 결과 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
        {icon}
        {label}
      </p>
      <p className="text-sm text-navy-900 font-medium">{value}</p>
    </div>
  );
}
