import type { Bbox } from './shared';
import { INSPECTION_IMAGE_METADATA } from './inspectionImageMetadata';

const INSPECTION_IMAGE_FILES = import.meta.glob<string>(
  '../../assets/inspection-images/*.{jpg,jpeg,png,webp}',
  { eager: true, query: '?url', import: 'default' },
);

export interface InspectionImageDefect {
  id: string;
  typeKey: string;
  bbox: Bbox;
}

export interface InspectionImage {
  id: string;
  label: string;
  src: string;
  groundTruth?: {
    result: 'pass' | 'fail';
    defects: InspectionImageDefect[];
  };
}

// src/assets/inspection-images 폴더의 각 이미지 파일을 한 번씩 검사 대상으로 등록한다.
export function getInspectionImages(): InspectionImage[] {
  return Object.entries(INSPECTION_IMAGE_FILES)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, src], index) => {
      const fileName = path.split('/').pop() ?? path;
      const metadata = INSPECTION_IMAGE_METADATA[fileName];

      return {
        id: `inspection-${index}-${fileName}`,
        label: `부품 #${String(index + 1).padStart(3, '0')} · ${metadata?.label ?? fileName}`,
        src,
        groundTruth: metadata
          ? {
              result: metadata.result,
              defects: (metadata.defects ?? []).map((defect, defectIndex) => ({
            id: `${fileName}-defect-${defectIndex}`,
            typeKey: defect.typeKey,
            bbox: defect.bbox,
          })),
            }
          : undefined,
      };
    });
}
