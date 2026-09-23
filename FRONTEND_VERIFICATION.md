# Frontend 요구사항 검증 및 수정 내역

기준 문서: `7조_OPTIMIZATION_요구사항분석서_교수님피드백_반영본.pptx`

## 요구사항 검증

| 요구사항 / UC | 기존 상태 | 수정 상태 |
|---|---|---|
| FR-01 이미지 수신 | 클릭 업로드만 제공, 실제 이미지 미리보기 없음 | 드래그앤드롭 + 클릭 업로드, JPG/PNG·10MB 검증, 실제 이미지 미리보기 추가 |
| FR-02 입력 검증 | 형식/용량/손상 검증 UI 없음 | 파일 형식·용량 검증 및 오류 안내 추가. 손상 이미지 검증은 실제 Backend 수신 단계에서 수행하도록 구분 |
| FR-03 AI 추론/판정 | Mock 결과는 제공하지만 모델명이 하드코딩 | 검사 결과의 modelId를 사용하고 처리상태/판정/탐지 건수/Confidence 표시 |
| FR-04 결과 저장 | 프론트에서 저장 성공/실패 흐름 표현이 약함 | process status를 결과 UI에 노출하고 완료/추론 실패/저장 실패를 구분 |
| FR-05 검사이력 조회 | 이력 필터와 통계 필터가 서로 다른 데이터 조건을 사용할 가능성 | 기간·판정·불량 유형을 동일 조건으로 적용하도록 Mock 조회 로직 수정 |
| FR-06 품질 통계 | 총량/불량률/최다 유형/추이만 표시 | 완료 검사 기준 KPI + 기간별 추이 + 유형별 빈도 + 이력 상세 조회 추가 |
| UC-02 상세 확인 | 행 클릭 동작 없음 | 이력 행 선택 → 검사 상세/탐지 bbox/Confidence 확인 패널 추가 |
| FR-07 후보 모델 비교 | 핵심 지표는 표시 | Recall/Precision/mAP/p95/GPU/NFR 상태와 동일 실행 조건을 한 화면에서 비교 |
| FR-08 운영 모델 적용 | Mock 적용 후 실제 UI 상태가 갱신되지 않음 | Mock 선택 상태를 유지하도록 수정하고 ACTIVE 운영 모델 상태를 즉시 갱신 |
| 모델 선정 조건 | 설명 문구만 존재 | Dataset/Input/Batch/Precision/GPU/평가 지표를 benchmark context로 고정 표시 |
| LandingLens UI 방향 | 일반적인 관리 콘솔 스타일 | 프로젝트 선택 영역, 좌측 워크스페이스 내비게이션, 밝은 캔버스, 이미지 중심 검사 화면, 모델/배포 상태 중심 UI로 재구성 |

## LandingLens 스타일 반영 근거

- LandingLens는 프로젝트 단위로 비전 검사 작업을 구성하고, 이미지 업로드 → 라벨링 → 학습 → 배포의 흐름을 제공한다.
- 실제 LandingLens 화면 자료에서도 좌측 세로 내비게이션과 상단 프로젝트/작업 영역, 이미지 중심의 결과 화면, 모델/배포 상태가 강조된다.
- 본 프로젝트는 요구사항상 학습 자체를 운영 시스템 범위에서 제외하므로, LandingLens의 전체 메뉴를 복제하지 않고 `Overview / Inspection / History & Quality / Models`로 축약했다.

## 구현상 주의사항

- 현재 `USE_MOCK = true` 상태라 실제 Backend/DB와 연결된 것은 아니다.
- 이미지 손상 여부, DB 저장 성공 여부, 실제 AI 추론 시간/Recall 등은 Backend 및 시험 환경에서 최종 검증해야 한다.
- p95는 요구사항대로 전처리·추론·후처리를 포함하고 촬영/전송/DB는 제외하는 실제 Backend benchmark에서 측정해야 한다.
- `npm install`은 작업 환경에서 제한 시간 내 완료되지 않아 이 환경에서 전체 Vite production build까지 실행 검증하지 못했다. TypeScript 정적 확인에서는 외부 패키지 미설치에 따른 모듈 해석 오류 외 별도 문법 오류는 확인되지 않았다.


## UI revision — LandingLens-inspired
- Narrow icon rail and project selector/header hierarchy added to mirror LandingLens product layout.
- Project workspace is organized around image-first inspection/prediction, historical data, and model management.
- Technical requirement/specification copy was removed from visible product UI where it read like an analysis document.
- Existing OPTIMIZATION functional scope is preserved: image inspection, history/statistics, and candidate model comparison/application.
- Visual references were checked against LandingLens public documentation/screenshots showing a left navigation rail, project header, image-grid/data browser, prediction/history filters, and model workflow.
