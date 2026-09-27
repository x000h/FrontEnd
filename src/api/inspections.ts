import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DEFECT_TYPES, PART_TYPES, Inspection, InspectionStats, HistoryFilters } from '../types/inspection';
import { MOCK_HISTORY } from './mockData';

const USE_MOCK = true;

function filterHistory(filters: HistoryFilters) {
  let rows = MOCK_HISTORY.filter((r) => r.processStatus === 'completed');
  if (filters.periodDays === 'custom') {
    if (filters.startDate) {
      const startTs = new Date(`${filters.startDate}T00:00:00`).getTime();
      rows = rows.filter((r) => {
        const ts = Date.parse(r.inspectedAt.replace(' ', 'T') + ':00');
        return Number.isNaN(ts) || ts >= startTs;
      });
    }
    if (filters.endDate) {
      const endTs = new Date(`${filters.endDate}T23:59:59`).getTime();
      rows = rows.filter((r) => {
        const ts = Date.parse(r.inspectedAt.replace(' ', 'T') + ':00');
        return Number.isNaN(ts) || ts <= endTs;
      });
    }
  } else if (filters.periodDays !== 9999) {
    const now = Date.now();
    const cutoff = now - filters.periodDays * 24 * 60 * 60 * 1000;
    rows = rows.filter((r) => {
      const timestamp = Date.parse(r.inspectedAt.replace(' ', 'T') + ':00');
      return Number.isNaN(timestamp) || timestamp >= cutoff;
    });
  }
  if (filters.judgement !== 'all') rows = rows.filter((r) => r.judgement === filters.judgement);
  if (filters.defectType !== 'all') rows = rows.filter((r) => r.defects.some((d) => d.type === filters.defectType));
  if (filters.partType !== 'all') rows = rows.filter((r) => r.partType === filters.partType);
  return rows;
}

// 통계·추이 계산에 쓸 날짜 범위(시작~끝)를 필터에서 뽑아냅니다.
function resolveDateRange(filters: HistoryFilters): { start: Date; end: Date } {
  const today = new Date();
  if (filters.periodDays === 'custom') {
    const end = filters.endDate ? new Date(`${filters.endDate}T00:00:00`) : today;
    const start = filters.startDate
      ? new Date(`${filters.startDate}T00:00:00`)
      : (() => { const d = new Date(end); d.setDate(d.getDate() - 29); return d; })();
    return { start, end };
  }
  const days = filters.periodDays === 9999 ? 30 : filters.periodDays;
  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));
  return { start, end: today };
}

