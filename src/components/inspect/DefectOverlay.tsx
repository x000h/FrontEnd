import { useId } from 'react';
import { DefectDetection } from '../../types/inspection';

interface Props {
  imageWidth: number;
  imageHeight: number;
  defects: DefectDetection[];
  imageUrl?: string;
  placeholderOnly?: boolean;
  showHeatmap?: boolean;
}

export default function DefectOverlay({ imageWidth, imageHeight, defects, imageUrl, placeholderOnly, showHeatmap }: Props) {
  const uid = useId();

  return (
    <div className="inspection-image-wrap">
      <svg viewBox={`0 0 ${imageWidth} ${imageHeight}`} className="inspection-image">
        {!placeholderOnly && showHeatmap && defects.length > 0 && (
          <defs>
            {defects.map((d, i) => (
              <radialGradient key={i} id={`${uid}-heat-${i}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ff2d2d" stopOpacity={0.35 + d.confidence * 0.35} />
                <stop offset="55%" stopColor="#ff2d2d" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#ff2d2d" stopOpacity={0} />
              </radialGradient>
            ))}
          </defs>
        )}
        {imageUrl ? (
          <image href={imageUrl} x="0" y="0" width={imageWidth} height={imageHeight} preserveAspectRatio="xMidYMid slice" />
        ) : (
          <>
            <rect width={imageWidth} height={imageHeight} fill="var(--canvas)" />
            <rect x={imageWidth * .2} y={imageHeight * .15} width={imageWidth * .6} height={imageHeight * .7} rx={14} fill="var(--placeholder)" />
            <circle cx={imageWidth * .5} cy={imageHeight * .5} r={imageWidth * .1} fill="var(--placeholder-2)" />
            <text x={imageWidth / 2} y={imageHeight / 2 + 70} textAnchor="middle" fill="var(--ink-soft)" fontSize="16">검사 이미지를 기다리는 중</text>
          </>
        )}
        {!placeholderOnly && showHeatmap && defects.map((d, i) => {
          const cx = d.bbox[0] + d.bbox[2] / 2;
          const cy = d.bbox[1] + d.bbox[3] / 2;
          const rx = d.bbox[2] * 0.85;
          const ry = d.bbox[3] * 0.85;
          return <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${uid}-heat-${i})`} style={{ mixBlendMode: 'multiply' }} />;
        })}
        {!placeholderOnly && defects.map((d, i) => (
          <g key={i}>
            <rect x={d.bbox[0]} y={d.bbox[1]} width={d.bbox[2]} height={d.bbox[3]} fill="none" stroke="var(--red)" strokeWidth={Math.max(2, imageWidth / 320)} />
            <rect x={d.bbox[0]} y={Math.max(0, d.bbox[1] - 24)} width={Math.max(110, d.type.length * 8 + 65)} height="22" rx="4" fill="var(--red)" />
            <text x={d.bbox[0] + 7} y={Math.max(15, d.bbox[1] - 9)} fontSize="11" fill="#fff" fontWeight="700">
              {d.type} · {(d.confidence * 100).toFixed(0)}%
            </text>
          </g>
        ))}
      </svg>
      {!placeholderOnly && showHeatmap && defects.length > 0 && (
        <div className="heatmap-caption">
          빨간 영역이 진할수록 모델이 판정 근거로 본 부분입니다 (신뢰도 기반 근사 시각화 · 실제 연동 시 모델의 Attention/Grad-CAM 결과로 대체)
        </div>
      )}
    </div>
  );
}
