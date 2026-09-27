import { useRef, useState } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Camera,
  ShieldCheck,
  Cpu,
  Save,
  MonitorCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Timer,
  X,
} from 'lucide-react';
import {
  PART_OPTIONS,
  defectTypeMap,
  bboxStyle,
  getDefectColor,
  formatInspectedAt,
  persistInspectionRecord,
  simulateInspection,
  type InspectionResult,
  type DefectInfo,
} from './shared';
import { getInspectionImages, type InspectionImage } from './inspectionImages';
import { PART_CATEGORIES } from '@/types';

type LinePhase = 'idle' | 'running' | 'paused' | 'done';
type StepKey = 'receiving' | 'validating' | 'inferring' | 'saving' | 'updating';

interface CurrentItem {
  image: InspectionImage;
  step: StepKey;
  stepError?: boolean;
  result?: InspectionResult;
}

interface LineResultEntry {
  id: string;
  index: number;
  label: string;
  imageUrl: string;
  status: 'pass' | 'fail' | 'error';
  result?: InspectionResult;
  errorMessage?: string;
}

const PIPELINE_STEPS: { key: StepKey; label: string; icon: typeof Camera }[] = [
  { key: 'receiving', label: '수신', icon: Camera },
  { key: 'validating', label: '입력 확인', icon: ShieldCheck },
  { key: 'inferring', label: 'AI 추론', icon: Cpu },
  { key: 'saving', label: '결과 저장', icon: Save },
  { key: 'updating', label: '화면 갱신', icon: MonitorCheck },
];

const NEXT_IMAGE_INTERVAL_MS = 900;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validateImage(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image.naturalWidth > 0 && image.naturalHeight > 0);
    image.onerror = () => resolve(false);
    image.src = src;
    if (image.complete) {
      resolve(image.naturalWidth > 0 && image.naturalHeight > 0);
    }
  });
}

// 정지/일시정지 신호를 확인하며 대기하는 헬퍼. 중지 시 즉시 반환된다.
async function waitControlled(
  ms: number,
  stopRef: React.MutableRefObject<boolean>,
  pauseRef: React.MutableRefObject<boolean>
) {
  const chunk = 40;
  let elapsed = 0;
  while (elapsed < ms) {
    if (stopRef.current) return;
    while (pauseRef.current && !stopRef.current) {
      await sleep(100);
    }
    if (stopRef.current) return;
    const step = Math.min(chunk, ms - elapsed);
    await sleep(step);
    elapsed += step;
  }
}

// 등록된 이미지별 판정 정보와 불량 위치를 바탕으로 검사 결과를 구성한다.
function inferFromGroundTruth(image: InspectionImage): InspectionResult {
  const { groundTruth } = image;
  if (!groundTruth) return simulateInspection();

  const inspectedAt = formatInspectedAt(new Date());

  if (groundTruth.result === 'pass') {
    return {
      result: 'pass',
      confidence: Math.round(Math.random() * 4 + 95),
      inspectedAt,
      model: 'YOLO',
      processingTimeMs: Math.round(Math.random() * 200 + 120),
      defects: [],
    };
  }

  const defects: DefectInfo[] = groundTruth.defects.map((d) => ({
    id: d.id,
    typeKey: d.typeKey,
    typeLabel: defectTypeMap[d.typeKey]?.label ?? d.typeKey,
    typeEn: defectTypeMap[d.typeKey]?.en ?? d.typeKey,
    confidence: Math.round(Math.random() * 10 + 88),
    bbox: d.bbox,
  }));

  return {
    result: 'fail',
    confidence: Math.round(Math.random() * 8 + 88),
    inspectedAt,
    model: 'YOLO',
    processingTimeMs: Math.round(Math.random() * 300 + 180),
    defects,
  };
}

