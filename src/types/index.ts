export type DefectType =
  | 'scratch'
  | 'appearance_damage'
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

export type InspectionResult = 'pass' | 'fail' | 'pending';

export type PartCategory =
  | 'door'
  | 'radiator_grille'
  | 'roofside'
  | 'wiring'
  | 'bumper'
  | 'cowl_cover'
  | 'connector'
  | 'tail_lamp'
  | 'frame'
  | 'head_lamp'
  | 'fender';

export interface Defect {
  id: string;
  type: DefectType;
  severity: 'critical' | 'major' | 'minor';
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  description: string;
}

export interface InspectionRecord {
  id: string;
  partName: string;
  partNumber: string;
  category: PartCategory;
  result: InspectionResult;
  inspectedAt: string;
  inspector: string;
  modelId: string;
  modelName: string;
  confidence: number;
  processingTimeMs: number;
  imageUrl: string;
  defects: Defect[];
  notes?: string;
}

// 요구사항분석서 NFR-03: 모든 후보를 같은 조건에서 비교하기 위한 공통 실행 조건
export interface EvalCondition {
  gpu: string; // 예: 'RTX 3090 (1대)' — 실제 사용 장비명으로 교체 필요
  inputSize: string; // '640x640'
  batchSize: number; // 1
  precision: 'FP32';
}

// 클래스(불량 유형)별 Recall. 아직 측정 안 한 유형은 키 자체를 넣지 않으면 됨
export type ClassRecallMap = Partial<Record<DefectType, number>>;

export interface AIModel {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'inactive' | 'training';
  trainingEpoch?: number;
  totalEpochs?: number;

  // 요구사항분석서 NFR-03 공통 비교 조건
  evalCondition?: EvalCondition;

  // 비교표에 쓰이는 신규 지표 — 평가 전이면 null(미측정), 임의값 금지
  mAP50?: number | null; // mAP@0.5
  classRecall?: ClassRecallMap; // 클래스(불량 유형)별 Recall
  defectImageRecall?: number | null; // 불량 이미지 단위 Recall (NFR-01의 부품 Recall)
  normalFalsePositiveRate?: number | null; // 양품을 불량으로 오검한 비율(%)
  p95LatencyMs?: number | null; // p95 추론 시간(ms)

  // 기존 탐지 성능 필드 — 신규 비교표에는 쓰이지 않지만 하위 호환을 위해 유지.
  // 값이 없으면 null로 두고, 다른 화면에서 이 필드를 쓴다면 null 처리를 함께 해주세요.
  accuracy?: number | null;
  precision?: number | null;
  recall?: number | null;
  f1Score?: number | null;
  mAP?: number | null;

  // 기존 연산 효율 필드 — gpuMemoryMb/modelSizeMb는 신규 비교표에서도 그대로 사용
  fps?: number | null;
  latencyMs?: number | null;
  gpuMemoryMb?: number | null;
  modelSizeMb?: number | null;

  trainedAt?: string | null;
  datasetSize?: number | null;
  description: string;
  defectTypes: DefectType[];
}

// 요구사항분석서 NFR-01 · NFR-02 기준값
// ⚠️ 실제 임계값은 팀 회의에서 확정된 값으로 다시 확인해주세요 (PPT에는 참고용 PoC 목표로 명시됨)
export const MODEL_REQUIREMENTS = {
  minDefectImageRecall: 95, // % (NFR-01: Recall ≥ 95%)
  maxNormalFalsePositiveRate: 10, // % (NFR-01: Precision ≥ 90%의 근사 상한)
  maxP95LatencyMs: 500, // ms (NFR-02)
  maxGpuMemoryMb: 8000, // MB = 8GB (NFR-02)
} as const;

// 후보 모델의 요구조건 충족 판정 결과
export type RequirementVerdict = 'pass' | 'fail' | 'pending';
// pending = 필요한 측정값 중 하나 이상이 아직 없어서 판정할 수 없는 상태

export interface DefectTypeMeta {
  key: DefectType;
  label: string;
  color: string;
}

export interface PartCategoryMeta {
  key: PartCategory;
  label: string;
}

export const DEFECT_TYPES: DefectTypeMeta[] = [
  { key: 'scratch', label: '스크래치', color: '#f59e0b' },
  { key: 'appearance_damage', label: '외관 손상', color: '#8b5cf6' },
  { key: 'step', label: '단차', color: '#dc2626' },
  { key: 'mounting', label: '장착 불량', color: '#0891b2' },
  { key: 'fixing', label: '고정 불량', color: '#16a34a' },
  { key: 'pin_fixing', label: '고정핀 불량', color: '#ca8a04' },
  { key: 'connection', label: '연계 불량', color: '#2563eb' },
  { key: 'looseness', label: '유격 불량', color: '#9333ea' },
  { key: 'fastening', label: '체결 불량', color: '#ea580c' },
  { key: 'sealing', label: '실링 불량', color: '#0d9488' },
  { key: 'hemming', label: '헤밍 불량', color: '#db2777' },
  { key: 'hole_deformation', label: '홀 변형', color: '#475569' },
];

export const defectLabel = (key: DefectType): string => {
  const defect = DEFECT_TYPES.find((item) => item.key === key);
  return defect ? defect.label : key;
};

export const PART_CATEGORIES: PartCategoryMeta[] = [
  { key: 'door', label: '도어' },
  { key: 'radiator_grille', label: '라디에이터 그릴' },
  { key: 'roofside', label: '루프사이드' },
  { key: 'wiring', label: '배선' },
  { key: 'bumper', label: '범퍼' },
  { key: 'cowl_cover', label: '카울커버' },
  { key: 'connector', label: '커넥터' },
  { key: 'tail_lamp', label: '테일 램프' },
  { key: 'frame', label: '프레임' },
  { key: 'head_lamp', label: '헤드 램프' },
  { key: 'fender', label: '휀더' },
];

export const categoryLabel = (cat: PartCategory): string =>
  PART_CATEGORIES.find((c) => c.key === cat)?.label ?? cat;

export const resultMeta = (result: InspectionResult) => {
  switch (result) {
    case 'pass':
      return { label: '정상', className: 'badge-pass' };
    case 'fail':
      return { label: '불량', className: 'badge-fail' };
    case 'pending':
      return { label: '검사중', className: 'badge-warn' };
  }
};

export const severityMeta = (severity: Defect['severity']) => {
  switch (severity) {
    case 'critical':
      return { label: '치명적', className: 'badge-fail' };
    case 'major':
      return { label: '중대', className: 'badge-warn' };
    case 'minor':
      return { label: '경미', className: 'badge-info' };
  }
};
