import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const chatData = await request.json();

    // 받은 데이터 구조 검증
    if (!chatData.timestamp || !Array.isArray(chatData.conversations)) {
      return NextResponse.json(
        { error: "잘못된 데이터 형식입니다." },
        { status: 400 }
      );
    }

    // 현재는 콘솔에 로그만 출력 (나중에 실제 저장 로직으로 교체)
    console.log("=== 채팅 데이터 저장 요청 ===");
    console.log("타임스탬프:", chatData.timestamp);
    console.log("총 질문 수:", chatData.totalQuestions);
    console.log("대화 내용:");

    chatData.conversations.forEach(
      (conv: { question: string; answer: string }, index: number) => {
        console.log(`${index + 1}. Q: ${conv.question}`);
        console.log(`   A: ${conv.answer}`);
      }
    );

    console.log("========================");

    // TODO: 여기에 실제 데이터베이스 저장 로직 추가
    // 예시:
    // - 데이터베이스에 저장
    // - 외부 API로 전송
    // - 파일로 저장 등

    return NextResponse.json({
      success: true,
      message: "대화 데이터가 성공적으로 저장되었습니다.",
      data: {
        savedAt: new Date().toISOString(),
        conversationCount: chatData.conversations.length
      }
    });
  } catch (error) {
    console.error("채팅 데이터 저장 중 오류:", error);

    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류"
      },
      { status: 500 }
    );
  }
}
