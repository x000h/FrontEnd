import ModelCompareTable from '../components/models/ModelCompareTable';
import SelectionStatusPanel from '../components/models/SelectionStatusPanel';
import { useCandidateModels, useSelectModel } from '../api/models';

export default function ModelsPage() {
  const { data: models, isLoading } = useCandidateModels();
  const selectModel = useSelectModel();

  if (isLoading || !models) return <div className="state-msg">불러오는 중...</div>;

  const applied = models.find((m) => m.isApplied);

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">MODEL MANAGEMENT</div>
          <h1>후보 모델 비교 · 운영 모델 관리</h1>
          <p className="lede">후보 모델의 성능을 비교하고 현재 적용 모델을 관리합니다.</p>
        </div>
        {applied && <div className="header-status"><span className="status-dot" /> {applied.name} · 운영 적용</div>}
      </div>

      <div className="benchmark-context">
        <div><span>DATASET</span><strong>동일 시험 Dataset</strong></div>
        <div><span>INPUT</span><strong>640 × 640</strong></div>
        <div><span>BATCH</span><strong>1</strong></div>
        <div><span>PRECISION</span><strong>FP32</strong></div>
        <div><span>GPU</span><strong>동일 GPU</strong></div>
        <div><span>METRIC</span><strong>Recall · p95 · GPU</strong></div>
      </div>

      <ModelCompareTable models={models} onSelect={(id) => selectModel.mutate(id)} selectingId={selectModel.isPending ? selectModel.variables : undefined} />
      <SelectionStatusPanel applied={applied} />
    </>
  );
}
