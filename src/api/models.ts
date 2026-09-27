import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CandidateModel } from '../types/model';
import { MOCK_MODELS } from './mockData';

const USE_MOCK = true;
let selectedModelId = MOCK_MODELS.find((m) => m.isApplied)?.id ?? '';

export function useCandidateModels() {
  return useQuery({
    queryKey: ['models'],
    queryFn: async (): Promise<CandidateModel[]> => {
      if (USE_MOCK) return MOCK_MODELS.map((m) => ({ ...m, isApplied: m.id === selectedModelId }));
      const res = await fetch('/api/models');
      if (!res.ok) throw new Error('모델 목록을 불러오지 못했습니다.');
      return res.json();
    },
  });
}

export function useSelectModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (modelId: string) => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 400));
        selectedModelId = modelId;
        return { modelId, applied: true };
      }
      const res = await fetch(`/api/models/${modelId}/select`, { method: 'POST' });
      if (!res.ok) throw new Error('운영 모델 적용에 실패했습니다.');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['models'] }),
  });
}