export default function LineInspection() {
  const [phase, setPhase] = useState<LinePhase>('idle');
  const [selectedPart, setSelectedPart] = useState('');
  const [poolTotal, setPoolTotal] = useState(0);
  const [currentItem, setCurrentItem] = useState<CurrentItem | null>(null);
  const [results, setResults] = useState<LineResultEntry[]>([]);
  const [counts, setCounts] = useState({ done: 0, pass: 0, fail: 0, error: 0 });
  const [selectedResult, setSelectedResult] = useState<LineResultEntry | null>(null);

  const stopRef = useRef(false);
  const pauseRef = useRef(false);
  const runIdRef = useRef(0);
  const registeredImages = getInspectionImages();

  const progressPct = poolTotal > 0 ? Math.round((counts.done / poolTotal) * 100) : 0;

  const isConfigLocked = phase === 'running' || phase === 'paused';

  const runLine = async () => {
    if (!selectedPart) {
      window.alert('부품 종류를 선택해주세요.');
      return;
    }

    if (registeredImages.length === 0) {
      window.alert(
        'src/assets/inspection-images 폴더에 검사 이미지를 추가해주세요.'
      );
      return;
    }

    const myRunId = ++runIdRef.current;
    stopRef.current = false;
    pauseRef.current = false;

    setResults([]);
    setCounts({ done: 0, pass: 0, fail: 0, error: 0 });
    setCurrentItem(null);
    setSelectedResult(null);

    const pool = registeredImages;
    setPoolTotal(pool.length);
    setPhase('running');

    for (let i = 0; i < pool.length; i++) {
      if (stopRef.current || runIdRef.current !== myRunId) break;
      const image = pool[i];

      // 1. 수신 — 검사 대상 이미지 수신
      setCurrentItem({ image, step: 'receiving' });
      await waitControlled(200, stopRef, pauseRef);
      if (stopRef.current || runIdRef.current !== myRunId) break;

      // 2. 입력 확인 — 이미지 프레임 유효성 검사
      setCurrentItem({ image, step: 'validating' });
      await waitControlled(160, stopRef, pauseRef);
      if (stopRef.current || runIdRef.current !== myRunId) break;

      const isInputError = !(await validateImage(image.src));
      if (isInputError) {
        setCurrentItem({ image, step: 'validating', stepError: true });
        await waitControlled(300, stopRef, pauseRef);
        if (stopRef.current || runIdRef.current !== myRunId) break;

        const entry: LineResultEntry = {
          id: image.id,
          index: i + 1,
          label: image.label,
          imageUrl: image.src,
          status: 'error',
          errorMessage: '입력 이미지 확인 실패 (손상된 프레임)',
        };
        setResults((prev) => [entry, ...prev]);
        setCounts((c) => ({ ...c, done: c.done + 1, error: c.error + 1 }));
        setCurrentItem(null);
        if (i < pool.length - 1) {
          await waitControlled(NEXT_IMAGE_INTERVAL_MS, stopRef, pauseRef);
        }
        continue;
      }

      // 3. AI 추론 — 이미지 단위로 결과를 계산
      setCurrentItem({ image, step: 'inferring' });
      const inferResult = inferFromGroundTruth(image);
      await waitControlled(inferResult.processingTimeMs, stopRef, pauseRef);
      if (stopRef.current || runIdRef.current !== myRunId) break;

      // 4. 결과 저장
      setCurrentItem({ image, step: 'saving', result: inferResult });
      persistInspectionRecord({
        id: `INS-LINE-${Date.now()}-${i}`,
        source: 'localStorage',
        time: inferResult.inspectedAt,
        partName: selectedPart || '라인 검사 부품',
        category: PART_CATEGORIES.find((category) => category.label === selectedPart)?.key ?? selectedPart,
        bboxUnit: 'percent',
        image: image.src,
        result: inferResult.result,
        defectType: inferResult.defects.length > 0 ? inferResult.defects[0].typeLabel : null,
        defectKey: inferResult.defects.length > 0 ? inferResult.defects[0].typeKey : null,
        confidence: `${inferResult.confidence.toFixed(1)}%`,
        model: inferResult.model,
        processingTimeMs: inferResult.processingTimeMs,
        defects: inferResult.defects,
      });
      await waitControlled(160, stopRef, pauseRef);
      if (stopRef.current || runIdRef.current !== myRunId) break;

      // 5. 화면 갱신 — 결과 목록/카운터 반영
      setCurrentItem({ image, step: 'updating', result: inferResult });
      const entry: LineResultEntry = {
        id: image.id,
        index: i + 1,
        label: image.label,
        imageUrl: image.src,
        status: inferResult.result,
        result: inferResult,
      };
      setResults((prev) => [entry, ...prev]);
      setCounts((c) => ({
        ...c,
        done: c.done + 1,
        pass: c.pass + (inferResult.result === 'pass' ? 1 : 0),
        fail: c.fail + (inferResult.result === 'fail' ? 1 : 0),
      }));
      await waitControlled(120, stopRef, pauseRef);
      setCurrentItem(null);

      // 다음 이미지 입력 전 일정 간격을 둔다.
      if (i < pool.length - 1) {
        await waitControlled(NEXT_IMAGE_INTERVAL_MS, stopRef, pauseRef);
      }
    }

    if (runIdRef.current === myRunId) {
      setCurrentItem(null);
      setPhase('done');
    }
  };

  const handlePauseToggle = () => {
    if (phase === 'running') {
      pauseRef.current = true;
      setPhase('paused');
    } else if (phase === 'paused') {
      pauseRef.current = false;
      setPhase('running');
    }
  };

  const handleStop = () => {
    stopRef.current = true;
    pauseRef.current = false;
  };

  const handleResetAll = () => {
    runIdRef.current += 1;
    stopRef.current = false;
    pauseRef.current = false;
    setPhase('idle');
    setPoolTotal(0);
    setCurrentItem(null);
    setResults([]);
    setCounts({ done: 0, pass: 0, fail: 0, error: 0 });
    setSelectedResult(null);
  };

  const avgProcessingMs = (() => {
    const withResult = results.filter((r) => r.result);
    if (withResult.length === 0) return 0;
    return Math.round(
      withResult.reduce((sum, r) => sum + (r.result?.processingTimeMs ?? 0), 0) / withResult.length
    );
  })();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 왼쪽 - 제어 & 현재 처리 항목 */}
        <div className="lg:col-span-4 space-y-4">
          {/* 실행 설정 */}
          <div className="card p-5">
            <h3 className="text-base font-bold text-navy-900 mb-4">라인 검사 설정</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">부품 종류</label>
                <select
                  value={selectedPart}
                  onChange={(e) => setSelectedPart(e.target.value)}
                  disabled={isConfigLocked}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">부품 종류를 선택해주세요</option>
                  {PART_OPTIONS.map((part) => (
                    <option key={part} value={part}>
                      {part}
                    </option>
                  ))}
                </select>
              </div>


            </div>

            <div className="flex items-center gap-2 mt-4">
              {(phase === 'idle' || phase === 'done') && (
                <button className="btn-primary flex-1" onClick={runLine} disabled={!selectedPart}>
                  <Play className="w-4 h-4" />
                  검사 실행
                </button>
              )}
              {(phase === 'running' || phase === 'paused') && (
                <>
                  <button className="btn-secondary flex-1" onClick={handlePauseToggle}>
                    {phase === 'paused' ? (
                      <>
                        <Play className="w-4 h-4" />
                        재개
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4" />
                        일시정지
                      </>
                    )}
                  </button>
                  <button className="btn-danger flex-1" onClick={handleStop}>
                    <Square className="w-4 h-4" />
                    중지
                  </button>
                </>
              )}
              {phase === 'done' && (
                <button className="btn-secondary" onClick={handleResetAll}>
                  <RotateCcw className="w-4 h-4" />
                  초기화
                </button>
              )}
            </div>
          </div>

          {/* 현재 처리 중 */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-navy-900 mb-3">현재 처리 중인 이미지</h3>

            {!currentItem ? (
              <div className="aspect-[4/3] rounded-xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center px-4">
                <Camera className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-xs text-gray-400">
                  {phase === 'running' || phase === 'paused'
                    ? '다음 부품이 카메라에 들어올 때까지 대기 중...'
                    : '검사 실행을 누르면 등록된 이미지의 검사가 시작됩니다.'}
                </p>
              </div>
            ) : (
              <>
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                  <img src={currentItem.image.src} alt={currentItem.image.label} className="w-full h-full object-fill" />
                  {currentItem.result?.defects.map((defect) => {
                    const color = getDefectColor(defect.typeKey);
                    return (
                      <div
                        key={defect.id}
                        className="absolute rounded border-2"
                        style={{ ...bboxStyle(defect.bbox), borderColor: color }}
                      >
                        <span
                          className="absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                          style={{ backgroundColor: color }}
                        >
                          {defect.typeLabel} {defect.confidence}%
                        </span>
                      </div>
                    );
                  })}
                  <div className="absolute top-2 left-2 text-[11px] font-medium px-2 py-0.5 rounded-full bg-black/60 text-white">
                    {currentItem.image.label}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {PIPELINE_STEPS.map((step) => {
                    const stepOrder = PIPELINE_STEPS.findIndex((s) => s.key === step.key);
                    const currentOrder = PIPELINE_STEPS.findIndex((s) => s.key === currentItem.step);
                    const isDone = stepOrder < currentOrder;
                    const isActive = stepOrder === currentOrder;
                    const isErrored = isActive && currentItem.stepError;
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${isErrored
                              ? 'bg-red-100 text-red-600'
                              : isDone
                                ? 'bg-green-100 text-green-700'
                                : isActive
                                  ? 'bg-navy-700 text-white'
                                  : 'bg-gray-100 text-gray-400'
                            }`}
                        >
                          {isErrored ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : isDone ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>
                        <span
                          className={`text-sm ${isErrored
                              ? 'text-red-600 font-medium'
                              : isDone
                                ? 'text-green-700 font-medium'
                                : isActive
                                  ? 'text-navy-900 font-medium'
                                  : 'text-gray-400'
                            }`}
                        >
                          {step.label}
                          {isErrored && ' 실패'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

        </div>

        {/* 오른쪽 - 진행 현황 & 결과 목록 */}
        <div className="lg:col-span-8 space-y-4">
          {/* 카운터 & 진행률 */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-navy-900">진행 현황</h3>
              <span className="text-xs text-gray-500">
                {counts.done} / {poolTotal}건 처리
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-navy-600 transition-all duration-200"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">완료</p>
                <p className="text-lg font-bold text-navy-900">{counts.done}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-green-600">정상</p>
                <p className="text-lg font-bold text-green-700">{counts.pass}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <p className="text-xs text-red-600">불량</p>
                <p className="text-lg font-bold text-red-700">{counts.fail}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-center">
                <p className="text-xs text-amber-600">오류</p>
                <p className="text-lg font-bold text-amber-700">{counts.error}</p>
              </div>
            </div>
          </div>

          {/* 검사 요약 (완료 시) */}
          {phase === 'done' && (
            <div className="card p-5 border-navy-200 bg-navy-50/40">
              <div className="flex items-center gap-2 mb-3">
                <MonitorCheck className="w-4 h-4 text-navy-600" />
                <h3 className="text-sm font-bold text-navy-900">검사 요약</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">총 처리</p>
                  <p className="font-bold text-navy-900">{counts.done}개</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">불량률</p>
                  <p className="font-bold text-navy-900">
                    {counts.done > 0 ? Math.round((counts.fail / counts.done) * 1000) / 10 : 0}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">평균 추론 시간</p>
                  <p className="font-bold text-navy-900">{avgProcessingMs} ms</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">오류(입력 확인 실패)</p>
                  <p className="font-bold text-navy-900">{counts.error}건</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 mt-3">
                검사 결과는 검사이력 화면에서도 다시 확인할 수 있습니다.
              </p>
            </div>
          )}

          {/* 결과 목록 */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-navy-900">개별 결과 목록</h3>
              <span className="text-xs text-gray-400">최근 처리 순</span>
            </div>

            {results.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                아직 처리된 항목이 없습니다. 검사 실행을 눌러 등록된 이미지를 검사하세요.
              </div>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {results.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedResult(entry)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-navy-300 hover:bg-navy-50/30 transition-colors text-left"
                  >
                    <img
                      src={entry.imageUrl}
                      alt={entry.label}
                      className="w-14 h-14 rounded-md object-cover border border-gray-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-400">#{entry.index}</span>
                        <span className="text-sm font-medium text-navy-900 truncate">{entry.label}</span>
                        {entry.status === 'pass' && <span className="badge badge-pass">정상</span>}
                        {entry.status === 'fail' && <span className="badge badge-fail">불량</span>}
                        {entry.status === 'error' && <span className="badge badge-warn">오류</span>}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {entry.status === 'error'
                          ? entry.errorMessage
                          : entry.status === 'fail' && entry.result
                            ? entry.result.defects
                                .map((d) => `${d.typeLabel} (${d.bbox.x}%, ${d.bbox.y}%)`)
                                .join(', ')
                            : '불량 위치 없음'}
                      </p>
                    </div>
                    {entry.result && (
                      <div className="text-right shrink-0 hidden sm:block">
                        <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                          <Timer className="w-3 h-3" />
                          {entry.result.processingTimeMs}ms
                        </p>
                        <p className="text-[11px] text-gray-400">{entry.result.inspectedAt}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 개별 결과 상세 모달 */}
      {selectedResult && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedResult(null)}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-sm font-bold text-navy-900">
                {selectedResult.label} · #{selectedResult.index}
              </h3>
              <button onClick={() => setSelectedResult(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="relative aspect-[3/2] rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                <img src={selectedResult.imageUrl} alt={selectedResult.label} className="w-full h-full object-fill" />
                {selectedResult.result?.defects.map((defect) => {
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

              {selectedResult.status === 'error' ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {selectedResult.errorMessage}
                </div>
              ) : (
                selectedResult.result && (
                  <>
                    <div className="flex items-center gap-3">
                      {selectedResult.status === 'pass' ? (
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-600" />
                      )}
                      <div>
                        <p className={`text-lg font-bold ${selectedResult.status === 'pass' ? 'text-green-700' : 'text-red-700'}`}>
                          {selectedResult.status === 'pass' ? '정상' : '불량'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedResult.result.inspectedAt} · {selectedResult.result.model} ·{' '}
                          {selectedResult.result.processingTimeMs}ms
                        </p>
                      </div>
                    </div>

                    {selectedResult.result.defects.length > 0 && (
                      <div className="space-y-2">
                        {selectedResult.result.defects.map((d, idx) => (
                          <div key={d.id} className="flex items-center justify-between text-sm border border-gray-200 rounded-lg p-2.5">
                            <span className="font-medium text-navy-900">
                              불량 #{idx + 1}: {d.typeLabel}
                            </span>
                            <span className="text-xs text-gray-500">
                              위치 ({d.bbox.x}%, {d.bbox.y}%) · 신뢰도 {d.confidence}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )
              )}
              <p className="text-[11px] text-gray-400">
                불량 위치는 검사 이미지 위에 표시됩니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
