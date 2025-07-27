"use client"
import React, { useState, useEffect, useCallback } from 'react'

// 타입 정의
type ChatMessage = { type: "question" | 'answer', text: string }
type Conversation = { question: string; answer: string }

// 상수 정의
const API_ENDPOINT = process.env.NEXT_PUBLIC_CHAT_API_URL || '/api/chat/save'
const SAMPLE_QUESTIONS = [
  "안녕하세요",
  "너는 누구냐?",
  "오늘 날씨는 어때?",
  "뭐 재미있는 이야기 없어?",
  "취미가 뭐야?"
]

// 유틸리티 함수들
const mapChatHistoryToConversations = (history: ChatMessage[]): Conversation[] => {
  const conversations: Conversation[] = []

  for (let i = 0; i < history.length - 1; i += 2) {
    const question = history[i]
    const answer = history[i + 1]

    if (question?.type === 'question' && answer?.type === 'answer') {
      conversations.push({
        question: question.text,
        answer: answer.text
      })
    }
  }
  return conversations
}

const getProgress = (currentIndex: number, total: number) => {
  return `${currentIndex + 1}/${total}`
}

// 웹소켓 통신 함수
const handleWebSocketCommunication = async (
  currentQuestion: string,
  setIsWebSocketActive: React.Dispatch<React.SetStateAction<boolean>>,
  setWebSocketResult: React.Dispatch<React.SetStateAction<string>>
) => {
  setIsWebSocketActive(true)

  try {
    // 여기에 실제 웹소켓 통신 로직을 구현
    // 예시로 setTimeout 사용 (실제로는 웹소켓 연결)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 웹소켓 결과를 받았다고 가정
    setWebSocketResult(`웹소켓 응답: ${currentQuestion}에 대한 처리 완료`)

  } catch (error) {
    console.error('웹소켓 통신 오류:', error)
    setWebSocketResult('웹소켓 통신 실패')
  } finally {
    setIsWebSocketActive(false)
  }
}

// API로 데이터 전송하는 함수
const saveChatData = async ({
  finalHistory,
  questionArr,
  setIsSaving,
  setSaveStatus
}: {
  finalHistory: ChatMessage[]
  questionArr: string[]
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>
  setSaveStatus: React.Dispatch<React.SetStateAction<'idle' | 'success' | 'error'>>
}) => {
  setIsSaving(true)
  setSaveStatus('idle')

  try {
    const chatData = {
      timestamp: new Date().toISOString(),
      totalQuestions: questionArr.length,
      conversations: mapChatHistoryToConversations(finalHistory)
    }

    console.log('저장할 데이터:', chatData)

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatData)
    })

    if (response.ok) {
      setSaveStatus('success')
      console.log('대화 데이터가 성공적으로 저장되었습니다.')
    } else {
      throw new Error(`API 호출 실패: ${response.status}`)
    }
  } catch (error) {
    console.error('대화 저장 중 오류:', error)
    setSaveStatus('error')
  } finally {
    setIsSaving(false)
  }
}

// 채팅 메시지 컴포넌트
const ChatMessage = ({
  message,
  index,
  isCurrentQuestion,
  isWebSocketActive
}: {
  message: ChatMessage
  index: number
  isCurrentQuestion: (index: number) => boolean
  isWebSocketActive: boolean
}) => {
  const isQuestion = message.type === 'question'
  const isCurrent = isCurrentQuestion(index)

  const getMessageClasses = () => {
    if (isQuestion) {
      return isCurrent
        ? 'bg-blue-500 text-white rounded-br-lg rounded-tl-lg rounded-tr-lg'
        : 'bg-gray-100 text-gray-800 rounded-br-lg rounded-tl-lg rounded-tr-lg'
    } else {
      return 'bg-green-500 text-white rounded-bl-lg rounded-tl-lg rounded-tr-lg'
    }
  }

  return (
    <div className={`flex ${isQuestion ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 ${getMessageClasses()}`}>
        <p className="text-sm">{message.text}</p>
        {isQuestion && isCurrent && isWebSocketActive && (
          <div className="flex items-center mt-1">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
            <span className="text-xs">웹소켓 통신 중...</span>
          </div>
        )}
      </div>
    </div>
  )
}

// 완료 메시지 컴포넌트
const CompletionMessage = ({
  isSaving,
  saveStatus
}: {
  isSaving: boolean
  saveStatus: 'idle' | 'success' | 'error'
}) => (
  <div className="flex justify-center">
    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
      <p className="text-sm font-medium">🎉 모든 질문이 완료되었습니다!</p>
      {isSaving && <p className="text-xs mt-1">데이터 저장 중...</p>}
      {saveStatus === 'success' && <p className="text-xs mt-1 text-green-600">✅ 저장 완료</p>}
      {saveStatus === 'error' && <p className="text-xs mt-1 text-red-600">❌ 저장 실패</p>}
    </div>
  </div>
)