function buildTrend(rows: Inspection[], start: Date, end: Date) {
  const startOfDay = (d: Date) => { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; };
  let from = startOfDay(start);
  const to = startOfDay(end);
  const MAX_SPAN_DAYS = 60; // 직접 선택한 범위가 너무 넓으면 최근 60일로 제한(차트 가독성)
  const spanDays = Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  if (spanDays > MAX_SPAN_DAYS) {
    from = new Date(to);
    from.setDate(to.getDate() - (MAX_SPAN_DAYS - 1));
  }

  const result: { label: string; defectRate: number }[] = [];
  const cursor = new Date(from);
  while (cursor.getTime() <= to.getTime()) {
    const key = cursor.toISOString().slice(0, 10);
    const dayRows = rows.filter((row) => row.inspectedAt.slice(0, 10) === key);
    const fails = dayRows.filter((row) => row.judgement === 'fail').length;
    result.push({
      label: `${cursor.getMonth() + 1}/${cursor.getDate()}`,
      defectRate: dayRows.length ? fails / dayRows.length : 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

function statsFor(filters: HistoryFilters): InspectionStats {
  // The UC requires history and statistics to use the same completed Inspection/DefectDetection dataset.
  // Mock mode therefore derives both from the same filtered rows.
  const rows = filterHistory(filters);
  const failCount = rows.filter((r) => r.judgement === 'fail').length;
  const passCount = rows.filter((r) => r.judgement === 'pass').length;
  const counts = new Map<string, number>();
  rows.forEach((r) => r.defects.forEach((d) => counts.set(d.type, (counts.get(d.type) ?? 0) + 1)));
  const defectTypeCounts = DEFECT_TYPES.map((type) => ({ type, count: counts.get(type) ?? 0 }));
  const partCounts = new Map<string, number>();
  rows.forEach((r) => partCounts.set(r.partType, (partCounts.get(r.partType) ?? 0) + 1));
  const partTypeCounts = PART_TYPES.map((type) => ({ type, count: partCounts.get(type) ?? 0 }));
  return {
    totalCount: rows.length,
    passCount,
    failCount,
    defectRate: rows.length ? failCount / rows.length : 0,
    topDefectType: defectTypeCounts[0]?.type ?? '—',
    defectTypeCounts,
    partTypeCounts,
    // 필터가 걸려 있으면 표본이 적어 그래프가 들쭉날쭉할 수 있지만,
    // "선택한 조건 없음" 안내 대신 실제 데이터를 그대로 보여주는 쪽을 택함.
    trend: (() => { const { start, end } = resolveDateRange(filters); return buildTrend(rows, start, end); })(),
  };
}

export function useRunInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_file: File): Promise<Inspection> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 700));
        const isFail = Math.random() < 0.18;
        const partType = PART_TYPES[Math.floor(Math.random() * PART_TYPES.length)];
        const defectType = DEFECT_TYPES[Math.floor(Math.random() * DEFECT_TYPES.length)];
        const newInspection: Inspection = {
          id: `INS-${Math.floor(Math.random() * 90000 + 10000)}`,
          imageId: 'IMG-NEW',
          modelId: 'swin-t-v1.3',
          partType,
          judgement: isFail ? 'fail' : 'pass',
          processStatus: 'completed',
          inspectedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          imageWidth: 640,
          imageHeight: 640,
          defects: isFail
            ? [{ type: defectType, bbox: [150, 100, 60, 40], confidence: Number((0.75 + Math.random() * 0.2).toFixed(2)) }]
            : [],
        };
        // 완료된 검사를 이력 저장소 맨 앞에 추가합니다.
        // 실제 백엔드 연동 시(USE_MOCK = false)에는 서버가 DB에 저장하고,
        // 프론트는 아래 onSuccess의 쿼리 무효화로 최신 이력/통계를 다시 불러오게 됩니다.
        MOCK_HISTORY.unshift(newInspection);
        return newInspection;
      }
      const form = new FormData();
      form.append('image', _file);
      const res = await fetch('/api/inspections', { method: 'POST', body: form });
      if (!res.ok) throw new Error('검사 요청에 실패했습니다.');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inspections'] }),
  });
}

function toQueryParams(filters: HistoryFilters): URLSearchParams {
  const params = new URLSearchParams({
    periodDays: String(filters.periodDays),
    judgement: filters.judgement,
    defectType: filters.defectType,
    partType: filters.partType,
  });
  if (filters.periodDays === 'custom') {
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
  }
  return params;
}

export function useInspectionHistory(filters: HistoryFilters) {
  return useQuery({
    queryKey: ['inspections', filters],
    queryFn: async (): Promise<Inspection[]> => {
      if (USE_MOCK) return filterHistory(filters);
      const params = toQueryParams(filters);
      const res = await fetch(`/api/inspections?${params}`);
      if (!res.ok) throw new Error('검사이력을 불러오지 못했습니다.');
      return res.json();
    },
  });
}

export function useInspectionStats(filters: HistoryFilters) {
  return useQuery({
    queryKey: ['inspections', 'stats', filters],
    queryFn: async (): Promise<InspectionStats> => {
      if (USE_MOCK) return statsFor(filters);
      const params = toQueryParams(filters);
      const res = await fetch(`/api/inspections/stats?${params}`);
      if (!res.ok) throw new Error('통계를 불러오지 못했습니다.');
      return res.json();
    },
  });
}
