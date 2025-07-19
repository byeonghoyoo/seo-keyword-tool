# 🚀 Vercel 배포 완전 가이드

역방향 SEO 키워드 발굴 도구를 Vercel에 배포하는 단계별 가이드입니다.

## 📋 배포 전 체크리스트

### ✅ 현재 프로젝트 상태
- ✅ Next.js 14.2.30 프로젝트 구조 완성
- ✅ TypeScript 설정 완료
- ✅ Tailwind CSS 구성 완료
- ✅ 모든 컴포넌트 구현 완료
- ✅ 로컬 개발 서버 테스트 통과
- ✅ 프로덕션 빌드 테스트 통과

### 🔧 필요한 계정 및 도구
- [ ] GitHub 계정
- [ ] Vercel 계정 (GitHub로 연동 권장)
- [ ] Git CLI 설치
- [ ] Node.js 18+ 설치 확인

---

## 📁 1단계: GitHub 저장소 생성

### 1.1 GitHub에서 새 저장소 생성

1. **GitHub 접속**: https://github.com
2. **New repository 클릭**
3. **저장소 설정**:
   ```
   Repository name: seo-keyword-discovery-tool
   Description: 역방향 SEO 키워드 발굴 도구
   Public/Private: Public (권장) 또는 Private
   Initialize: 체크하지 않음 (기존 프로젝트가 있으므로)
   ```
4. **Create repository 클릭**

### 1.2 로컬 프로젝트를 GitHub에 업로드

터미널에서 프로젝트 디렉토리로 이동 후 실행:

```bash
# Git 초기화 (아직 안했다면)
git init

# 모든 파일 추가
git add .

# 첫 번째 커밋
git commit -m "🎉 Initial commit: SEO keyword discovery tool"

# GitHub 저장소와 연결 (YOUR_USERNAME을 실제 GitHub 사용자명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/seo-keyword-discovery-tool.git

# main 브랜치로 푸시
git branch -M main
git push -u origin main
```

---

## ⚙️ 2단계: Vercel 설정 파일 생성

### 2.1 vercel.json 생성

프로젝트 루트에 `vercel.json` 파일을 생성합니다:

```json
{
  "version": 2,
  "name": "seo-keyword-discovery-tool",
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  "functions": {
    "src/app/**/*.{js,ts,jsx,tsx}": {
      "runtime": "@vercel/node@latest"
    }
  },
  "regions": ["icn1"],
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 2.2 .vercelignore 생성

불필요한 파일들이 배포에 포함되지 않도록 설정:

```
# Dependencies
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
.next/
out/
build/

# Environment files
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Git
.git/
.gitignore

# Testing
coverage/
.nyc_output/

# Temporary files
*.tmp
*.temp
```

---

## 🔐 3단계: 환경변수 설정

### 3.1 필요한 환경변수 목록

현재 프로젝트에서 사용할 수 있는 환경변수들:

```bash
# 기본 설정
NEXT_PUBLIC_APP_NAME="SEO Keyword Discovery Tool"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# API 설정 (향후 확장용)
NEXT_PUBLIC_API_BASE_URL="https://api.yourdomain.com"
API_SECRET_KEY="your-secret-key-here"

# 검색 엔진 API (향후 구현용)
NAVER_CLIENT_ID="your-naver-client-id"
NAVER_CLIENT_SECRET="your-naver-client-secret"
GOOGLE_API_KEY="your-google-api-key"

# 분석 도구
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_GTM_ID="GTM-XXXXXXX"

# 보안 설정
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://your-domain.vercel.app"

# 데이터베이스 (향후 확장용)
DATABASE_URL="your-database-connection-string"

# 기타
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED="1"
```

### 3.2 .env.example 파일 생성

다른 개발자들을 위한 환경변수 예시 파일:

```bash
# .env.example
# Copy this file to .env.local and fill in your values

# App Configuration
NEXT_PUBLIC_APP_NAME="SEO Keyword Discovery Tool"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# API Configuration (optional)
NEXT_PUBLIC_API_BASE_URL="https://api.yourdomain.com"
API_SECRET_KEY="your-secret-key-here"

# Search Engine APIs (for future implementation)
NAVER_CLIENT_ID="your-naver-client-id"
NAVER_CLIENT_SECRET="your-naver-client-secret"
GOOGLE_API_KEY="your-google-api-key"

# Analytics (optional)
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_GTM_ID="GTM-XXXXXXX"

# Authentication (for future implementation)
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Database (for future implementation)
DATABASE_URL="your-database-connection-string"
```

---

## 🚀 4단계: Vercel 배포 프로세스

### 4.1 Vercel 계정 생성 및 연결

1. **Vercel 접속**: https://vercel.com
2. **Sign up with GitHub** 클릭
3. **GitHub 권한 승인**
4. **Import Project** 선택

### 4.2 프로젝트 Import

1. **GitHub 저장소 선택**:
   ```
   seo-keyword-discovery-tool 선택
   ```

2. **프로젝트 설정**:
   ```
   Project Name: seo-keyword-discovery-tool
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   Development Command: npm run dev
   ```

3. **환경변수 설정** (선택사항):
   - Environment Variables 섹션에서 필요한 변수들 추가
   - 최소한 `NEXT_TELEMETRY_DISABLED=1` 추가 권장

### 4.3 배포 실행

1. **Deploy 버튼 클릭**
2. **배포 진행 상황 모니터링**:
   ```
   ⏳ Queued
   🔨 Building
   ✅ Ready
   ```

3. **배포 완료 확인**:
   - 배포 URL 확인 (예: `https://seo-keyword-discovery-tool.vercel.app`)
   - 모든 페이지 정상 작동 확인

