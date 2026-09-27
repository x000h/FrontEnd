import { useState, useRef, useCallback } from 'react';
import {
  Image as ImageIcon,
  Upload,
  ScanSearch,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Save,
  Target,
  Clock,
  Cpu,
  AlertCircle,
  FileImage,
  RefreshCw,
} from 'lucide-react';

type Phase = 'idle' | 'uploaded' | 'analyzing' | 'done';

interface Bbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DefectInfo {
  id: string;
  typeLabel: string;
  typeKey: string;
  typeEn: string;
  confidence: number;
  bbox: Bbox;
}

interface InspectionResult {
  result: 'pass' | 'fail';
  confidence: number;
  inspectedAt: string;
  model: string;
  processingTimeMs: number;
  defects: DefectInfo[];
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

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

function simulateInspection(): InspectionResult {
  const isPass = Math.random() > 0.4;
  const now = new Date();
  const inspectedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (isPass) {
    return {
      result: 'pass',
      confidence: Math.round(Math.random() * 4 + 95),
      inspectedAt,
      model: '시뮬레이션 (YOLO 예시)',
      processingTimeMs: Math.round(Math.random() * 200 + 120),
      defects: [],
    };
  }

  const numDefects = Math.floor(Math.random() * 2) + 1;
  const types = Object.keys(defectTypeMap);
  const shuffled = [...types].sort(() => Math.random() - 0.5).slice(0, numDefects);
  const defects: DefectInfo[] = shuffled.map((typeKey, i) => ({
    id: `defect-${i}`,
    typeLabel: defectTypeMap[typeKey].label,
    typeKey,
    typeEn:
      typeKey === 'scratch'
        ? 'Scratch'
        : typeKey === 'appearance'
          ? 'Appearance Damage'
          : typeKey === 'step'
            ? 'Step Difference'
            : typeKey === 'mounting'
              ? 'Mounting Defect'
              : typeKey === 'fixing'
                ? 'Fixing Defect'
                : typeKey === 'pin_fixing'
                  ? 'Fixing Pin Defect'
                  : typeKey === 'connection'
                    ? 'Connection Defect'
                    : typeKey === 'looseness'
                      ? 'Looseness Defect'
                      : typeKey === 'fastening'
                        ? 'Fastening Defect'
                        : typeKey === 'sealing'
                          ? 'Sealing Defect'
                          : typeKey === 'hemming'
                            ? 'Hemming Defect'
                            : typeKey === 'hole_deformation'
                              ? 'Hole Deformation'
                              : 'Unknown',
    confidence: Math.round(Math.random() * 10 + 88),
    bbox: {
      x: Math.round(Math.random() * 350 + 60),
      y: Math.round(Math.random() * 200 + 40),
      width: Math.round(Math.random() * 100 + 50),
      height: Math.round(Math.random() * 80 + 40),
    },
  }));

  return {
    result: 'fail',
    confidence: Math.round(Math.random() * 8 + 88),
    inspectedAt,
    model: '시뮬레이션 (YOLO 예시)',
    processingTimeMs: Math.round(Math.random() * 300 + 180),
    defects,
  };
}

const bboxStyle = (bbox: Bbox) => ({
  left: `${(bbox.x / 600) * 100}%`,
  top: `${(bbox.y / 400) * 100}%`,
  width: `${(bbox.width / 600) * 100}%`,
  height: `${(bbox.height / 400) * 100}%`,
});

const getDefectColor = (typeKey: string): string =>
  defectTypeMap[typeKey]?.color ?? '#dc2626';

export default function Inspection() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedPart, setSelectedPart] = useState('');
  const partOptions = [
    '도어',
    '라디에이터 그릴',
    '루프사이드',
    '배선',
    '범퍼',
    '카울커버',
    '커넥터',
    '테일 램프',
    '프레임',
    '헤드 램프',
    '휀더',
  ];
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileSelect = useCallback((file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      showToast('지원하지 않는 파일 형식입니다.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setFileName(file.name);
      const sizeKB = file.size / 1024;
      setFileSize(sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB.toFixed(0)} KB`);
      setPhase('uploaded');
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleStartInspection = () => {
    if (!imagePreview) {
      showToast('검사할 이미지를 먼저 업로드해주세요.', 'error');
      return;
    }

    setPhase('analyzing');
    setProgress(0);
    setResult(null);
    setError(null);
    setIsSaved(false);

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 5;
      });
    }, 50);

    setTimeout(() => {
      setProgress(100);
      setResult(simulateInspection());
      setPhase('done');
    }, 1800);
  };

  const handleReset = () => {
    setPhase('idle');
    setImagePreview(null);
    setFileName('');
    setFileSize('');
    setResult(null);
    setProgress(0);
    setError(null);
    setIsSaved(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = () => {
    if (!result) {
      showToast('저장할 검사 결과가 없습니다.', 'error');
      return;
    }

    // 기존에 저장된 검사 기록 가져오기
    const existingRecords = JSON.parse(
      localStorage.getItem('inspectionRecords') || '[]'
    );

    // 현재 검사 결과를 새로운 기록으로 만들기
    const newRecord = {
      id: `INS-${Date.now()}`,
      source: 'simulation',
      time: result.inspectedAt,
      partName: fileName || '자동차 부품',
      category: selectedPart,
      image: imagePreview,
      result: result.result,
      defectType: result.defects.length > 0
        ? result.defects[0].typeLabel
        : null,
      defectKey: result.defects.length > 0
        ? result.defects[0].typeKey
        : null,
      confidence: `${result.confidence.toFixed(1)}%`,
      model: result.model,
      processingTimeMs: result.processingTimeMs,
      defects: result.defects,
    };

    // 기존 기록 + 현재 기록
    const updatedRecords = [newRecord, ...existingRecords];

    // 브라우저에 저장
    localStorage.setItem(
      'inspectionRecords',
      JSON.stringify(updatedRecords)
    );

    // 화면의 저장 완료 상태 변경
    setIsSaved(true);

    showToast('검사 결과가 저장되었습니다.', 'success');
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽 - 이미지 입력 영역 */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-base font-bold text-navy-900 mb-4">이미지 입력</h3>

            {/* Upload area / Preview */}
            {phase === 'idle' ? (
              <div
                className="aspect-[4/3] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:border-navy-400 hover:bg-navy-50/30 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-full bg-navy-50 flex items-center justify-center mb-4">
                  <ImageIcon className="w-7 h-7 text-navy-400" />
                </div>
                <p className="text-sm font-medium text-navy-700">검사할 이미지를 업로드하세요</p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG 파일 지원</p>
                <button className="btn-primary mt-4" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  <Upload className="w-4 h-4" />
                  이미지 선택
                </button>
              </div>
            ) : (
              <>
                {/* Image preview */}
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                  {phase === 'analyzing' && (
                    <div className="absolute inset-0 z-10 bg-white/70 flex flex-col items-center justify-center backdrop-blur-sm">
                      <Loader2 className="w-10 h-10 text-navy-600 animate-spin mb-3" />
                      <p className="text-sm font-medium text-navy-700">AI 모델이 이미지를 분석하고 있습니다...</p>
                      <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden mt-4">
                        <div className="h-full bg-navy-600 transition-all duration-75" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}

                  {phase === 'done' && result && result.defects.length > 0 ? (
                    <div className="relative w-full h-full">
                      <img
                        src={imagePreview ?? undefined}
                        alt="검사 이미지"
                        className="w-full h-full object-contain"
                      />
                      {result.defects.map((defect) => {
                        const color = getDefectColor(defect.typeKey);
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
                  ) : (
                    <img src={imagePreview ?? undefined} alt="검사 이미지" className="w-full h-full object-cover" />
                  )}
                </div>

                {/* File info */}
                <div className="flex items-center gap-3 mt-3 px-3 py-2.5 bg-gray-50 rounded-lg">
                  <FileImage className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-navy-900 truncate">{fileName}</p>
                    <p className="text-xs text-gray-500">{fileSize}</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 mt-4">
                  {phase === 'uploaded' && (
                    <>
                      <button
                        className="btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <RefreshCw className="w-4 h-4" />
                        이미지 변경
                      </button>
                      <button className="btn-primary" onClick={handleStartInspection}>
                        <ScanSearch className="w-4 h-4" />
                        검사 시작
                      </button>
                    </>
                  )}

                  {phase === 'analyzing' && (
                    <button className="btn-primary" disabled>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      검사 진행 중...
                    </button>
                  )}

                  {phase === 'done' && (
                    <>
                      <button className="btn-secondary" onClick={handleReset}>
                        <RotateCcw className="w-4 h-4" />
                        새 검사
                      </button>
                      <button className="btn-primary" onClick={handleSave} disabled={isSaved}>
                        {isSaved ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            저장 완료
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            검사 결과 저장
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 부품 종류 선택 */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-navy-900 mb-3">
              부품 종류
            </h3>

            <select
              value={selectedPart}
              onChange={(e) => setSelectedPart(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
            >
              <option value="">부품 종류를 선택해주세요</option>

              {partOptions.map((part) => (
                <option key={part} value={part}>
                  {part}
                </option>
              ))}
            </select>
          </div>

          {/* 검사 순서 가이드 */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-navy-900 mb-3">검사 진행 단계</h3>
            <div className="space-y-2.5">
              {[
                { step: 1, label: '이미지 업로드', active: phase === 'idle', done: phase !== 'idle' },
                { step: 2, label: '이미지 확인', active: phase === 'uploaded', done: phase === 'analyzing' || phase === 'done' },
                { step: 3, label: '검사 시작', active: phase === 'analyzing', done: phase === 'done' },
                { step: 4, label: 'AI 결과 확인', active: phase === 'done' && result !== null, done: false },
                { step: 5, label: '검사 결과 저장', active: false, done: false },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${item.done
                        ? 'bg-green-100 text-green-700'
                        : item.active
                          ? 'bg-navy-700 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                  >
                    {item.done ? <CheckCircle2 className="w-4 h-4" /> : item.step}
                  </div>
                  <span
                    className={`text-sm ${item.done
                        ? 'text-green-700 font-medium'
                        : item.active
                          ? 'text-navy-900 font-medium'
                          : 'text-gray-400'
                      }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽 - 검사 결과 영역 */}
        <div className="space-y-4">
          {phase === 'idle' && (
            <div className="card p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-navy-50 flex items-center justify-center mx-auto mb-4">
                <ScanSearch className="w-8 h-8 text-navy-400" />
              </div>
              <p className="text-sm font-medium text-navy-700">검사 결과가 여기에 표시됩니다.</p>
              <p className="text-xs text-gray-500 mt-1">이미지를 업로드하고 검사를 시작하세요.</p>
            </div>
          )}

          {phase === 'uploaded' && (
            <div className="card p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <ScanSearch className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-navy-700">검사 대기 중</p>
              <p className="text-xs text-gray-500 mt-1">검사 시작 버튼을 눌러주세요.</p>
            </div>
          )}

          {phase === 'analyzing' && (
            <div className="card p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-navy-500 animate-spin mb-4" />
              <p className="text-sm font-medium text-navy-700">AI 모델이 이미지를 분석하고 있습니다...</p>
              <p className="text-xs text-gray-500 mt-1">잠시만 기다려주세요.</p>
              <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden mt-4">
                <div className="h-full bg-navy-600 transition-all duration-75" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {phase === 'done' && result && (
            <>
              {/* 정상/불량 결과 영역 */}
              <div className="card p-5">
                <div
                  className={`p-5 rounded-xl border ${result.result === 'pass'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    {result.result === 'pass' ? (
                      <CheckCircle2 className="w-12 h-12 text-green-600" />
                    ) : (
                      <XCircle className="w-12 h-12 text-red-600" />
                    )}
                    <div>
                      <p
                        className={`text-2xl font-bold ${result.result === 'pass' ? 'text-green-700' : 'text-red-700'
                          }`}
                      >
                        {result.result === 'pass' ? '정상' : '불량'}
                      </p>
                      <p
                        className={`text-sm mt-1 ${result.result === 'pass' ? 'text-green-600' : 'text-red-600'
                          }`}
                      >
                        {result.result === 'pass'
                          ? '검사 결과 이상이 발견되지 않았습니다.'
                          : '불량이 탐지되었습니다.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 검사 정보 */}
                <div className="grid grid-cols-4 gap-3 mt-4">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-4 h-4 text-navy-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">검사 시간</p>
                      <p className="text-sm font-bold text-navy-900">{result.inspectedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Cpu className="w-4 h-4 text-navy-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">사용 모델</p>
                      <p className="text-sm font-bold text-navy-900">{result.model}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Target className="w-4 h-4 text-navy-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">전체 신뢰도</p>
                      <p className="text-sm font-bold text-navy-900">{result.confidence}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-4 h-4 text-navy-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">처리 시간</p>
                      <p className="text-sm font-bold text-navy-900">{result.processingTimeMs} ms</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 불량 상세 정보 */}
              {result.result === 'fail' && result.defects.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-bold text-navy-900 mb-4">
                    탐지된 불량 정보 ({result.defects.length}건)
                  </h3>
                  <div className="space-y-3">
                    {result.defects.map((defect, idx) => {
                      const color = getDefectColor(defect.typeKey);
                      return (
                        <div key={defect.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3.5 h-3.5 rounded-full shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-sm font-bold text-navy-900">
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
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-gray-500">신뢰도</p>
                              <p className="font-bold text-navy-900">{defect.confidence}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">탐지 개수</p>
                              <p className="font-bold text-navy-900">{result.defects.length}개</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 저장 버튼 */}
              <div className="card p-5">
                <button className="btn-primary" onClick={handleSave} disabled={isSaved}>
                  {isSaved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      저장 완료
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      검사 결과 저장
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 toast">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${toast.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
              }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
