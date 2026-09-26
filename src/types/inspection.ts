export const DEFECT_TYPES = ['스크래치', '외관 손상', '단차', '장착 불량', '고정 불량', '고정핀 불량', '연계 불량', '유격 불량', '체결 불량', '실링 불량', '헤밍 불량', '홀 변형'] as const;
export const PART_TYPES = ['도어', '라디에이터 그릴', '루프사이드', '배선', '범퍼', '카울커버', '커넥터', '테일 램프', '프레임', '헤드 램프', '휀더'] as const;

export type Judgement = 'pass' | 'fail' | 'pending';
export type ProcessStatus = 'not_started' | 'processing' | 'completed' | 'inference_failed' | 'save_failed';

export interface DefectDetection {
  type: string;
  bbox: [number, number, number, number]; // x, y, w, h
  confidence: number;
}

export interface Inspection {
  id: string;
  imageId: string;
  modelId: string;
  partType: string;
  judgement: Judgement;
  processStatus: ProcessStatus;
  inspectedAt: string;
  defects: DefectDetection[];
  imageWidth: number;
  imageHeight: number;
}

export interface InspectionStats {
  totalCount: number;
  defectRate: number;
  passCount: number;
  failCount: number;
  topDefectType: string;
  defectTypeCounts: { type: string; count: number }[];
  partTypeCounts: { type: string; count: number }[];
  trend: { label: string; defectRate: number }[];
}

export interface HistoryFilters {
  periodDays: 7 | 30 | 9999 | 'custom';
  startDate?: string; // YYYY-MM-DD, periodDays === 'custom'일 때 사용
  endDate?: string;   // YYYY-MM-DD, periodDays === 'custom'일 때 사용
  judgement: 'all' | 'pass' | 'fail';
  defectType: 'all' | string;
  partType: 'all' | string;
}