---

## 🔧 5단계: 배포 후 설정 및 최적화

### 5.1 도메인 설정 (선택사항)

1. **Vercel 대시보드** → **Domains** 탭
2. **Add Domain** 클릭
3. **도메인 입력** (예: `keyword-tool.com`)
4. **DNS 설정 안내에 따라 설정**

### 5.2 환경변수 업데이트

Vercel 대시보드에서:
1. **Settings** → **Environment Variables**
2. **필요한 변수들 추가/수정**
3. **프로덕션/프리뷰/개발 환경별 설정**

### 5.3 자동 배포 설정

```bash
# GitHub에 푸시할 때마다 자동 배포
git add .
git commit -m "✨ Add new feature"
git push origin main
```

Vercel이 자동으로:
- 코드 변경 감지
- 빌드 실행
- 배포 완료

---

## 📊 6단계: 배포 검증 및 모니터링

### 6.1 기능 테스트 체크리스트

배포된 사이트에서 다음 기능들을 테스트:

- [ ] **홈페이지 로딩**: 메인 페이지가 정상적으로 표시되는가?
- [ ] **URL 입력**: URL 입력 필드가 작동하는가?
- [ ] **옵션 설정**: 검색 깊이, 광고 포함, 심화 분석 토글이 작동하는가?
- [ ] **반응형 디자인**: 모바일/태블릿에서 정상 표시되는가?
- [ ] **페이지 전환**: 다른 뷰(진행률, 결과, 대시보드)로 전환되는가?
- [ ] **아이콘 표시**: Lucide React 아이콘들이 정상 표시되는가?
- [ ] **한글 폰트**: 한글 텍스트가 올바르게 렌더링되는가?

### 6.2 성능 최적화 확인

1. **Lighthouse 점수 확인**: 
   - https://pagespeed.web.dev/ 에서 배포된 URL 테스트
   - Performance, Accessibility, Best Practices, SEO 점수 확인

2. **Core Web Vitals 확인**:
   - LCP (Largest Contentful Paint) < 2.5s
   - FID (First Input Delay) < 100ms
   - CLS (Cumulative Layout Shift) < 0.1

### 6.3 Vercel Analytics 설정

1. **Vercel 대시보드** → **Analytics** 탭
2. **Enable Analytics** 클릭
3. **실시간 트래픽 및 성능 데이터 모니터링**

---

## 🔄 7단계: 지속적인 개발 및 배포

### 7.1 개발 워크플로

```bash
# 1. 새로운 기능 개발
git checkout -b feature/new-feature
# 코드 작성...

# 2. 로컬 테스트
npm run dev
npm run build
npm run type-check

# 3. GitHub에 푸시
git add .
git commit -m "✨ Add new feature"
git push origin feature/new-feature

# 4. Pull Request 생성 (GitHub에서)

# 5. 메인 브랜치에 머지 후 자동 배포
git checkout main
git pull origin main
```

### 7.2 배포 브랜치 전략

- **main 브랜치**: 프로덕션 배포
- **develop 브랜치**: 스테이징 환경 (선택사항)
- **feature/* 브랜치**: 기능 개발

---

## 🛠️ 8단계: 트러블슈팅 가이드

### 8.1 일반적인 배포 오류

**빌드 실패:**
```bash
# 로컬에서 빌드 테스트
npm run build

# TypeScript 오류 확인
npm run type-check

# 의존성 문제 해결
rm -rf node_modules package-lock.json
npm install
```

**환경변수 문제:**
- Vercel 대시보드에서 환경변수 설정 확인
- `NEXT_PUBLIC_` 접두사가 필요한 변수 확인
- 프로덕션/프리뷰 환경별 설정 확인

**도메인 연결 문제:**
- DNS 설정 확인 (A 레코드 또는 CNAME)
- 전파 시간 대기 (최대 48시간)
- SSL 인증서 자동 발급 대기

### 8.2 성능 최적화

**이미지 최적화:**
```javascript
// next.config.js에 추가
module.exports = {
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
}
```

**번들 크기 최적화:**
```bash
# 번들 분석
npm install --save-dev @next/bundle-analyzer
```

---

## 📞 지원 및 문의

### 공식 문서
- **Vercel 문서**: https://vercel.com/docs
- **Next.js 배포 가이드**: https://nextjs.org/docs/deployment

### 커뮤니티 지원
- **Vercel Discord**: https://vercel.com/discord
- **Next.js GitHub**: https://github.com/vercel/next.js

---

## 🎉 축하합니다!

이제 역방향 SEO 키워드 발굴 도구가 성공적으로 배포되었습니다!

**배포된 사이트 예시 URL**: `https://seo-keyword-discovery-tool.vercel.app`

### 다음 단계 추천사항:
1. **실제 API 연동**: 네이버/구글 검색 API 구현
2. **데이터베이스 연결**: 키워드 히스토리 저장 기능
3. **사용자 인증**: 개인 계정 및 데이터 관리
4. **고급 분석**: AI 기반 키워드 추천 기능
5. **모니터링**: 사용자 분석 및 오류 추적

Happy coding! 🚀