// 입력 폼 컴포넌트
const ChatInput = ({
  inputValue,
  setInputValue,
  handleSend,
  isWebSocketActive
}: {
  inputValue: string
  setInputValue: (value: string) => void
  handleSend: () => void
  isWebSocketActive: boolean
}) => (
  <div className="flex space-x-2">
    <textarea
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
      rows={2}
      placeholder={isWebSocketActive ? "웹소켓 통신 중..." : "메시지를 입력하세요..."}
      disabled={isWebSocketActive}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey && !isWebSocketActive) {
          e.preventDefault()
          handleSend()
        }
      }}
    />
    <button
      type="button"
      onClick={handleSend}
      disabled={!inputValue.trim() || isWebSocketActive}
      className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
    >
      Send
    </button>
  </div>
)

// 재시작 버튼 컴포넌트
const RestartButton = ({
  handleRestart,
  isSaving
}: {
  handleRestart: () => void
  isSaving: boolean
}) => (
  <div className="flex flex-col space-y-2">
    <div className="text-center text-gray-600">
      <p className="text-sm">진행률: 5/5 완료</p>
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
)

// 메인 Chat 컴포넌트
export default function Chat() {
  // 상태 관리
  const [questions, setQuestions] = useState<string[]>([])
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [isWebSocketActive, setIsWebSocketActive] = useState(false)
  const [webSocketResult, setWebSocketResult] = useState<string>('')

  // 현재 질문인지 확인하는 함수
  const isCurrentQuestion = useCallback((index: number) => {
    const questions = chatHistory.filter(chat => chat.type === 'question')
    const currentQuestionText = questions[currentQuestionIndex]?.text
    const currentItemText = chatHistory[index]?.text

    return chatHistory[index]?.type === 'question' && currentQuestionText === currentItemText
  }, [chatHistory, currentQuestionIndex])

  // 상태 초기화 함수
  const resetState = useCallback(() => {
    if (questions.length > 0) {
      setChatHistory([{ type: "question", text: questions[0] }])
      setCurrentQuestionIndex(0)
      setIsCompleted(false)
      setIsSaving(false)
      setSaveStatus('idle')
      setInputValue("")
      setIsWebSocketActive(false)
      setWebSocketResult('')
    }
  }, [questions])

  // 질문 리스트를 API에서 받아오는 부분
  useEffect(() => {
    const fetchQuestions = async () => {
      // 실제 API 호출로 대체
      // const res = await fetch('/api/your-question-endpoint')
      // const data = await res.json()
      // setQuestions(data.questions)

      // 예시 데이터
      setTimeout(() => {
        setQuestions(SAMPLE_QUESTIONS)
      }, 100)
    }
    fetchQuestions()
  }, [])

  // question이 설정되면 첫 번째 질문 추가
  useEffect(() => {
    if (questions.length > 0 && chatHistory.length === 0) {
      setChatHistory([{ type: "question", text: questions[0] }])
      setCurrentQuestionIndex(0)
    }
  }, [questions, chatHistory.length])

  // 현재 질문이 변경될 때 웹소켓 통신 실행
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length && chatHistory.some(chat => chat.type === 'question')) {
      const currentQuestion = questions[currentQuestionIndex]
      handleWebSocketCommunication(currentQuestion, setIsWebSocketActive, setWebSocketResult)
    }
  }, [currentQuestionIndex, questions, chatHistory])

  // 답변 전송 핸들러
  const handleSend = useCallback(() => {
    if (inputValue.trim()) {
      const newHistory: ChatMessage[] = [...chatHistory, { type: "answer", text: inputValue }]

      if (currentQuestionIndex < questions.length - 1) {
        const nextQuestionIndex = currentQuestionIndex + 1
        newHistory.push({ type: "question", text: questions[nextQuestionIndex] })
        setCurrentQuestionIndex(nextQuestionIndex)
        setChatHistory(newHistory)
      } else {
        setChatHistory(newHistory)
        setIsCompleted(true)
        saveChatData({
          finalHistory: newHistory,
          questionArr: questions,
          setIsSaving,
          setSaveStatus
        })
      }
      setInputValue("")
    }
  }, [inputValue, chatHistory, currentQuestionIndex, questions])

  // 새로 시작하기
  const handleRestart = useCallback(() => {
    resetState()
  }, [resetState])

  return (
    <div className="flex flex-col bg-gray-50 p-4">
      {/* 채팅 메시지 영역 */}
      <div className="chat-list h-[500px] overflow-auto p-4 space-y-4 bg-white border border-gray-200 rounded-lg mb-4">
        {chatHistory.map((message, index) => (
          <ChatMessage
            key={index}
            message={message}
            index={index}
            isCurrentQuestion={isCurrentQuestion}
            isWebSocketActive={isWebSocketActive}
          />
        ))}

        {isCompleted && (
          <CompletionMessage isSaving={isSaving} saveStatus={saveStatus} />
        )}
      </div>

      {/* 입력 영역 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        {!isCompleted ? (
          <ChatInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleSend={handleSend}
            isWebSocketActive={isWebSocketActive}
          />
        ) : (
          <RestartButton handleRestart={handleRestart} isSaving={isSaving} />
        )}

        {!isCompleted && (
          <div className="mt-2 text-center text-gray-500 text-xs">
            진행률: {getProgress(currentQuestionIndex, questions.length)}
          </div>
        )}

        {webSocketResult && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
            {webSocketResult}
          </div>
        )}
      </div>
    </div>
  )
}
