# SEO 키워드 분석 도구 - 실제 기능 구현 가이드

이 가이드는 Mock 데이터를 사용하던 SEO 키워드 분석 도구를 실제로 동작하는 시스템으로 변환하는 과정을 설명합니다.

## 🎯 구현된 기능

### 1. 웹 스크래핑 (URL 크롤링)
- **파일**: `src/lib/scraper.ts`
- **기능**: 
  - URL 검증 및 표준화
  - 웹페이지 콘텐츠 추출 (제목, 설명, 키워드, 헤딩 등)
  - 메타 태그 분석
  - 이미지 및 링크 추출

### 2. Google AI API 연동
- **파일**: `src/lib/google-ai.ts`
- **기능**:
  - Gemini 1.5 Flash 모델을 사용한 키워드 분석
  - 1차, 2차, 롱테일, 경쟁사 키워드 자동 생성
  - 검색 의도 분석 (informational, navigational, transactional, commercial)
  - 키워드 난이도 및 우선순위 평가

### 3. 검색 순위 확인
- **파일**: `src/lib/search-ranking.ts`
- **기능**:
  - 네이버 검색 API 연동
  - Google Custom Search API 연동
  - 키워드별 검색 순위 확인
  - 검색량 및 경쟁도 추정

### 4. Supabase 데이터베이스
- **파일**: `src/lib/supabase.ts`, `supabase-schema.sql`
- **기능**:
  - 분석 작업 상태 관리
  - 키워드 결과 저장
  - 실시간 로그 저장
  - Row Level Security (RLS) 적용

### 5. 실시간 진행률 표시
- **파일**: 
  - API: `src/app/api/analysis/progress/[jobId]/route.ts`
  - 프론트엔드: `src/hooks/useAnalysis.ts`
- **기능**:
  - Server-Sent Events (SSE)를 통한 실시간 업데이트
  - 5단계 분석 프로세스 진행률 표시
  - 에러 상태 및 로그 실시간 전송

### 6. 통합 분석 서비스
- **파일**: `src/lib/analysis-service.ts`
- **기능**:
  - 전체 분석 프로세스 오케스트레이션
  - 백그라운드 작업 관리
  - 단계별 진행률 업데이트
  - 에러 처리 및 복구

## 🚀 설정 방법

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 값들을 설정하세요:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Google AI 설정
GOOGLE_AI_API_KEY="your-google-ai-api-key"

# 네이버 검색 API
NAVER_CLIENT_ID="your-naver-client-id"
NAVER_CLIENT_SECRET="your-naver-client-secret"

# Google 검색 API (선택사항)
GOOGLE_SEARCH_API_KEY="your-google-search-api-key"
GOOGLE_SEARCH_ENGINE_ID="your-google-search-engine-id"
```

### 2. Supabase 데이터베이스 설정

1. Supabase 프로젝트 생성
2. `supabase-schema.sql` 파일의 내용을 Supabase SQL 에디터에서 실행
3. Row Level Security 정책 확인

### 3. Google AI API 설정

1. Google AI Studio에서 API 키 생성
2. Gemini API 접근 권한 확인

### 4. 네이버 검색 API 설정

1. 네이버 개발자 센터에서 애플리케이션 등록
2. 검색 API 사용 설정

## 📝 사용 방법

### 1. 분석 시작

```typescript
// 프론트엔드에서 분석 시작
const { startAnalysis, job, results, logs, isLoading, error } = useAnalysis();

await startAnalysis('https://example.com', {
  maxPages: 3,
  includeAds: true,
  deepAnalysis: true,
  searchEngine: 'naver'
});
```

### 2. 실시간 진행률 확인

```typescript
// SSE를 통한 실시간 업데이트
// useAnalysis 훅이 자동으로 처리
console.log('진행률:', job?.progress);
console.log('현재 단계:', job?.currentPhase);
console.log('현재 키워드:', job?.currentKeyword);
```

### 3. 결과 확인

```typescript
// 분석 완료 후 결과 확인
if (job?.status === 'completed') {
  console.log('키워드 결과:', results);
  console.log('분석 로그:', logs);
}
```

## 🔧 API 엔드포인트

### 분석 시작
- **POST** `/api/analysis/start`
- **Body**: `{ targetUrl: string, options: AnalysisOptions }`

### 진행률 확인 (SSE)
- **GET** `/api/analysis/progress/[jobId]`
- **Response**: Server-Sent Events stream

### 결과 조회
- **GET** `/api/analysis/results/[jobId]`
- **Response**: 분석 결과 및 로그

## 🔄 분석 프로세스

1. **웹사이트 분석** (analyzing)
   - URL 검증 및 콘텐츠 스크래핑
   - 메타데이터 추출

2. **AI 키워드 분석** (expanding)
   - Google AI를 통한 키워드 생성
   - 검색 의도 및 우선순위 분석

3. **검색 순위 확인** (crawling)
   - 네이버/구글 검색 결과 수집
   - 순위 및 경쟁도 분석

4. **데이터 처리** (processing)
   - 결과 저장 및 정리
   - 통계 계산

5. **완료** (completing)
   - 최종 결과 제공
   - 보고서 생성 준비

## 🛠️ 개발 팁

### 1. 디버깅

```bash
# 개발 서버 실행
npm run dev

# 로그 확인
# 브라우저 개발자 도구 콘솔에서 분석 진행 상황 확인
```

### 2. 에러 처리

- 모든 API 호출에는 적절한 에러 처리가 구현되어 있습니다
- `useAnalysis` 훅의 `error` 상태를 확인하여 사용자에게 피드백 제공

### 3. 성능 최적화

- API 호출 간 지연시간 설정으로 레이트 리밋 방지
- 배치 처리를 통한 효율적인 키워드 분석
- 실시간 업데이트를 위한 SSE 사용

## 🔒 보안 고려사항

1. **API 키 보안**
   - 환경 변수를 통한 API 키 관리
   - 클라이언트 사이드에서 민감한 키 노출 방지

2. **입력 검증**
   - URL 유효성 검사
   - SQL 인젝션 방지
   - XSS 공격 방지

3. **레이트 리밋**
   - API 호출 간격 제어
   - 동시 요청 수 제한

## 📊 모니터링

- Supabase 대시보드에서 데이터베이스 상태 확인
- API 에러 로그 모니터링
- 사용량 및 성능 메트릭 추적

이제 SEO 키워드 분석 도구가 실제 데이터와 연동되어 완전히 동작합니다!