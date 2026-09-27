import { DEFECT_TYPES, type AIModel, type Defect, type InspectionRecord ,type PartCategory,} from '@/types';

const partNames: Record<PartCategory, { name: string; number: string }> = {
  door: { name: '도어', number: 'DOOR-001' },
  radiator_grille: { name: '라디에이터 그릴', number: 'RAD-GRL-001' },
  roofside: { name: '루프사이드', number: 'ROOF-001' },
  wiring: { name: '배선', number: 'WIRING-001' },
  bumper: { name: '범퍼', number: 'BUMPER-001' },
  cowl_cover: { name: '카울커버', number: 'COWL-001' },
  connector: { name: '커넥터', number: 'CONN-001' },
  tail_lamp: { name: '테일 램프', number: 'TAIL-001' },
  frame: { name: '프레임', number: 'FRAME-001' },
  head_lamp: { name: '헤드 램프', number: 'HEAD-001' },
  fender: { name: '휀더', number: 'FENDER-001' },
};

const inspectors = ['김민준', '이서연', '박지호', '최유진', '정도현'];

// 화면 데모용 불량 샘플입니다.
// AI-Hub의 전체 12개 불량 유형을 의미하는 것이 아니라,
// 현재 화면에서 사용할 대표적인 불량 유형만 정의합니다.
// 실제 불량 유형별 confidence, severity, description은
// 추후 AI 검사 결과를 연동할 때 실제 결과값으로 대체합니다.

const defectTemplates: Omit<Defect, 'id' | 'bbox'>[] = [
  { type: 'scratch', severity: 'minor', confidence: 0.92, description: '표면 스크래치 (길이 약 15mm)' },
  { type: 'appearance_damage', severity: 'major', confidence: 0.88, description: '충격으로 인한 외관 손상 (직경 약 20mm)' },
  { type: 'step', severity: 'major', confidence: 0.85, description: '단차 발생 (약 3mm)' },
  { type: 'hole_deformation', severity: 'critical', confidence: 0.95, description: '홀 형상 변형 감지' },
  { type: 'looseness', severity: 'critical', confidence: 0.91, description: '유격 발생 (편차 약 3mm)' },
  { type: 'sealing', severity: 'minor', confidence: 0.79, description: '실링 불량 감지' },
  { type: 'connection', severity: 'minor', confidence: 0.82, description: '연계 불량' },
  { type: 'fastening', severity: 'major', confidence: 0.97, description: '볼트 체결 누락 (2개소)' },
];

