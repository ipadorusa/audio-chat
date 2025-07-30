import { NextRequest, NextResponse } from "next/server";

// 랜덤 질문 목록
const RANDOM_QUESTIONS = [
  "오늘 기분이 어때요?",
  "가장 좋아하는 음식은 뭔가요?",
  "취미가 있나요?",
  "최근에 본 영화가 있나요?",
  "여행하고 싶은 곳이 있나요?",
  "좋아하는 음악 장르는 뭔가요?",
  "가장 기억에 남는 추억이 있나요?",
  "스트레스 해소 방법이 있나요?",
  "좋아하는 계절은 언제인가요?",
  "가장 소중한 물건이 있나요?",
  "꿈꾸는 직업이 있나요?",
  "좋아하는 색깔은 뭔가요?",
  "가장 좋아하는 동물은 뭔가요?",
  "운동을 자주 하나요?",
  "독서를 좋아하나요?",
  "요리를 해본 적이 있나요?",
  "가장 좋아하는 과목은 뭔가요?",
  "친구들과 자주 만나나요?",
  "게임을 좋아하나요?",
  "가장 기억에 남는 생일이 있나요?"
];

// 랜덤 이유 목록
const RANDOM_REASONS = [
  "더 깊이 있는 대화를 위해 추가 질문을 준비했습니다.",
  "사용자의 관심사를 더 자세히 파악하기 위해 질문을 생성했습니다.",
  "개인화된 경험을 제공하기 위해 추가 질문이 필요합니다.",
  "더 정확한 분석을 위해 추가 정보가 필요합니다.",
  "사용자의 선호도를 더 잘 이해하기 위해 질문을 준비했습니다.",
  "맞춤형 서비스를 제공하기 위해 추가 질문이 생성되었습니다.",
  "더 나은 추천을 위해 추가 정보를 수집합니다.",
  "사용자 경험을 향상시키기 위해 질문을 준비했습니다.",
  "개인화된 콘텐츠를 제공하기 위해 추가 질문이 필요합니다.",
  "더 정확한 결과를 위해 추가 질문을 생성했습니다."
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversations } = body;

    // 대화 데이터 검증
    if (!conversations || !Array.isArray(conversations)) {
      return NextResponse.json(
        { error: "Invalid conversations data" },
        { status: 400 }
      );
    }

    console.log("받은 대화 데이터:", conversations);

    // 랜덤하게 3개 이하 또는 4개 이상 결정 (70% 확률로 4개 이상)
    const shouldGenerateMany = Math.random() < 0.6;

    if (shouldGenerateMany) {
      // 4개 이상의 질문과 이유 생성
      const shuffledQuestions = [...RANDOM_QUESTIONS].sort(
        () => Math.random() - 0.5
      );
      const questionCount = Math.floor(Math.random() * 3) + 4; // 4-6개
      const questions = shuffledQuestions.slice(0, questionCount);

      const randomReason =
        RANDOM_REASONS[Math.floor(Math.random() * RANDOM_REASONS.length)];

      console.log("4개 이상 질문 생성:", { questions, reason: randomReason });

      return NextResponse.json({
        questions,
        reason: randomReason
      });
    } else {
      // 3개 이하의 질문만 생성
      const shuffledQuestions = [...RANDOM_QUESTIONS].sort(
        () => Math.random() - 0.5
      );
      const questionCount = Math.floor(Math.random() * 3) + 1; // 1-3개
      const questions = shuffledQuestions.slice(0, questionCount);

      console.log("3개 이하 질문 생성:", { questions });

      return NextResponse.json({
        questions
      });
    }
  } catch (error) {
    console.error("API 오류:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
