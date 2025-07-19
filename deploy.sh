#!/bin/bash

# 🚀 Vercel 배포 자동화 스크립트
# 
# 사용법: 
#   chmod +x deploy.sh
#   ./deploy.sh

echo "🚀 SEO Keyword Discovery Tool - Vercel 배포 시작"
echo "================================================"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 에러 발생 시 스크립트 중단
set -e

# 현재 디렉토리가 프로젝트 루트인지 확인
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 오류: package.json을 찾을 수 없습니다. 프로젝트 루트에서 실행해주세요.${NC}"
    exit 1
fi

echo -e "${BLUE}📦 1단계: 의존성 설치 및 검증${NC}"
npm install

echo -e "${BLUE}🔍 2단계: TypeScript 타입 체크${NC}"
npm run type-check

echo -e "${BLUE}🔨 3단계: 프로덕션 빌드 테스트${NC}"
npm run build

echo -e "${BLUE}📋 4단계: 필수 파일 존재 확인${NC}"

# 필수 파일들 체크
files_to_check=(
    "vercel.json"
    ".vercelignore" 
    ".env.example"
    "README.md"
    "DEPLOYMENT.md"
    "src/app/layout.tsx"
    "src/app/page.tsx"
    "tailwind.config.ts"
    "next.config.js"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file (누락)${NC}"
        exit 1
    fi
done

echo -e "${BLUE}📤 5단계: Git 상태 확인${NC}"

# Git 초기화 확인
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Git이 초기화되지 않았습니다. 초기화를 진행합니다...${NC}"
    git init
    git add .
    git commit -m "🎉 Initial commit: SEO keyword discovery tool"
else
    echo -e "${GREEN}✅ Git 저장소가 이미 초기화되어 있습니다.${NC}"
fi

# 변경사항 확인
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  커밋되지 않은 변경사항이 있습니다.${NC}"
    git status
    
    read -p "변경사항을 커밋하시겠습니까? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}📝 변경사항 커밋 중...${NC}"
        git add .
        read -p "커밋 메시지를 입력하세요 (기본: Update for deployment): " commit_message
        commit_message=${commit_message:-"🚀 Update for deployment"}
        git commit -m "$commit_message"
    fi
else
    echo -e "${GREEN}✅ 모든 변경사항이 커밋되어 있습니다.${NC}"
fi

echo -e "${BLUE}🔗 6단계: GitHub 원격 저장소 확인${NC}"

# 원격 저장소 확인
if git remote | grep -q "origin"; then
    echo -e "${GREEN}✅ GitHub 원격 저장소가 연결되어 있습니다.${NC}"
    git remote -v
    
    read -p "GitHub에 푸시하시겠습니까? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}📤 GitHub에 푸시 중...${NC}"
        git push origin main
    fi
else
    echo -e "${YELLOW}⚠️  GitHub 원격 저장소가 설정되지 않았습니다.${NC}"
    echo -e "${BLUE}다음 단계를 수행하세요:${NC}"
    echo "1. GitHub에서 새 저장소를 생성하세요"
    echo "2. 다음 명령어를 실행하세요:"
    echo -e "${YELLOW}   git remote add origin https://github.com/YOUR_USERNAME/seo-keyword-discovery-tool.git${NC}"
    echo -e "${YELLOW}   git push -u origin main${NC}"
fi

echo -e "${GREEN}✅ 배포 준비 완료!${NC}"
echo ""
echo -e "${BLUE}📋 다음 단계 - Vercel 배포:${NC}"
echo "1. https://vercel.com 접속"
echo "2. GitHub 계정으로 로그인"
echo "3. 'Import Project' 클릭"
echo "4. GitHub 저장소 선택"
echo "5. 프로젝트 설정 확인 후 Deploy 클릭"
echo ""
echo -e "${BLUE}📖 자세한 가이드는 DEPLOYMENT.md를 참조하세요${NC}"
echo ""
echo -e "${GREEN}🎉 Happy Deploying!${NC}"