function randomBbox(): Defect['bbox'] {
  return {
    x: Math.round(Math.random() * 400 + 50),
    y: Math.round(Math.random() * 300 + 30),
    width: Math.round(Math.random() * 120 + 40),
    height: Math.round(Math.random() * 100 + 30),
  };
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

const categories = Object.keys(partNames) as PartCategory[];

function generateRecords(count: number): InspectionRecord[] {
  const records: InspectionRecord[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const cat = categories[i % categories.length];
    const part = partNames[cat];
    const isPass = Math.random() > 0.28;
    const isPending = !isPass && Math.random() > 0.92;
    const result = isPending ? 'pending' : isPass ? 'pass' : 'fail';

    const defectCount = isPass ? 0 : Math.floor(Math.random() * 3) + 1;
    const defects: Defect[] = pickRandom(defectTemplates, defectCount).map((d, idx) => ({
      ...d,
      id: `${i}-d${idx}`,
      bbox: randomBbox(),
    }));

    const minutesAgo = i * 37 + Math.floor(Math.random() * 30);
    const inspectedAt = new Date(now.getTime() - minutesAgo * 60000);

    records.push({
      id: `INS-${String(20250923 - i).padStart(6, '0')}`,
      partName: part.name,
      partNumber: part.number,
      category: cat,
      result,
      inspectedAt: inspectedAt.toISOString(),
      inspector: inspectors[i % inspectors.length],
      modelId: 'model-v2',
      modelName: 'PartsDefectNet v2.3',
      confidence: isPass ? Math.round(Math.random() * 8 + 91) : Math.round(Math.random() * 12 + 84),
      processingTimeMs: Math.round(Math.random() * 400 + 120),
      imageUrl: '',
      defects,
    });
  }

  return records;
}

export const mockRecords: InspectionRecord[] = generateRecords(48);

// 요구사항분석서 NFR-03: 모든 후보를 같은 조건에서 비교
// 모델 학습 가이드 기준 실제 장비(RTX 5070 Ti 16GB). 다른 팀원 PC로 벤치마크를 돌린다면 여기를 그 장비명으로 바꿔주세요.
// 주의: 학습 스크립트의 --image-size 800(파일럿 학습 설정)과 이 640x640(추론 비교 조건, NFR-03)은 서로 다른 값입니다. 혼동하지 마세요.
const COMMON_EVAL_CONDITION = {
  gpu: 'RTX 5070 Ti (16GB)',
  inputSize: '640x640',
  batchSize: 1,
  precision: 'FP32' as const,
};


/**
 * 비교 후보 4종.
 * 요청하신 대로 "동시에 운영"하는 목록이 아니라, 같은 조건에서 비교 평가할 후보 목록입니다.
 * 아직 실제 벤치마크가 끝난 모델이 없으므로 mAP50 / classRecall / defectImageRecall /
 * normalFalsePositiveRate / p95LatencyMs / gpuMemoryMb / modelSizeMb 는 전부 null(미측정)입니다.
 * AI 파트에서 평가 결과가 나오면 해당 모델 객체의 숫자만 채워주면 됩니다.
 */
export const mockModels: AIModel[] = [
  {
    id: 'swin-faster-rcnn',
    name: 'Swin-T + Faster R-CNN',
    version: 'v1.0',
    status: 'inactive', // 아직 요구조건 충족 여부를 판정할 수 없으므로 운영(active) 아님
    evalCondition: COMMON_EVAL_CONDITION,

    mAP50: null,
    classRecall: {},
    defectImageRecall: null,
    normalFalsePositiveRate: null,
    p95LatencyMs: null,

    // 아래 기존 필드들은 타입 호환을 위해 남겨두되, 미측정 상태를 나타내려면 null 허용이 필요합니다.
    // (types.ts에서 이 필드들을 number | null 로 바꿨다면 null로, 아니라면 팀과 상의해 처리 방식을 정해주세요)
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
    description:
      'Swin Transformer Tiny 백본과 Faster R-CNN을 결합한 후보 모델. 정밀한 불량 탐지를 우선하는 검사 환경을 가정한다. Faster R-CNN과의 결합 구현·검증이 필요하다.',
      defectTypes: DEFECT_TYPES.map((type) => type.key),
  },
  {
    id: 'resnet50-fpn-faster-rcnn',
    name: 'ResNet50-FPN + Faster R-CNN',
    version: 'v1.0',
    status: 'inactive',
    evalCondition: COMMON_EVAL_CONDITION,

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
    description:
      'ResNet-50 + FPN 백본을 사용하는 CNN 기준(Baseline) 모델. Faster R-CNN과 결합해 비교 기준점 역할을 한다.',
      defectTypes: DEFECT_TYPES.map((type) => type.key),
  },
  {
    id: 'yolo11s',
    name: 'YOLO11s',
    version: 'v11.0',
    status: 'inactive',
    evalCondition: COMMON_EVAL_CONDITION,

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
    description:
      '실시간 추론 속도를 우선하는 YOLO11 계열 경량 모델. 빠른 처리 속도가 중요한 검사 환경을 가정한다.',
      defectTypes: DEFECT_TYPES.map((type) => type.key),
  },
  {
    id: 'rt-detrv2-r18',
    name: 'RT-DETRv2-R18',
    version: 'v2.0',
    status: 'inactive',
    evalCondition: COMMON_EVAL_CONDITION,

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
    description:
      'ResNet-18 백본 기반 실시간 트랜스포머 탐지기(RT-DETRv2). NMS 없이 end-to-end로 동작하며 속도와 정확도의 균형을 검증 대상으로 한다.',
      defectTypes: DEFECT_TYPES.map((type) => type.key),
  },
];

/**
 * ⚠️ 데모 전용 데이터입니다. 실제 측정값이 아니라 "화면이 다 채워졌을 때 어떻게 보이는지"
 * 확인하기 위해 가정한 수치입니다. Models.tsx의 "데모로 보기" 토글에서만 사용하고,
 * 기본 화면(mockModels)에는 절대 섞지 마세요.
 *
 * 요구조건 판정의 세 가지 상태(pass / fail / pending)를 모두 보여주도록 구성했습니다.
 * - Swin-T + Faster R-CNN: 요구조건 충족(pass) + 실제 운영 모델로 지정된 상태
 * - ResNet50-FPN + Faster R-CNN: 측정은 됐지만 GPU 메모리 초과로 요구조건 미충족(fail)
 * - YOLO11s: 측정은 됐지만 Recall 미달로 요구조건 미충족(fail)
 * - RT-DETRv2-R18: 아직 일부 항목이 안 끝나서 판정 보류(pending)
 */
export const demoModels: AIModel[] = [
  {
    ...mockModels[0],
    status: 'active',
    mAP50: 96.8,
    classRecall: {
      scratch: 97.2,
      appearance_damage: 95.4,
      step: 96.1,
      hole_deformation: 98.0,
      looseness: 94.8,
      sealing: 96.5,
    },
    defectImageRecall: 96.3,
    normalFalsePositiveRate: 4.1,
    p95LatencyMs: 210,
    gpuMemoryMb: 4600,
    modelSizeMb: 180,
    trainedAt: '2026-09-10T09:00:00Z',
    datasetSize: 1000,
  },
  {
    ...mockModels[1],
    status: 'inactive',
    mAP50: 93.5,
    classRecall: {
      scratch: 94.0,
      appearance_damage: 91.2,
      step: 92.8,
      hole_deformation: 95.1,
    },
    defectImageRecall: 95.4,
    normalFalsePositiveRate: 6.8,
    p95LatencyMs: 340,
    gpuMemoryMb: 8800, // NFR-02 상한(8000MB) 초과 → 요구조건 미충족 예시
    modelSizeMb: 210,
    trainedAt: '2026-09-12T09:00:00Z',
    datasetSize: 1000,
  },
  {
    ...mockModels[2],
    status: 'inactive',
    mAP50: 90.2,
    classRecall: {
      scratch: 92.5,
      appearance_damage: 88.0,
      step: 89.6,
      hole_deformation: 93.2,
    },
    defectImageRecall: 91.7, // NFR-01 기준(95%) 미달 → 요구조건 미충족 예시
    normalFalsePositiveRate: 9.4,
    p95LatencyMs: 95,
    gpuMemoryMb: 2800,
    modelSizeMb: 42,
    trainedAt: '2026-09-14T09:00:00Z',
    datasetSize: 1000,
  },
  {
    ...mockModels[3],
    status: 'inactive',
    mAP50: 94.9,
    classRecall: {
      scratch: 95.5,
      appearance_damage: 93.1,
    },
    defectImageRecall: 95.9,
    normalFalsePositiveRate: null, // 아직 이 항목만 측정 전 → 판정 보류(pending) 예시
    p95LatencyMs: 260,
    gpuMemoryMb: 5200,
    modelSizeMb: 76,
    trainedAt: '2026-09-16T09:00:00Z',
    datasetSize: 1000,
  },
];

export const dashboardStats = {
  todayInspections: mockRecords.filter(
    (r) => new Date(r.inspectedAt).toDateString() === new Date().toDateString()
  ).length,
  totalInspections: mockRecords.length,
  passRate: Math.round(
    (mockRecords.filter((r) => r.result === 'pass').length / mockRecords.length) * 1000
  ) / 10,
  failRate: Math.round(
    (mockRecords.filter((r) => r.result === 'fail').length / mockRecords.length) * 1000
  ) / 10,
  activeModels: mockModels.filter((m) => m.status === 'active').length,
  pendingCount: mockRecords.filter((r) => r.result === 'pending').length,
};

export const hourlyData = [
  { hour: '09:00', pass: 12, fail: 3 },
  { hour: '10:00', pass: 18, fail: 5 },
  { hour: '11:00', pass: 22, fail: 4 },
  { hour: '12:00', pass: 15, fail: 2 },
  { hour: '13:00', pass: 8, fail: 1 },
  { hour: '14:00', pass: 25, fail: 6 },
  { hour: '15:00', pass: 20, fail: 7 },
  { hour: '16:00', pass: 17, fail: 3 },
];

export const weeklyData = [
  { day: '월', pass: 142, fail: 38 },
  { day: '화', pass: 156, fail: 42 },
  { day: '수', pass: 168, fail: 31 },
  { day: '목', pass: 149, fail: 45 },
  { day: '금', pass: 175, fail: 28 },
  { day: '토', pass: 98, fail: 19 },
  { day: '일', pass: 62, fail: 12 },
];
