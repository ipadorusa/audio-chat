import { NextResponse } from "next/server";

// API 사용 예시를 위한 엔드포인트
export async function GET() {
  return NextResponse.json({
    message: "음성 텍스트 변환 API 사용 예시",
    endpoints: {
      transcribe: {
        url: "/api/transcribe",
        method: "POST",
        description: "음성 파일을 텍스트로 변환",
        request: {
          contentType: "multipart/form-data",
          body: {
            audio: "음성 파일 (File 객체)"
          }
        },
        response: {
          success: {
            text: "변환된 텍스트",
            success: true
          },
          error: {
            error: "오류 메시지",
            success: false
          }
        }
      }
    },
    examples: {
      javascript: `
// JavaScript/TypeScript 예시
const formData = new FormData();
formData.append('audio', audioFile);

const response = await fetch('/api/transcribe', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data.text); // 변환된 텍스트
      `,
      curl: `
# cURL 예시
curl -X POST http://localhost:3000/api/transcribe \\
  -F "audio=@recording.wav"
      `,
      python: `
# Python 예시
import requests

files = {'audio': open('recording.wav', 'rb')}
response = requests.post('http://localhost:3000/api/transcribe', files=files)
data = response.json()
print(data['text'])
      `
    }
  });
}
