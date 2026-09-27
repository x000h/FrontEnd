import type { Bbox } from './shared';
import { SAMPLE_MANIFEST, type SampleManifestEntry } from './sampleManifest';

export interface SampleGroundTruthDefect {
  id: string;
  typeKey: string;
  bbox: Bbox;
}

export interface SampleImage {
  id: string;
  label: string; // 검사 목록과 결과 상세에 표시할 항목 이름
  src: string; // public/ 기준 이미지 경로
  groundTruth: {
    result: 'pass' | 'fail';
    defects: SampleGroundTruthDefect[];
  };
}

function buildFromManifest(entry: SampleManifestEntry, index: number): SampleImage {
  const label = entry.label ? `부품 #${String(index + 1).padStart(3, '0')} · ${entry.label}` : `부품 #${String(index + 1).padStart(3, '0')}`;
  return {
    id: `sample-${index}-${entry.file}`,
    label,
    src: entry.file,
    groundTruth: {
      result: entry.result,
      defects: (entry.defects ?? []).map((d, i) => ({
        id: `gt-${index}-${i}`,
        typeKey: d.typeKey,
        bbox: d.bbox,
      })),
    },
  };
}

// 한 번의 검사 실행에서 등록된 검사 이미지를 각각 한 번씩 처리한다.
export function generateSamplePool(): SampleImage[] {
  const seenFiles = new Set<string>();
  const uniqueEntries = SAMPLE_MANIFEST.filter((entry) => {
    if (seenFiles.has(entry.file)) return false;
    seenFiles.add(entry.file);
    return true;
  });

  return uniqueEntries.map((entry, index) => buildFromManifest(entry, index));
}
