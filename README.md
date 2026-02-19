# Virtual Investment Committee (Virtual IC)

AI 멀티에이전트 기반 투자 검토 지원 시스템

## 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
```bash
cp .env.example .env.local
```
`.env.local`을 열어서 `ANTHROPIC_API_KEY`를 입력하세요.

### 3. 개발 서버 실행
```bash
npm run dev
```
http://localhost:3000 에서 확인하세요.

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/analyze/        # 분석 시작 API
│   ├── api/deals/          # 딜 CRUD API
│   ├── deal/[id]/          # 딜 상세 (토론 화면)
│   └── page.tsx            # 대시보드
├── components/             # React 컴포넌트
├── lib/
│   ├── agents/
│   │   ├── orchestrator.ts # 토론 오케스트레이션 엔진
│   │   └── prompts.ts      # 에이전트 시스템 프롬프트
│   └── file-parser.ts      # 파일 파싱 유틸리티
└── types/index.ts          # TypeScript 타입 정의
```
