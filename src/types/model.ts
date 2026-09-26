export interface ModelMetrics {
  recall: number;      // 0~1
  precision: number;   // 0~1
  map50: number;       // 0~1
  p95LatencyMs: number;
  gpuMemoryGb: number;
}

// 요구제안서 NFR-01(탐지 성능), NFR-02(처리·자원) 수치 기준
export const NFR_THRESHOLDS = {
  minRecall: 0.95,        // NFR-01: 부품 Recall ≥ 95% (FN 최소화 우선)
  minPrecision: 0.90,     // NFR-01: Precision ≥ 90%
  maxP95LatencyMs: 500,   // NFR-02: 이미지 처리 p95 ≤ 500ms
  maxGpuMemoryGb: 8,      // NFR-02: 최대 GPU 메모리 ≤ 8GB
} as const;

export function evaluateNfr(metrics: ModelMetrics): { status: NfrStatus; unmetReasons: string[] } {
  const reasons: string[] = [];
  if (metrics.recall < NFR_THRESHOLDS.minRecall) {
    reasons.push(`Recall ${(metrics.recall * 100).toFixed(1)}% < ${NFR_THRESHOLDS.minRecall * 100}%`);
  }
  if (metrics.precision < NFR_THRESHOLDS.minPrecision) {
    reasons.push(`Precision ${(metrics.precision * 100).toFixed(1)}% < ${NFR_THRESHOLDS.minPrecision * 100}%`);
  }
  if (metrics.p95LatencyMs > NFR_THRESHOLDS.maxP95LatencyMs) {
    reasons.push(`p95 ${metrics.p95LatencyMs}ms > ${NFR_THRESHOLDS.maxP95LatencyMs}ms`);
  }
  if (metrics.gpuMemoryGb > NFR_THRESHOLDS.maxGpuMemoryGb) {
    reasons.push(`GPU ${metrics.gpuMemoryGb}GB > ${NFR_THRESHOLDS.maxGpuMemoryGb}GB`);
  }
  return { status: reasons.length === 0 ? 'met' : 'unmet', unmetReasons: reasons };
}

export type NfrStatus = 'met' | 'unmet';

export interface CandidateModel {
  id: string;
  name: string;
  note?: string;
  metrics: ModelMetrics;
  nfrStatus: NfrStatus;
  unmetReason?: string;
  isApplied: boolean;
}
