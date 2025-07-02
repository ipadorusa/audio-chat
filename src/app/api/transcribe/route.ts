import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "음성 파일이 필요합니다." },
        { status: 400 }
      );
    }

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // OpenAI Whisper API 호출을 위한 FormData 생성
    const openaiFormData = new FormData();
    openaiFormData.append("file", buffer, {
      filename: "audio.wav",
      contentType: audioFile.type || "audio/wav"
    });
    openaiFormData.append("model", "whisper-1");
    openaiFormData.append("language", "ko");

    // OpenAI API 키가 없으면 모의 응답 반환 (테스트용)
    if (!process.env.OPENAI_API_KEY) {
      console.log("OpenAI API 키가 없어서 모의 응답을 반환합니다.");
      return NextResponse.json({
        text: "이것은 테스트용 모의 텍스트입니다. 실제 OpenAI API 키를 설정하면 실제 음성 변환이 작동합니다.",
        success: true
      });
    }

    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      openaiFormData,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...openaiFormData.getHeaders()
        }
      }
    );

    return NextResponse.json({
      text: response.data.text,
      success: true
    });
  } catch (error) {
    console.error("음성 변환 오류:", error);
    return NextResponse.json(
      { error: "음성 변환 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
