import { useState } from 'react';
import {
  Cpu,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  Database,
  Calendar,
  Trash2,
  GitBranch,
  Server,
} from 'lucide-react';
import PageContainer from '@/components/PageContainer';
import StatCard from '@/components/StatCard';
import SectionTitle from '@/components/SectionTitle';
import { mockModels, demoModels } from '@/data/mockData';
import {
  DEFECT_TYPES,
  defectLabel,
  MODEL_REQUIREMENTS,
  type AIModel,
  type DefectType,
  type RequirementVerdict,
} from '@/types';

// 값이 없으면(null/undefined) "미측정"만 보여준다. 절대 임의 숫자를 대신 넣지 않는다.
function fmt(value: number | null | undefined, unit = ''): string {
  if (value === null || value === undefined) return '미측정';
  return `${value}${unit}`;
}

// 요구사항분석서 NFR-01·NFR-02 기준으로 판정한다.
// 필요한 값 중 하나라도 없으면 'pending'(판정 보류)이며, 이때는 절대 pass로 표시하지 않는다.
function evaluateRequirement(model: AIModel): RequirementVerdict {
  const { defectImageRecall, normalFalsePositiveRate, p95LatencyMs, gpuMemoryMb } = model;

  if (
    defectImageRecall == null ||
    normalFalsePositiveRate == null ||
    p95LatencyMs == null ||
    gpuMemoryMb == null
  ) {
    return 'pending';
  }

  const passRecall = defectImageRecall >= MODEL_REQUIREMENTS.minDefectImageRecall;
  const passFpr = normalFalsePositiveRate <= MODEL_REQUIREMENTS.maxNormalFalsePositiveRate;
  const passLatency = p95LatencyMs <= MODEL_REQUIREMENTS.maxP95LatencyMs;
  const passGpu = gpuMemoryMb <= MODEL_REQUIREMENTS.maxGpuMemoryMb;

  return passRecall && passFpr && passLatency && passGpu ? 'pass' : 'fail';
}

function verdictMeta(verdict: RequirementVerdict) {
  switch (verdict) {
    case 'pass':
      return { label: '요구조건 충족', className: 'badge-pass', Icon: CheckCircle2 };
    case 'fail':
      return { label: '요구조건 미충족', className: 'badge-fail', Icon: XCircle };
    case 'pending':
      return { label: '판정 보류(미측정)', className: 'badge-warn', Icon: AlertTriangle };
  }
}

// 후보 목록/필드 구조가 바뀔 때마다 이 숫자를 올려주세요.
// localStorage에 저장된 버전이 이 값과 다르면, 예전 캐시 대신 최신 mockModels로 초기화합니다.
// (안 그러면 브라우저에 예전 버전 데이터가 남아있어서 mockData.ts를 바꿔도 화면이 안 바뀝니다.)
const MODELS_STORAGE_VERSION = 2;
const MODELS_STORAGE_KEY = 'aiModels';

