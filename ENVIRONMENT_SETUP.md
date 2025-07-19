# SEO 키워드 분석 도구 환경 설정 가이드

## 필수 환경변수 설정

### 1. 환경변수 파일 생성
`.env.local` 파일을 프로젝트 루트에 생성하고 다음 내용을 설정하세요:

```bash
# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Google AI API (필수 - 키워드 분석)
GOOGLE_AI_API_KEY="your-google-ai-api-key"

# Google Places API (선택사항 - 경쟁사 분석)
GOOGLE_PLACES_API_KEY="your-google-places-api-key"

# Google 지오코딩 API (선택사항 - 위치 기반 경쟁사 검색)
GOOGLE_GEOCODING_API_KEY="your-google-geocoding-api-key"

# 네이버 검색 API (선택사항 - 검색 순위 확인)
NAVER_CLIENT_ID="your-naver-client-id"
NAVER_CLIENT_SECRET="your-naver-client-secret"

# Google 검색 API (선택사항 - 검색 순위 확인)
GOOGLE_SEARCH_API_KEY="your-google-search-api-key"
GOOGLE_SEARCH_ENGINE_ID="your-google-search-engine-id"
```

## API 키 발급 가이드

### 1. Supabase 설정 (필수)
1. [Supabase](https://supabase.com) 가입 및 프로젝트 생성
2. Settings → API에서 URL과 anon key 복사
3. Settings → API에서 service_role key 복사
4. SQL Editor에서 `supabase-schema.sql` 실행하여 테이블 생성

### 2. Google AI API 키 발급 (필수)
1. [Google AI Studio](https://aistudio.google.com) 접속
2. "Get API key" 클릭하여 새 API 키 생성
3. API 키를 복사하여 `GOOGLE_AI_API_KEY`에 설정

### 3. Google Places API 키 발급 (선택사항)
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. APIs & Services → Library에서 "Places API" 검색 및 활성화
4. APIs & Services → Credentials에서 API 키 생성
5. API 키 제한 설정:
   - Application restrictions: HTTP referrers (websites)
   - API restrictions: Places API
6. API 키를 `GOOGLE_PLACES_API_KEY`에 설정

### 4. Google 지오코딩 API 키 발급 (선택사항)
1. Google Cloud Console에서 "Geocoding API" 검색 및 활성화
2. Places API와 동일한 방식으로 API 키 설정
3. API 키를 `GOOGLE_GEOCODING_API_KEY`에 설정

### 5. 네이버 검색 API 설정 (선택사항)
1. [네이버 개발자 센터](https://developers.naver.com) 가입
2. Application 등록 → 검색 API 선택
3. Client ID와 Client Secret 복사
4. `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`에 설정

### 6. Google 검색 API 설정 (선택사항)
1. Google Cloud Console에서 "Custom Search API" 활성화
2. [Google 프로그래밍 가능한 검색](https://programmablesearchengine.google.com) 접속
3. 새 검색 엔진 생성
4. 검색 엔진 ID 복사하여 `GOOGLE_SEARCH_ENGINE_ID`에 설정
5. API 키를 `GOOGLE_SEARCH_API_KEY`에 설정

## 기능별 필수/선택 API

### 🟢 기본 기능 (필수 API)
- **Supabase**: 데이터 저장, 분석 히스토리
- **Google AI API**: 키워드 추출 및 분석

### 🟡 고급 기능 (선택 API)
- **Google Places API**: 경쟁사 자동 검색 및 분석
- **Google 지오코딩 API**: 위치 기반 경쟁사 검색
- **네이버 검색 API**: 실제 검색 순위 확인
- **Google 검색 API**: 글로벌 검색 순위 확인

## API 사용량 및 제한

### Google AI API
- **무료**: 월 15회 요청
- **유료**: $0.0025/1K 토큰
- **권장**: 소규모 사용시 무료 플랜 충분

### Google Places API
- **무료**: 월 $200 크레딧 (약 2,000회 검색)
- **유료**: $17/1,000회 요청
- **권장**: 경쟁사 분석이 중요한 경우 설정

### 네이버 검색 API
- **무료**: 일 25,000회 요청
- **유료**: 초과시 유료 전환
- **권장**: 한국 검색 최적화시 필수

## 설정 확인 방법

### 1. 환경변수 확인
```bash
npm run dev
```
서버 시작 시 콘솔에서 설정된 API 키 확인

### 2. 기능별 테스트
1. **기본 분석**: https://m.rubyps.co.kr 입력하여 테스트
2. **경쟁사 분석**: Google Places API 설정 후 분석 결과에서 경쟁사 목록 확인
3. **순위 확인**: 네이버/구글 API 설정 후 실제 순위 데이터 확인

## 문제 해결

### API 키 오류
- API 키가 올바른지 확인
- API가 활성화되어 있는지 확인
- 사용량 제한을 초과하지 않았는지 확인

### Supabase 연결 오류
- URL과 키가 올바른지 확인
- 데이터베이스 스키마가 설정되었는지 확인
- RLS 정책이 올바르게 설정되었는지 확인

### 분석 실패
- Google AI API 키가 설정되었는지 확인
- 대상 URL이 접근 가능한지 확인
- 방화벽이나 로봇 차단이 없는지 확인

## 프로덕션 배포 시 주의사항

### 1. 환경변수 보안
- API 키를 코드에 직접 포함하지 말 것
- 프로덕션 환경에서는 별도의 환경변수 관리 서비스 사용

### 2. API 제한 관리
- 사용량 모니터링 설정
- 필요시 요청 제한 로직 구현
- 백업 API 키 준비

### 3. 성능 최적화
- API 응답 캐싱 구현
- 불필요한 API 호출 최소화
- 비동기 처리로 사용자 경험 개선