# 채팅 애플리케이션

## 개요

이 애플리케이션은 질문-답변 형식의 대화를 진행하고, 완료 시 API를 통해 데이터를 처리하는 채팅 시스템입니다.

## 주요 기능

### 1. 대화 진행

- **질문 표시**: 페이지에서 전달받은 질문 목록을 순차적으로 표시
- **답변 입력**: 사용자가 각 질문에 대한 답변을 입력
- **진행률 표시**: 현재 진행 상황을 표시 (예: 2/5)
- **실시간 스크롤**: 새로운 메시지가 추가될 때 자동으로 하단으로 스크롤

### 2. 메시지 타입

- **question**: 질문 메시지 (파란색 배경)
- **answer**: 답변 메시지 (초록색 배경)
- **api_response**: API 응답 메시지 (노란색 배경)

### 3. API 통신

- **questionAnswerSave**: 모든 답변 완료 시 호출
  - POST 요청으로 대화 데이터 전송
  - 응답: `questions` 배열과 `reason` string
- **questionAnswer**: 조건부 호출
  - `questions` 배열이 4개 이상일 때 GET 요청
  - 추가 질문 데이터 수신

### 4. 상태 관리

- **입력 제어**: 웹소켓 통신 중, 처리 중, 완료 시 입력 비활성화
- **플레이스홀더**: 현재 상태에 따른 동적 플레이스홀더 텍스트
- **재시작**: 완료 후 새로 시작하기 기능

## 파일 구조

```
src/app/chat/
├── page.tsx          # 메인 페이지 (질문 목록 전달)
└── Chat.tsx          # 채팅 컴포넌트 (핵심 로직)
```

## API 엔드포인트

### POST /api/questionAnswerSave

대화 데이터를 저장하고 추가 질문 여부를 결정

**요청:**

```json
{
  "conversations": [
    {
      "question": "안녕하세요",
      "answer": "안녕하세요!"
    }
  ]
}
```

**응답:**

```json
{
  "questions": ["질문1", "질문2", "질문3", "질문4"],
  "reason": "추가 질문 생성 이유"
}
```

### GET /api/questionAnswer

추가 질문 데이터 조회

## 사용법

1. **질문 목록 설정**: `page.tsx`에서 질문 배열을 정의
2. **대화 진행**: 사용자가 각 질문에 답변
3. **자동 처리**: 완료 시 API 호출 및 응답 처리
4. **재시작**: 필요 시 새로 시작

## 기술 스택

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **상태 관리**: React Hooks (useState, useCallback, useMemo)
- **API 통신**: Fetch API

## 주요 컴포넌트

### Chat.tsx

- **ChatMessage**: 개별 메시지 렌더링
- **ChatInput**: 답변 입력 폼
- **RestartButton**: 재시작 버튼
- **API 호출 함수들**: saveQuestionAnswer, getQuestionAnswer

### page.tsx

- 질문 목록 관리
- Chat 컴포넌트에 props 전달

## 상태 흐름

1. **초기화**: 질문 목록 로드 → 첫 번째 질문 표시
2. **대화 진행**: 질문 → 답변 → 다음 질문 (반복)
3. **완료 처리**: 마지막 답변 → API 호출 → 응답 처리
4. **조건부 추가**: 4개 이상 질문 시 추가 API 호출
5. **재시작**: 상태 초기화 → 첫 번째 질문부터 재시작
