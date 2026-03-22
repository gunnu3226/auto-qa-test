# Auto QA Test Project

## 프로젝트 개요
QA 요청을 받아 자동으로 코드를 수정하는 데모 프로젝트 (Next.js).

## 수정 가능한 파일
- `app/page.tsx` - 메인 데모 페이지
- `components/demo-section.tsx` - 데모 UI 섹션
- `app/globals.css` - 스타일 (필요시)

## 수정 금지 파일
- `scripts/*` - 자동화 스크립트
- `lib/*` - 데이터 저장소, 타입
- `app/api/*` - API Routes
- `data/*` - 데이터 파일
- `app/layout.tsx` - 루트 레이아웃
- `app/qa/*` - QA 관리 페이지
- `components/qa-form.tsx` - QA 폼
- `components/qa-list.tsx` - QA 목록

## 규칙
- 수정 후 `npm run build`가 반드시 성공해야 함
- 기존 import 구조를 유지할 것
- 새 패키지 설치 금지
- TypeScript 에러 없이 작성할 것
