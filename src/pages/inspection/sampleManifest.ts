import type { Bbox } from './shared';

export interface SampleManifestDefect {
  typeKey: string; // defectTypeMap의 key와 일치해야 함
  bbox: Bbox; // 이미지 기준 0~100 퍼센트 좌표
}

export interface SampleManifestEntry {
  file: string; // public/ 기준 경로 (예: '/samples/xxx.jpg')
  label: string; // 결과 목록/상세에 표시할 설명
  result: 'pass' | 'fail';
  defects?: SampleManifestDefect[];
}

// 라인 검사 대상 이미지 목록.
// public/samples/ 폴더에 이미지를 추가하고 아래 배열에 등록하면 검사 대상에 포함됩니다.
// - result: 'pass'면 defects는 비워두면 됩니다.
// - result: 'fail'이면 defects에 불량 유형(typeKey, shared.ts의 defectTypeMap 참고)과
//   위치(bbox, 이미지 좌상단 기준 0~100 퍼센트)를 함께 지정해 주세요.
export const SAMPLE_MANIFEST: SampleManifestEntry[] = [
  {
    file: '/samples/sample-01-side-sill.jpg',
    label: '사이드실 패널',
    result: 'pass',
  },
];
