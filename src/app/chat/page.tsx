import React from 'react'
import Chat from './Chat'

export default function page() {
  // API에서 내려준 질문 목록 (가정)
  const questions = [
    "안녕하세요",
    "너는 누구냐?",
    "오늘 날씨는 어때?",
    "뭐 재미있는 이야기 없어?",
    "취미가 뭐야?"
  ]

  return (
    <div>
      <Chat questions={questions} />
    </div>
  )
}
