"use client"
import React, { useState, useEffect, useCallback } from 'react'

// API 엔드포인트 - 나중에 실제 주소로 변경
const API_ENDPOINT = process.env.NEXT_PUBLIC_CHAT_API_URL || '/api/chat/save';
type NewHistory = { type: "question" | 'answer', text: string }[];
type Conversation = { question: string; answer: string }[];

// 질문-답변 쌍으로 매핑하는 함수
function mapChatHistoryToConversations(history: NewHistory): Conversation {
  const conversations: Conversation = [];

  for (let i = 0; i < history.length - 1; i += 2) {
    const question = history[i];
    const answer = history[i + 1];

    if (question?.type === 'question' && answer?.type === 'answer') {
      conversations.push({
        question: question.text,
        answer: answer.text
      });
    }
  }
  return conversations;
}


// 진행률 계산 함수
function getProgress(currentIndex: number, total: number) {
  return `${currentIndex + 1}/${total}`;
}

// API로 데이터 전송하는 함수 (질문 배열도 인자로 받음)
async function saveChatData({
  finalHistory,
  questionArr,
  setIsSaving,
  setSaveStatus
}: {
  finalHistory: NewHistory;
  questionArr: string[];
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  setSaveStatus: React.Dispatch<React.SetStateAction<'idle' | 'success' | 'error'>>;
}) {
  setIsSaving(true);
  setSaveStatus('idle');
  try {
    const chatData = {
      timestamp: new Date().toISOString(),
      totalQuestions: questionArr.length,
      conversations: mapChatHistoryToConversations(finalHistory)
    };
    console.log('저장할 데이터:', chatData);
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatData)
    });
    if (response.ok) {
      setSaveStatus('success');
      console.log('대화 데이터가 성공적으로 저장되었습니다.');
    } else {
      throw new Error(`API 호출 실패: ${response.status}`);
    }
  } catch (error) {
    console.error('대화 저장 중 오류:', error);
    setSaveStatus('error');
  } finally {
    setIsSaving(false);
  }
}

export default function Chat() {
  // 질문 리스트는 빈 배열로 시작
  const [question, setQuestion] = useState<string[]>([]);
  // chatHistory는 빈 배열로 시작
  const [chatHistory, setChatHistory] = useState<NewHistory>([]);
  const [inputValue, setInputValue] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // 상태 초기화 함수
  const resetState = useCallback(() => {
    if (question.length > 0) {
      setChatHistory([{ type: "question", text: question[0] }]);
      setCurrentQuestionIndex(0);
      setIsCompleted(false);
      setIsSaving(false);
      setSaveStatus('idle');
      setInputValue("");
    }
  }, [question]);

  // 질문 리스트를 API에서 받아오는 부분 (여기선 예시로 setTimeout 사용)
  useEffect(() => {
    async function fetchQuestions() {
      // 실제 API 호출로 대체
      // const res = await fetch('/api/your-question-endpoint');
      // const data = await res.json();
      // setQuestion(data.questions);
      // 예시 데이터
      setTimeout(() => {
        setQuestion([
          "안녕하세요",
          "너는 누구냐?",
          "오늘 날씨는 어때?",
          "뭐 재미있는 이야기 없어?",
          "취미가 뭐야?"
        ]);
      }, 100);
    }
    fetchQuestions();
  }, []);

  // question이 세팅되면 chatHistory 초기화
  useEffect(() => {
    resetState();
  }, [resetState]);

  // 답변 전송 핸들러
  const handleSend = () => {
    if (inputValue.trim()) {
      const newHistory: NewHistory = [...chatHistory, { type: "answer", text: inputValue }];
      if (currentQuestionIndex < question.length - 1) {
        const nextQuestionIndex = currentQuestionIndex + 1;
        newHistory.push({ type: "question", text: question[nextQuestionIndex] });
        setCurrentQuestionIndex(nextQuestionIndex);
        setChatHistory(newHistory);
      } else {
        setChatHistory(newHistory);
        setIsCompleted(true);
        saveChatData({
          finalHistory: newHistory,
          questionArr: question,
          setIsSaving,
          setSaveStatus
        });
      }
      setInputValue("");
    }
  }

  // 새로 시작하기
  const handleRestart = () => {
    resetState();
  };

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
        {isCompleted && (
          <div className="flex justify-center">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
              <p className="text-sm font-medium">🎉 모든 질문이 완료되었습니다!</p>
              {isSaving && <p className="text-xs mt-1">데이터 저장 중...</p>}
              {saveStatus === 'success' && <p className="text-xs mt-1 text-green-600">✅ 저장 완료</p>}
              {saveStatus === 'error' && <p className="text-xs mt-1 text-red-600">❌ 저장 실패</p>}
            </div>
          </div>
        )}
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        {!isCompleted ? (
          <div className="flex space-x-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              placeholder="메시지를 입력하세요..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            <div className="text-center text-gray-600">
              <p className="text-sm">진행률: {question.length}/{question.length} 완료</p>
              {isSaving && (
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-sm">저장 중...</span>
                </div>
              )}
            </div>
            <button
              onClick={handleRestart}
              disabled={isSaving}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              새로 시작하기
            </button>
          </div>
        )}
        {!isCompleted && (
          <div className="mt-2 text-center text-gray-500 text-xs">
            진행률: {getProgress(currentQuestionIndex, question.length)}
          </div>
        )}
      </div>
    </div>
  )
}
