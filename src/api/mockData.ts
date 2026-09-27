import { Inspection, InspectionStats } from '../types/inspection';
import { CandidateModel, evaluateNfr } from '../types/model';

const PART_TYPES = ['도어', '라디에이터 그릴', '루프사이드', '배선', '범퍼', '카울커버', '커넥터', '테일 램프', '프레임', '헤드 램프', '휀더'];
const DEFECT_TYPES = ['스크래치', '외관 손상', '단차', '장착 불량', '고정 불량', '고정핀 불량', '연계 불량', '유격 불량', '체결 불량', '실링 불량', '헤밍 불량', '홀 변형'];

function createMockHistory(): Inspection[] {
  const now = new Date();
  const rows: Inspection[] = [];

  // 최근 30일 동안 약 1,000건의 검사 완료 예시 데이터를 생성합니다.
  for (let i = 0; i < 1000; i += 1) {
    const dayOffset = Math.floor(i / 34);
    const day = new Date(now);
    day.setDate(now.getDate() - Math.min(dayOffset, 29));
    day.setHours(7 + ((i * 7) % 12), (i * 13) % 60, (i * 37) % 60, 0);

    const partType = PART_TYPES[(i * 7 + 3) % PART_TYPES.length];
    const isFail = i % 12 === 0 || i % 29 === 0 || i % 47 === 0;
    const defectType = DEFECT_TYPES[(i * 5 + 1) % DEFECT_TYPES.length];

    rows.push({
      id: `INS-${30413 + i}`,
      imageId: `IMG-${9932 + i}`,
      modelId: 'swin-t-v1.3',
      partType,
      judgement: isFail ? 'fail' : 'pass',
      processStatus: 'completed',
      inspectedAt: day.toISOString().replace('T', ' ').slice(0, 16),
      imageWidth: 640,
      imageHeight: 640,
      defects: isFail
        ? [{
            type: defectType,
            bbox: [80 + ((i * 17) % 280), 70 + ((i * 11) % 260), 60 + (i % 90), 40 + (i % 70)],
            confidence: Number((0.72 + ((i * 13) % 25) / 100).toFixed(2)),
          }]
        : [],
    });
  }

  return rows.sort((a, b) => b.inspectedAt.localeCompare(a.inspectedAt));
}

export const MOCK_HISTORY: Inspection[] = createMockHistory();

export const MOCK_STATS: InspectionStats = {
  totalCount: 4812,
  defectRate: 0.064,
  passCount: 4504,
  failCount: 308,
  topDefectType: '스크래치',
  defectTypeCounts: [
    { type: '스크래치', count: 103 },
    { type: '외관 손상', count: 118 },
    { type: '단차', count: 87 },
    { type: '장착 불량', count: 0 },
    { type: '고정 불량', count: 0 },
    { type: '고정핀 불량', count: 0 },
    { type: '연계 불량', count: 0 },
    { type: '유격 불량', count: 0 },
    { type: '체결 불량', count: 0 },
    { type: '실링 불량', count: 0 },
    { type: '헤밍 불량', count: 0 },
    { type: '홀 변형', count: 0 },
  ],
  partTypeCounts: [
    { type: '도어', count: 760 },
    { type: '라디에이터 그릴', count: 410 },
    { type: '루프사이드', count: 355 },
    { type: '배선', count: 520 },
    { type: '범퍼', count: 620 },
    { type: '카울커버', count: 285 },
    { type: '커넥터', count: 330 },
    { type: '테일 램프', count: 360 },
    { type: '프레임', count: 470 },
    { type: '헤드 램프', count: 390 },
    { type: '휀더', count: 312 },
  ],
  trend: [
    { label: 'W1', defectRate: 0.09 },
    { label: 'W2', defectRate: 0.085 },
    { label: 'W3', defectRate: 0.078 },
    { label: 'W4', defectRate: 0.082 },
    { label: 'W5', defectRate: 0.05 },
    { label: 'W6', defectRate: 0.06 },
    { label: 'W7', defectRate: 0.04 },
    { label: 'W8', defectRate: 0.045 },
  ],
};

function withNfrEvaluation(model: Omit<CandidateModel, 'nfrStatus' | 'unmetReason'>): CandidateModel {
  const { status, unmetReasons } = evaluateNfr(model.metrics);
  return { ...model, nfrStatus: status, unmetReason: unmetReasons.length ? unmetReasons.join(', ') : undefined };
}

export const MOCK_MODELS: CandidateModel[] = [
  withNfrEvaluation({
    id: 'swin-t-v1.3',
    name: 'Swin-T + FPN',
    metrics: { recall: 0.968, precision: 0.912, map50: 0.887, p95LatencyMs: 412, gpuMemoryGb: 6.1 },
    isApplied: true,
  }),
  withNfrEvaluation({
    id: 'resnet50-v1.0',
    name: 'ResNet-50 + FPN',
    note: 'Baseline',
    metrics: { recall: 0.941, precision: 0.92, map50: 0.861, p95LatencyMs: 355, gpuMemoryGb: 5.4 },
    isApplied: false,
  }),
  withNfrEvaluation({
    id: 'mobilenetv3-v1.0',
    name: 'MobileNetV3-Large + FPN',
    metrics: { recall: 0.936, precision: 0.897, map50: 0.832, p95LatencyMs: 148, gpuMemoryGb: 2.9 },
    isApplied: false,
  }),
];
