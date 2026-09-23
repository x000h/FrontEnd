# AI 부품 품질검사 시스템 — 프론트엔드

7조 OPTIMIZATION 요구사항분석서(UC-01~03, FR-01~08)를 기반으로 만든 React + TypeScript 프론트엔드입니다.

## 실행

```bash
npm install
npm run dev
```

## 구조

- `src/pages/` — 화면 3개: 검사(UC-01), 이력·통계(UC-02), 모델관리(UC-03)
- `src/components/` — 화면별 UI 조각 (layout / inspect / stats / models)
- `src/types/` — Inspection, DefectDetection, CandidateModel 등 도메인 타입 (ERD 기반)
- `src/api/` — React Query 훅. 현재는 `mockData.ts`의 목데이터를 반환합니다.

## 실제 백엔드 연동 방법

각 `src/api/*.ts` 파일 상단의 `USE_MOCK = true`를 `false`로 바꾸면 주석 처리된 `fetch` 호출이 활성화됩니다.
필요한 엔드포인트:

- `POST /api/inspections` — 이미지 업로드, 검사 요청
- `GET /api/inspections` — 이력 조회 (쿼리: periodDays, judgement, defectType)
- `GET /api/inspections/stats` — 통계 집계
- `GET /api/models` — 후보 모델 목록 + 평가 지표
- `POST /api/models/:id/select` — 운영 모델 선정/적용

`vite.config.ts`에 `/api` 프록시가 이미 설정되어 있어 로컬 백엔드(`localhost:8000`)와 바로 연동할 수 있습니다.
