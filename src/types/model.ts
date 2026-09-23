export interface ModelMetrics {
  recall: number;      // 0~1
  precision: number;   // 0~1
  map50: number;       // 0~1
  p95LatencyMs: number;
  gpuMemoryGb: number;
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
