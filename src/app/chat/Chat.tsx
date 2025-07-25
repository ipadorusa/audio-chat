"use client"
import React, { useState } from 'react'

export default function Chat() {
  const [question] = useState([
    "안녕하세요",
    "너는 누구냐?",
    "오늘 날씨는 어때?",
    "뭐 재미있는 이야기 없어?",
    "취미가 뭐야?"
  ])
  const [chatHistory, setChatHistory] = useState<{ type: 'question' | 'answer', text: string }[]>([
    { type: 'question', text: "안녕하세요" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleSend = () => {
    if (inputValue.trim()) {
      // 답변 추가
      const newHistory: { type: 'question' | 'answer', text: string }[] = [...chatHistory, { type: 'answer' as const, text: inputValue }];

      // 다음 질문이 있으면 추가
      if (currentQuestionIndex < question.length - 1) {
        const nextQuestionIndex = currentQuestionIndex + 1;
        newHistory.push({ type: 'question' as const, text: question[nextQuestionIndex] });
        setCurrentQuestionIndex(nextQuestionIndex);
      }

      setChatHistory(newHistory);
      setInputValue("");
    }
  }

  return (
    <div className="flex flex-col bg-gray-50 p-4">
      <div className="chat-list h-[500px] overflow-auto p-4 space-y-4 bg-white border border-gray-200 rounded-lg mb-4">
        {chatHistory.map((chat, index) => (
          <div key={index} className={`flex ${chat.type === 'question' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 ${chat.type === 'question'
              ? 'bg-gray-100 text-gray-800 rounded-br-lg rounded-tl-lg rounded-tr-lg'
              : 'bg-blue-500 text-white rounded-bl-lg rounded-tl-lg rounded-tr-lg'
              }`}>
              <p className="text-sm">{chat.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex space-x-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            placeholder="메시지를 입력하세요..."
          />
          <button
            type="button"
            onClick={handleSend}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
