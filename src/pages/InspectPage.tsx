import { useEffect, useState } from 'react';
import UploadBox from '../components/inspect/UploadBox';
import ResultPanel from '../components/inspect/ResultPanel';
import { useRunInspection } from '../api/inspections';
import { Inspection } from '../types/inspection';

export default function InspectPage() {
  const [result, setResult] = useState<Inspection | null>(null);
  const [imageUrl, setImageUrl] = useState<string>();
  const [fileName, setFileName] = useState('');
  const runInspection = useRunInspection();

  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  const handleSelect = (file: File) => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    setFileName(file.name);
    setResult(null);
    runInspection.mutate(file, { onSuccess: (inspection) => setResult(inspection) });
  };

  const reset = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(undefined);
    setFileName('');
    setResult(null);
  };

  const displayResult = runInspection.isPending
    ? ({
        id: 'pending',
        imageId: 'pending',
        modelId: 'swin-t-v1.3',
        partType: '프레임',
        judgement: 'pending',
        processStatus: 'processing',
        inspectedAt: '',
        imageWidth: 640,
        imageHeight: 640,
        defects: [],
      } as Inspection)
    : result;

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">INSPECTION</div>
          <h1>부품 이미지 품질검사</h1>
          <p className="lede">이미지를 업로드해 현재 모델의 예측 결과를 확인합니다.</p>
        </div>
        <div className="header-status"><span className="status-dot" /> 운영 모델 연결됨</div>
      </div>

      <div className="workflow-strip">
        <div className="workflow-step active"><b>01</b><span>Image input</span></div>
        <div className="workflow-line" />
        <div className={`workflow-step ${displayResult ? 'active' : ''}`}><b>02</b><span>AI inference</span></div>
        <div className="workflow-line" />
        <div className={`workflow-step ${result ? 'active' : ''}`}><b>03</b><span>Result saved</span></div>
      </div>

      <div className="inspection-grid">
        <div className="panel input-panel">
          <div className="panel-head">
            <div><div className="eyebrow">INPUT</div><h2>검사 이미지</h2></div>
            <span className="subtle-chip">JPG / PNG</span>
          </div>
          <UploadBox onSelect={handleSelect} disabled={runInspection.isPending} />
          {fileName && <div className="file-chip"><span>IMG</span>{fileName}<button onClick={reset} disabled={runInspection.isPending}>×</button></div>}
          {runInspection.isError && <div className="form-error">검사 요청에 실패했습니다. 다시 시도해 주세요.</div>}
        </div>

        <ResultPanel inspection={displayResult} imageUrl={imageUrl} />
      </div>
    </>
  );
}
