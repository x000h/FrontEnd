import { useState } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import PageContainer from '@/components/PageContainer';
import LineInspection from '@/pages/inspection/LineInspection';
import SingleImageInspection from '@/pages/inspection/SingleImageInspection';

type InspectionMode = 'line' | 'single';

export default function Inspection() {
  const [mode, setMode] = useState<InspectionMode>('line');

  return (
    <PageContainer>
      <div className="inline-flex rounded-xl border border-gray-200 bg-gray-100 p-1" role="tablist" aria-label="검사 방식">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'line'}
          onClick={() => setMode('line')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${mode === 'line' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-navy-800'}`}
        >
          <Camera className="h-4 w-4" />라인 검사
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'single'}
          onClick={() => setMode('single')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${mode === 'single' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-navy-800'}`}
        >
          <ImageIcon className="h-4 w-4" />웹 이미지 업로드
        </button>
      </div>

      {mode === 'line' ? (
        <LineInspection />
      ) : (
        <>

          <SingleImageInspection />
        </>
      )}
    </PageContainer>
  );
}
