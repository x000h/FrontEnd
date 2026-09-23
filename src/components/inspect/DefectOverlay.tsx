import { DefectDetection } from '../../types/inspection';

interface Props {
  imageWidth: number;
  imageHeight: number;
  defects: DefectDetection[];
  imageUrl?: string;
  placeholderOnly?: boolean;
}

export default function DefectOverlay({ imageWidth, imageHeight, defects, imageUrl, placeholderOnly }: Props) {
  return (
    <div className="inspection-image-wrap">
      <svg viewBox={`0 0 ${imageWidth} ${imageHeight}`} className="inspection-image">
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
    </div>
  );
}
