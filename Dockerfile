# === 1단계: 빌드 환경 (Builder Stage) ===
# Next.js 빌드에 필요한 모든 의존성을 설치하고 앱을 빌드하는 단계
FROM node:20-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사 (캐시 활용을 위해 먼저 복사)
COPY package.json package-lock.json ./

# 의존성 설치 (개발 및 프로덕션 모두 포함)
RUN npm ci

# 소스 코드 복사
COPY . .

# Next.js 애플리케이션 빌드
# 이 단계에서 Next.js는 최적화된 프로덕션 빌드 결과물을 .next 폴더에 생성합니다.
RUN npx prisma generate
RUN npm run build

# node_modules 중에서 프로덕션에 필요한 것만 남기기 위해 devDependencies 정리
RUN npm prune --production

# === 2단계: 프로덕션 환경 (Runner Stage) ===
# 실제 서비스를 위한 최종 이미지. 필요한 파일만 복사하여 이미지 크기를 최소화합니다.
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat

# Next.js가 기본으로 사용하는 포트 설정 (변경 가능)
ENV PORT=3000

# 작업 디렉토리 설정
WORKDIR /app

# 1단계에서 빌드된 결과물 복사
# .next 폴더와 public 폴더 복사
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# 프로덕션에 필요한 package.json과 node_modules 복사
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Vercel/Next.js 공식 권장 사항: Next.js 서버를 실행할 권한이 없는 사용자 생성 및 사용
RUN addgroup -g 1001 nodejs
RUN adduser -D -u 1001 -G nodejs nextjs
USER nextjs

# 서버 실행 명령 설정
CMD ["npm", "start"]