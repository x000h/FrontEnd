export interface Bbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DefectInfo {
  id: string;
  typeLabel: string;
  typeKey: string;
  typeEn: string;
  confidence: number;
  bbox: Bbox;
}

export interface InspectionResult {
  result: 'pass' | 'fail';
  confidence: number;
  inspectedAt: string;
  model: string;
  processingTimeMs: number;
  defects: DefectInfo[];
}

export const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export const PART_OPTIONS = [
  '도어',
  '라디에이터 그릴',
  '루프사이드',
  '배선',
  '범퍼',
  '카울커버',
  '커넥터',
  '테일 램프',
  '프레임',
  '헤드 램프',
  '휀더',
];

export const defectTypeMap: Record<string, { label: string; color: string; en: string }> = {
  scratch: { label: '스크래치', color: '#f59e0b', en: 'Scratch' },
  appearance: { label: '외관 손상', color: '#8b5cf6', en: 'Appearance Damage' },
  step: { label: '단차', color: '#dc2626', en: 'Step Difference' },
  mounting: { label: '장착 불량', color: '#0891b2', en: 'Mounting Defect' },
  fixing: { label: '고정 불량', color: '#16a34a', en: 'Fixing Defect' },
  pin_fixing: { label: '고정핀 불량', color: '#ca8a04', en: 'Fixing Pin Defect' },
  connection: { label: '연계 불량', color: '#2563eb', en: 'Connection Defect' },
  looseness: { label: '유격 불량', color: '#9333ea', en: 'Looseness Defect' },
  fastening: { label: '체결 불량', color: '#ea580c', en: 'Fastening Defect' },
  sealing: { label: '실링 불량', color: '#0d9488', en: 'Sealing Defect' },
  hemming: { label: '헤밍 불량', color: '#db2777', en: 'Hemming Defect' },
  hole_deformation: { label: '홀 변형', color: '#475569', en: 'Hole Deformation' },
};

// Bbox는 이미지 좌상단 기준 0~100 퍼센트 좌표계를 사용한다.
// (샘플 이미지의 실제 해상도와 무관하게 오버레이 위치를 계산하기 위함)
export function randomBbox(): Bbox {
  return {
    x: Math.round(Math.random() * 55 + 10),
    y: Math.round(Math.random() * 45 + 10),
    width: Math.round(Math.random() * 18 + 10),
    height: Math.round(Math.random() * 18 + 10),
  };
}

export function formatInspectedAt(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

// 개발/테스트용 단일 이미지 검사에서 쓰는 완전 무작위 시뮬레이션.
export function simulateInspection(): InspectionResult {
  const isPass = Math.random() > 0.4;
  const inspectedAt = formatInspectedAt(new Date());

  if (isPass) {
    return {
      result: 'pass',
      confidence: Math.round(Math.random() * 4 + 95),
      inspectedAt,
      model: 'YOLO',
      processingTimeMs: Math.round(Math.random() * 200 + 120),
      defects: [],
    };
  }

  const numDefects = Math.floor(Math.random() * 2) + 1;
  const types = Object.keys(defectTypeMap);
  const shuffled = [...types].sort(() => Math.random() - 0.5).slice(0, numDefects);
  const defects: DefectInfo[] = shuffled.map((typeKey, i) => ({
    id: `defect-${i}`,
    typeLabel: defectTypeMap[typeKey].label,
    typeKey,
    typeEn: defectTypeMap[typeKey].en,
    confidence: Math.round(Math.random() * 10 + 88),
    bbox: randomBbox(),
  }));

  return {
    result: 'fail',
    confidence: Math.round(Math.random() * 8 + 88),
    inspectedAt,
    model: 'YOLO',
    processingTimeMs: Math.round(Math.random() * 300 + 180),
    defects,
  };
}

export const bboxStyle = (bbox: Bbox) => ({
  left: `${bbox.x}%`,
  top: `${bbox.y}%`,
  width: `${bbox.width}%`,
  height: `${bbox.height}%`,
});

export const getDefectColor = (typeKey: string): string =>
  defectTypeMap[typeKey]?.color ?? '#dc2626';

export interface SavedInspectionRecord {
  id: string;
  source: string;
  time: string;
  partName: string;
  category: string;
  bboxUnit?: 'percent' | 'pixel';
  image: string | null;
  result: 'pass' | 'fail';
  defectType: string | null;
  defectKey: string | null;
  confidence: string;
  model: string;
  processingTimeMs: number;
  defects: DefectInfo[];
}

// History 페이지가 읽는 localStorage 스키마와 동일한 형태로 저장한다.
export function persistInspectionRecord(record: SavedInspectionRecord) {
  try {
    const existing = JSON.parse(localStorage.getItem('inspectionRecords') || '[]');
    localStorage.setItem('inspectionRecords', JSON.stringify([record, ...existing]));
    window.dispatchEvent(new Event('inspectionRecordsUpdated'));
  } catch {
    // localStorage를 사용할 수 없는 환경이면 조용히 무시한다.
  }
}
