# 음성 텍스트 변환기

Next.js 14와 React 18을 사용한 음성 텍스트 변환 웹 애플리케이션입니다.

## 기능

- 🎤 실시간 음성 녹음
- 🔄 OpenAI Whisper API를 통한 음성 텍스트 변환
- 📋 변환된 텍스트 클립보드 복사
- 🎨 모던하고 반응형 UI
- 🇰🇷 한국어 지원

## 설치 및 실행

1. 패키지 설치:

```bash
pnpm install
```

2. 환경 변수 설정 (선택사항):
   `.env.local` 파일을 생성하고 OpenAI API 키를 추가하세요:

```
OPENAI_API_KEY=your_openai_api_key_here
```

3. 개발 서버 실행:

```bash
pnpm dev
```

4. 브라우저에서 `http://localhost:3000` 접속

## 사용법

1. **녹음 시작**: "녹음 시작" 버튼을 클릭하여 음성 녹음을 시작합니다.
2. **녹음 중지**: "녹음 중지" 버튼을 클릭하여 녹음을 종료합니다.
3. **텍스트 확인**: 녹음이 완료되면 자동으로 텍스트로 변환됩니다.
4. **텍스트 복사**: "텍스트 복사" 버튼을 클릭하여 클립보드에 복사합니다.

## API 엔드포인트

### POST /api/transcribe

음성 파일을 텍스트로 변환하는 API입니다.

**요청:**

- Content-Type: `multipart/form-data`
- Body: `audio` 필드에 음성 파일

**응답:**

```json
{
  "text": "변환된 텍스트",
  "success": true
}
```

## 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: CSS Modules
- **API**: OpenAI Whisper API
- **HTTP Client**: Axios
- **Package Manager**: pnpm

## 주의사항

- OpenAI API 키가 설정되지 않은 경우 테스트용 모의 응답이 반환됩니다.
- 실제 음성 변환을 위해서는 OpenAI API 키가 필요합니다.
- 브라우저에서 마이크 접근 권한을 허용해야 합니다.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
