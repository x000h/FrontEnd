import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DEFECT_TYPES, PART_TYPES, Inspection, InspectionStats, HistoryFilters } from '../types/inspection';
import { MOCK_HISTORY } from './mockData';

const USE_MOCK = true;

function filterHistory(filters: HistoryFilters) {
  let rows = MOCK_HISTORY.filter((r) => r.processStatus === 'completed');
  if (filters.periodDays !== 9999) {
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

function buildTrend(rows: Inspection[], days: number) {
  const windowDays = Math.min(days === 9999 ? 30 : days, 30);
  const today = new Date();
  const result: { label: string; defectRate: number }[] = [];

  for (let offset = windowDays - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    const dayRows = rows.filter((row) => row.inspectedAt.slice(0, 10) === key);
    const fails = dayRows.filter((row) => row.judgement === 'fail').length;
    result.push({
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      defectRate: dayRows.length ? fails / dayRows.length : 0,
    });
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
    trend: filters.judgement === 'all' && filters.defectType === 'all' && filters.partType === 'all'
      ? buildTrend(rows, filters.periodDays === 9999 ? 30 : filters.periodDays)
      : [],
  };
}

export function useRunInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_file: File): Promise<Inspection> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 700));
        return {
          id: `INS-${Math.floor(Math.random() * 90000 + 10000)}`,
          imageId: 'IMG-NEW',
          modelId: 'swin-t-v1.3',
          judgement: 'fail',
          processStatus: 'completed',
          inspectedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          imageWidth: 640,
          imageHeight: 640,
          partType: '프레임',
          defects: [{ type: '외관 손상', bbox: [150, 100, 60, 40], confidence: 0.92 }],
        };
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

export function useInspectionHistory(filters: HistoryFilters) {
  return useQuery({
    queryKey: ['inspections', filters],
    queryFn: async (): Promise<Inspection[]> => {
      if (USE_MOCK) return filterHistory(filters);
      const params = new URLSearchParams({
        periodDays: String(filters.periodDays),
        judgement: filters.judgement,
        defectType: filters.defectType,
        partType: filters.partType,
      });
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
      const params = new URLSearchParams({
        periodDays: String(filters.periodDays),
        judgement: filters.judgement,
        defectType: filters.defectType,
        partType: filters.partType,
      });
      const res = await fetch(`/api/inspections/stats?${params}`);
      if (!res.ok) throw new Error('통계를 불러오지 못했습니다.');
      return res.json();
    },
  });
}
