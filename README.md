# 🔍 역방향 SEO 키워드 발굴 도구

네이버 검색에서 웹사이트가 노출되고 있는 모든 키워드를 발견하는 Next.js 기반 도구입니다.

## ✨ 주요 기능

- **🎯 역방향 키워드 발굴**: URL 입력만으로 숨겨진 키워드 발견
- **📊 실시간 분석 진행률**: 5단계 분석 과정을 실시간으로 모니터링
- **📋 상세 결과 테이블**: 키워드별 순위, 타입, 경쟁도 정보 제공
- **📈 대시보드 분석**: 트렌드, 기회 분석, 경쟁자 비교
- **🎨 반응형 디자인**: 모든 디바이스에서 최적화된 사용자 경험
- **🔍 지능형 필터링**: 검색 타입, 순위, 페이지별 필터링

## 🚀 빠른 시작

### 로컬 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/YOUR_USERNAME/seo-keyword-discovery-tool.git
cd seo-keyword-discovery-tool

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

개발 서버가 시작되면 [http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

### 환경변수 설정

```bash
# .env.local 파일 생성
cp .env.example .env.local

# 필요한 환경변수 설정
# (현재는 선택사항이며, 기본 기능은 환경변수 없이 동작)
```

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **Build**: Vercel, GitHub Actions
- **Analytics**: Recharts (차트 라이브러리)
- **Development**: ESLint, TypeScript, PostCSS

## 📱 화면 구성

### 1. 메인 검색 인터페이스
- URL 입력 및 실시간 유효성 검증
- 분석 옵션 설정 (검색 깊이, 광고 포함, 심화 분석)
- 예상 소요 시간 표시

### 2. 실시간 진행 상황
- 5단계 분석 과정 시각화
- 실시간 통계 및 로그
- 발견된 키워드 수 실시간 업데이트

### 3. 키워드 결과 테이블
- 정렬, 필터링, 검색 기능
- 키워드별 상세 정보 (순위, 타입, 경쟁도)
- 대량 선택 및 내보내기 기능

### 4. 분석 대시보드
- 핵심 지표 카드
- 순위 트렌드 차트
- 키워드 기회 분석
- 경쟁자 비교 분석

## 🚀 배포 가이드

상세한 Vercel 배포 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참조하세요.

### 간단 배포 과정

1. **GitHub에 코드 업로드**
2. **Vercel 계정 연결**
3. **프로젝트 Import**
4. **자동 배포 완료**

## 📂 프로젝트 구조

```
src/
├── app/                  # Next.js App Router
│   ├── globals.css      # 글로벌 스타일
│   ├── layout.tsx       # 루트 레이아웃
│   └── page.tsx         # 메인 페이지
├── components/          # React 컴포넌트
│   ├── layout/         # 레이아웃 컴포넌트
│   │   ├── Header.tsx  # 헤더/네비게이션
│   │   └── Sidebar.tsx # 사이드바
│   ├── Dashboard.tsx    # 대시보드
│   ├── KeywordResultsTable.tsx # 결과 테이블
│   ├── ProgressTracker.tsx     # 진행률 트래커
│   └── SearchInterface.tsx     # 검색 인터페이스
├── lib/                 # 유틸리티 함수
│   └── utils.ts
└── types/              # TypeScript 타입 정의
    └── index.ts
```

## 🔧 개발 스크립트

```bash
# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm run start

# 코드 린트
npm run lint

# TypeScript 타입 체크
npm run type-check
```

## 🎯 향후 개발 계획

### Phase 1: 기본 기능 (완료)
- ✅ UI/UX 디자인 및 구현
- ✅ 반응형 디자인
- ✅ Mock 데이터 기반 프로토타입

### Phase 2: 실제 API 연동 (계획)
- 🔄 네이버 검색 API 연동
- 🔄 구글 검색 API 연동
- 🔄 키워드 분석 알고리즘 구현

### Phase 3: 고급 기능 (계획)
- 🔄 사용자 계정 및 히스토리 관리
- 🔄 AI 기반 키워드 추천
- 🔄 경쟁자 자동 분석
- 🔄 알림 및 모니터링 기능

### Phase 4: 성능 최적화 (계획)
- 🔄 데이터베이스 연동
- 🔄 캐싱 전략 구현
- 🔄 배치 처리 시스템
- 🔄 성능 모니터링

## 🤝 기여 가이드

1. **Fork** 프로젝트
2. **Feature 브랜치** 생성 (`git checkout -b feature/amazing-feature`)
3. **변경사항 커밋** (`git commit -m 'Add amazing feature'`)
4. **브랜치에 푸시** (`git push origin feature/amazing-feature`)
5. **Pull Request** 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 지원 및 문의

- **이슈 리포트**: [GitHub Issues](https://github.com/YOUR_USERNAME/seo-keyword-discovery-tool/issues)
- **기능 제안**: [GitHub Discussions](https://github.com/YOUR_USERNAME/seo-keyword-discovery-tool/discussions)

---

**Made with ❤️ by Claude Code**