export default function Models() {
  const [models, setModels] = useState<AIModel[]>(() => {
    try {
      const raw = localStorage.getItem(MODELS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed === 'object' &&
          parsed.version === MODELS_STORAGE_VERSION &&
          Array.isArray(parsed.data)
        ) {
          return parsed.data;
        }
      }
    } catch {
      // 저장된 값이 깨졌으면 무시하고 최신 후보 목록으로 초기화
    }
    return mockModels;
  });
  // 데모 모드: 실제 측정값이 아니라 UI 확인용 가정 수치(demoModels)를 보여줄지 여부.
  // 켜져 있는 동안은 실제 데이터(models)를 건드리지 않도록 편집 버튼을 막는다.
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedDefectTypes, setSelectedDefectTypes] = useState<DefectType[]>([]);
  const [newModelName, setNewModelName] = useState('');
  const [newModelVersion, setNewModelVersion] = useState('');
  const [newModelDescription, setNewModelDescription] = useState('');

  const persist = (next: AIModel[]) => {
    setModels(next);
    localStorage.setItem(
      MODELS_STORAGE_KEY,
      JSON.stringify({ version: MODELS_STORAGE_VERSION, data: next })
    );
  };

  // 요구조건을 충족한 모델만 운영 모델로 지정할 수 있다.
  // 지정하는 순간 다른 모델은 전부 비활성화되어, 운영 모델은 항상 0개 또는 1개로 유지된다.
  // 참고(FR-07~08): 실제 운영에서는 여기서 상태만 바꾸는 게 아니라, 백엔드 연동 후
  // 실제 추론 호출과 DB 저장까지 확인된 뒤에 "적용 완료"로 표시해야 한다. 지금은 프론트 단독 목업 단계라
  // 상태 전환까지만 구현하고, 백엔드 연결 시 이 부분에 실제 연동 확인 단계를 추가해야 한다.
  const setAsOperatingModel = (id: string) => {
    const target = models.find((m) => m.id === id);
    if (!target) return;

    if (evaluateRequirement(target) !== 'pass') {
      window.alert('요구조건을 충족한 모델만 운영 모델로 지정할 수 있습니다.');
      return;
    }

    persist(
      models.map((m) => ({
        ...m,
        status: m.id === id ? 'active' : 'inactive',
      }))
    );
  };

  const deactivate = (id: string) => {
    persist(models.map((m) => (m.id === id ? { ...m, status: 'inactive' } : m)));
  };

  const deleteModel = (id: string) => {
    const target = models.find((m) => m.id === id);
    if (!target) return;
    if (target.status === 'active') return; // 운영 중인 모델은 삭제 불가

    const confirmed = window.confirm(`"${target.name}" 후보 모델을 삭제하시겠습니까?`);
    if (!confirmed) return;

    persist(models.filter((m) => m.id !== id));
    if (selectedModel?.id === id) setSelectedModel(null);
  };

  // 새 후보 등록 시에도 성능 지표는 전부 미측정(null)으로 시작한다. 임의값을 넣지 않는다.
  const registerModel = () => {
    if (!newModelName.trim() || !newModelVersion.trim()) {
      window.alert('모델 이름과 버전을 입력해주세요.');
      return;
    }

    const newModel: AIModel = {
      id: `model-${Date.now()}`,
      name: newModelName.trim(),
      version: newModelVersion.trim(),
      status: 'inactive',
      evalCondition: models[0]?.evalCondition ?? {
        gpu: '미지정',
        inputSize: '640x640',
        batchSize: 1,
        precision: 'FP32',
      },

      mAP50: null,
      classRecall: {},
      defectImageRecall: null,
      normalFalsePositiveRate: null,
      p95LatencyMs: null,

      accuracy: null,
      precision: null,
      recall: null,
      f1Score: null,
      mAP: null,
      fps: null,
      latencyMs: null,
      gpuMemoryMb: null,
      modelSizeMb: null,

      trainedAt: null,
      datasetSize: null,
      description: newModelDescription.trim() || '비교 대상으로 등록된 후보 모델입니다.',
      defectTypes: selectedDefectTypes,
    };

    persist([...models, newModel]);
    setNewModelName('');
    setNewModelVersion('');
    setNewModelDescription('');
    setSelectedDefectTypes([]);
    setIsRegisterModalOpen(false);
  };

  // 화면에 실제로 그릴 목록. 데모 모드일 때만 가정 수치(demoModels)를 쓰고,
  // 평소에는 실제 데이터(models, 기본값은 전부 미측정)를 그대로 쓴다.
  const displayModels = isDemoMode ? demoModels : models;

  const operatingModel = displayModels.find((m) => m.status === 'active') ?? null;
  const passCount = displayModels.filter((m) => evaluateRequirement(m) === 'pass').length;
  const commonCondition = displayModels[0]?.evalCondition;

  return (
    <PageContainer>
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="비교 후보 모델"
          value={models.length}
          icon={<Cpu className="w-5 h-5" />}
          accent="navy"
        />
        <StatCard
          title="요구조건 충족 후보"
          value={passCount}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accent="green"
        />
        <StatCard
          title="운영 모델"
          value={operatingModel ? operatingModel.name : '미선정'}
          icon={<Server className="w-5 h-5" />}
          accent={operatingModel ? 'green' : 'amber'}
        />
        <StatCard
          title="공통 비교 조건"
          value={commonCondition ? `${commonCondition.inputSize} · Batch ${commonCondition.batchSize}` : '-'}
          icon={<Activity className="w-5 h-5" />}
          accent="navy"
        />
      </div>

      {/* 운영 모델 미선정 배너 */}
      {!operatingModel && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">운영 모델 미선정</p>
            <p className="mt-0.5 text-amber-700">
              요구조건(부품 Recall ≥ {MODEL_REQUIREMENTS.minDefectImageRecall}%, p95 ≤{' '}
              {MODEL_REQUIREMENTS.maxP95LatencyMs}ms, GPU 메모리 ≤ {MODEL_REQUIREMENTS.maxGpuMemoryMb}MB)을
              충족한 후보가 없거나, 아직 평가가 끝나지 않았습니다. 평가 완료 후 조건을 충족하는 모델을
              지정해주세요.
            </p>
          </div>
        </div>
      )}

      {/* 공통 비교 조건 */}
      {commonCondition && (
        <div className="card p-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
          <span className="font-medium text-navy-900">공통 비교 조건 (NFR-03)</span>
          <span>GPU: {commonCondition.gpu}</span>
          <span>입력 크기: {commonCondition.inputSize}</span>
          <span>배치: {commonCondition.batchSize}</span>
          <span>정밀도: {commonCondition.precision}</span>
        </div>
      )}

      {/* 비교표 */}
      <div className="card p-5">
        <SectionTitle
          title="후보 모델 비교"
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDemoMode((prev) => !prev)}
                className={isDemoMode ? 'btn-primary' : 'btn-secondary'}
              >
                <Activity className="w-4 h-4" />
                {isDemoMode ? '실측 데이터 보기' : '데모로 보기'}
              </button>
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                disabled={isDemoMode}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                후보 추가
              </button>
            </div>
          }
        />

        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm min-w-[1180px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-xs font-medium tracking-wide text-gray-500">
                <th className="py-3 pr-6 whitespace-nowrap border-b border-gray-200 min-w-[190px]">모델 / 버전</th>
                <th className="py-3 pr-6 whitespace-nowrap border-b border-gray-200 min-w-[150px]">상태</th>
                <th className="py-3 pr-6 whitespace-nowrap border-b border-gray-200 min-w-[90px]">mAP@0.5</th>
                <th className="py-3 pr-6 whitespace-nowrap border-b border-gray-200 min-w-[120px]">불량 이미지 Recall</th>
                <th className="py-3 pr-6 whitespace-nowrap border-b border-gray-200 min-w-[160px]">클래스별 Recall</th>
                <th className="py-3 pr-6 whitespace-nowrap border-b border-gray-200 min-w-[100px]">양품 오검률</th>
                <th className="py-3 pr-6 whitespace-nowrap border-b border-gray-200 min-w-[100px]">p95 추론시간</th>
                <th className="py-3 pr-6 whitespace-nowrap border-b border-gray-200 min-w-[100px]">GPU 메모리</th>
                <th className="py-3 pr-6 whitespace-nowrap border-b border-gray-200 min-w-[90px]">모델 크기</th>
                <th className="py-3 pr-0 whitespace-nowrap border-b border-gray-200 min-w-[190px]">액션</th>
              </tr>
            </thead>
            <tbody>
              {displayModels.map((model) => {
                const verdict = evaluateRequirement(model);
                const meta = verdictMeta(verdict);
                const VerdictIcon = meta.Icon;
                const classRecallEntries = Object.entries(model.classRecall ?? {});

                return (
                  <tr key={model.id} className="align-middle odd:bg-white even:bg-gray-50/60 hover:bg-navy-50/40">
                    <td className="py-4 pr-6 border-b border-gray-100">
                      <button
                        onClick={() => setSelectedModel(model)}
                        className="text-left hover:underline"
                      >
                        <p className="font-medium text-navy-900 whitespace-nowrap">{model.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <GitBranch className="w-3 h-3" />
                          {model.version}
                        </p>
                      </button>
                    </td>
                    <td className="py-4 pr-6 border-b border-gray-100">
                      <div className="flex flex-col items-start gap-1.5">
                        {model.status === 'active' && (
                          <span className="badge-pass w-fit whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3" />
                            운영 중
                          </span>
                        )}
                        <span className={`${meta.className} w-fit whitespace-nowrap`}>
                          <VerdictIcon className="w-3 h-3" />
                          {meta.label}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 pr-6 border-b border-gray-100 whitespace-nowrap">{fmt(model.mAP50, '%')}</td>
                    <td className="py-4 pr-6 border-b border-gray-100 whitespace-nowrap">
                      {fmt(model.defectImageRecall, '%')}
                    </td>
                    <td className="py-4 pr-6 border-b border-gray-100">
                      {classRecallEntries.length === 0 ? (
                        <span className="text-gray-500">미측정</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {classRecallEntries.map(([key, value]) => (
                            <span
                              key={key}
                              className="text-xs px-1.5 py-0.5 rounded bg-gray-50 border border-gray-200 whitespace-nowrap"
                            >
                              {defectLabel(key as DefectType)} {value}%
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-4 pr-6 border-b border-gray-100 whitespace-nowrap">
                      {fmt(model.normalFalsePositiveRate, '%')}
                    </td>
                    <td className="py-4 pr-6 border-b border-gray-100 whitespace-nowrap">
                      {fmt(model.p95LatencyMs, ' ms')}
                    </td>
                    <td className="py-4 pr-6 border-b border-gray-100 whitespace-nowrap">
                      {fmt(model.gpuMemoryMb, ' MB')}
                    </td>
                    <td className="py-4 pr-6 border-b border-gray-100 whitespace-nowrap">
                      {fmt(model.modelSizeMb, ' MB')}
                    </td>
                    <td className="py-4 pr-0 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        {model.status === 'active' ? (
                          <button
                            onClick={() => deactivate(model.id)}
                            disabled={isDemoMode}
                            className="btn-secondary text-xs px-2.5 py-1.5 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            운영 해제
                          </button>
                        ) : (
                          <button
                            onClick={() => setAsOperatingModel(model.id)}
                            disabled={isDemoMode || verdict !== 'pass'}
                            className="btn-primary text-xs px-2.5 py-1.5 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            운영 모델로 지정
                          </button>
                        )}
                        <button
                          onClick={() => deleteModel(model.id)}
                          disabled={isDemoMode || model.status === 'active'}
                          className="shrink-0 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {selectedModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedModel(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-navy-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy-900">
                    {selectedModel.name} {selectedModel.version}
                  </h3>
                  <p className="text-xs text-gray-500">{selectedModel.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedModel(null)}
                className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-sm text-gray-600">{selectedModel.description}</p>

              <div>
                <h4 className="text-sm font-medium mb-2">탐지 성능</h4>
                <div className="grid grid-cols-2 gap-3">
                  <DetailMetric label="mAP@0.5" value={fmt(selectedModel.mAP50, '%')} />
                  <DetailMetric
                    label="불량 이미지 Recall"
                    value={fmt(selectedModel.defectImageRecall, '%')}
                  />
                  <DetailMetric
                    label="양품 오검률"
                    value={fmt(selectedModel.normalFalsePositiveRate, '%')}
                  />
                  <DetailMetric
                    label="요구조건 판정"
                    value={verdictMeta(evaluateRequirement(selectedModel)).label}
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">클래스별 Recall</h4>
                {Object.keys(selectedModel.classRecall ?? {}).length === 0 ? (
                  <p className="text-xs text-gray-500">미측정</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedModel.classRecall ?? {}).map(([key, value]) => (
                      <span
                        key={key}
                        className="text-xs px-2.5 py-1 rounded-md border border-gray-200 text-gray-600"
                      >
                        {defectLabel(key as DefectType)} {value}%
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">연산 효율</h4>
                <div className="grid grid-cols-2 gap-3">
                  <DetailMetric label="p95 추론시간" value={fmt(selectedModel.p95LatencyMs, ' ms')} />
                  <DetailMetric label="GPU Memory" value={fmt(selectedModel.gpuMemoryMb, ' MB')} />
                  <DetailMetric label="Model Size" value={fmt(selectedModel.modelSizeMb, ' MB')} />
                </div>
              </div>

              {selectedModel.evalCondition && (
                <div>
                  <h4 className="text-sm font-medium mb-2">평가 조건</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                    <DetailMetric label="GPU" value={selectedModel.evalCondition.gpu} />
                    <DetailMetric label="입력 크기" value={selectedModel.evalCondition.inputSize} />
                    <DetailMetric label="배치" value={`${selectedModel.evalCondition.batchSize}`} />
                    <DetailMetric label="정밀도" value={selectedModel.evalCondition.precision} />
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-navy-900 mb-2">학습 데이터</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-gray-400" />
                    {selectedModel.datasetSize != null
                      ? `${selectedModel.datasetSize.toLocaleString()}건`
                      : '미측정'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {selectedModel.trainedAt
                      ? new Date(selectedModel.trainedAt).toLocaleDateString('ko-KR')
                      : '미측정'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-navy-900 mb-2">검출 가능 결함 유형</p>
                <div className="flex flex-wrap gap-2">
                  {selectedModel.defectTypes.map((dt) => {
                    const dtMeta = DEFECT_TYPES.find((d) => d.key === dt);
                    return (
                      <span
                        key={dt}
                        className="text-xs px-2.5 py-1 rounded-md border border-gray-200 text-gray-600"
                        style={{ borderLeft: `3px solid ${dtMeta?.color}` }}
                      >
                        {defectLabel(dt)}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsRegisterModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-navy-900">비교 후보 모델 추가</h3>
                <p className="text-xs text-gray-500 mt-1">
                  성능 지표는 평가 전이므로 미측정으로 시작합니다.
                </p>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">모델 이름</label>
                <input
                  type="text"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder="예: YOLO11s"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">버전</label>
                <input
                  type="text"
                  value={newModelVersion}
                  onChange={(e) => setNewModelVersion(e.target.value)}
                  placeholder="예: v1.0"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">모델 설명</label>
                <textarea
                  value={newModelDescription}
                  onChange={(e) => setNewModelDescription(e.target.value)}
                  placeholder="모델에 대한 설명을 입력하세요."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-navy-200"
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-slate-700">적용 불량 유형</label>
                <label className="mb-3 flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedDefectTypes.length === DEFECT_TYPES.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDefectTypes(DEFECT_TYPES.map((type) => type.key));
                      } else {
                        setSelectedDefectTypes([]);
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium text-slate-700">전체 선택</span>
                </label>
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-3">
                  {DEFECT_TYPES.map((type) => (
                    <label
                      key={type.key}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDefectTypes.includes(type.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDefectTypes((prev) => [...prev, type.key]);
                          } else {
                            setSelectedDefectTypes((prev) => prev.filter((key) => key !== type.key));
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-slate-700" style={{ color: type.color }}>
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  취소
                </button>
                <button type="button" onClick={registerModel} className="btn-primary text-sm px-4 py-2">
                  후보 추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-bold text-navy-900">{value}</p>
      </div>
    </div>
  );
}
