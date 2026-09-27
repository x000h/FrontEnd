import type { Bbox } from './shared';

export interface InspectionImageDefectMetadata {
  typeKey: string; // defectTypeMap의 key와 일치해야 함
  bbox: Bbox; // 이미지 기준 0~100 퍼센트 좌표
}

export interface InspectionImageMetadata {
  label: string;
  result: 'pass' | 'fail';
  defects?: InspectionImageDefectMetadata[];
}

// 불량 위치 정보가 필요한 이미지의 판정 정보를 파일명으로 지정한다.
export const INSPECTION_IMAGE_METADATA: Record<string, InspectionImageMetadata> = {
  'sample-01-side-sill.jpg': {
    label: '사이드실 패널',
    result: 'pass',
  },
};
