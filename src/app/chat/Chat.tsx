"use client"
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'

// 타입 정의
type ChatMessage = {
  type: "question" | 'answer' | 'api_response',
  text: string,
  round?: number, // 차수 정보 추가
  timestamp?: number // 타임스탬프 추가
}



const getProgress = (currentIndex: number, total: number) => {
  return `${currentIndex + 1}/${total}`
}

// API 호출 함수들
const saveQuestionAnswer = async (conversations: { question: string; answer: string }[]) => {
  try {
    console.log('API 호출 시작:', { conversations })

    const response = await fetch('/api/questionAnswerSave', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversations })
    })

    console.log('API 응답 상태:', response.status, response.statusText)

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`)
    }

    const data = await response.json()
    console.log('API 응답 데이터:', data)
    return data
  } catch (error) {
    console.error('질문답변 저장 중 오류:', error)
    throw error
  }
}

const getQuestionAnswer = async () => {
  try {
    const response = await fetch('/api/questionAnswer', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('질문답변 가져오기 중 오류:', error)
    throw error
  }
}





// 채팅 메시지 컴포넌트
const ChatMessage = React.memo(({
  message,
  index,
  isCurrentQuestion
}: {
  message: ChatMessage
  index: number
  isCurrentQuestion: (index: number) => boolean
}) => {
  const isQuestion = message.type === 'question'
  const isCurrent = isCurrentQuestion(index)

  const messageClasses = useMemo(() => {
    if (isQuestion) {
      return isCurrent
        ? 'bg-blue-500 text-white rounded-br-lg rounded-tl-lg rounded-tr-lg'
        : 'bg-gray-100 text-gray-800 rounded-br-lg rounded-tl-lg rounded-tr-lg'
    } else if (message.type === 'api_response') {
      return isCurrent
        ? 'bg-blue-500 text-white rounded-br-lg rounded-tl-lg rounded-tr-lg'
        : 'bg-gray-100 text-gray-800 rounded-br-lg rounded-tl-lg rounded-tr-lg'
    } else {
      return 'bg-green-500 text-white rounded-bl-lg rounded-tl-lg rounded-tr-lg'
    }
  }, [isQuestion, isCurrent, message.type])

  return (
    <div className={`flex ${isQuestion || message.type === 'api_response' ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 ${messageClasses}`}>
        <p className="text-sm">{message.text}</p>

      </div>
    </div>
  )
})

ChatMessage.displayName = 'ChatMessage'



// 입력 폼 컴포넌트
const ChatInput = React.memo(({
  inputValue,
  setInputValue,
  handleSend,
  isInputDisabled,
  getInputPlaceholder,
  isSendButtonDisabled
}: {
  inputValue: string
  setInputValue: (value: string) => void
  handleSend: () => void
  isInputDisabled: () => boolean
  getInputPlaceholder: () => string
  isSendButtonDisabled: () => boolean
}) => {
  const [isComposing, setIsComposing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isInputDisabled() && !isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  // disabled 상태가 false로 변경될 때 포커스 주기
  useEffect(() => {
    if (!isInputDisabled() && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isInputDisabled])

  return (
    <div className="flex space-x-2">
      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
        rows={2}
        placeholder={getInputPlaceholder()}
        disabled={isInputDisabled()}
        onKeyDown={handleKeyDown}
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={isSendButtonDisabled()}
        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </div>
  )
})

ChatInput.displayName = 'ChatInput'

// 재시작 버튼 컴포넌트
const RestartButton = React.memo(({
  handleRestart
}: {
  handleRestart: () => void
}) => (
  <div className="flex flex-col space-y-2">
    <div className="text-center text-gray-600">
      <p className="text-sm">진행률: 5/5 완료</p>
    </div>
    <button
      onClick={handleRestart}
      className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
    >
      새로 시작하기
    </button>
  </div>
))

RestartButton.displayName = 'RestartButton'

// 메인 Chat 컴포넌트
export default function Chat({ questions }: { questions: string[] }) {
  // 상태 관리
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentQuestions, setCurrentQuestions] = useState<string[]>(questions)

  // 스크롤 관련 ref
  const chatListRef = useRef<HTMLDivElement>(null)

  // 스크롤을 하단으로 이동시키는 함수
  const scrollToBottom = useCallback(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight
    }
  }, [])

  // 대화 히스토리에서 question, answer만 추출하는 함수
  const extractConversations = useCallback((history: ChatMessage[]) => {
    const conversations: { question: string; answer: string }[] = []

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
  }, [])

  // 차수별 질문-답변 추출 함수 (round 필드 사용)
  const extractConversationsByRound = useCallback((history: ChatMessage[], round: number) => {
    const conversations: { question: string; answer: string }[] = []
    console.log(`🔍 ${round}차 추출 시작 - 전체 히스토리:`, history)

    for (let i = 0; i < history.length - 1; i += 2) {
      const question = history[i]
      const answer = history[i + 1]

      console.log(`🔍 ${round}차 추출 중 - 질문:`, question, `답변:`, answer)

      // round 필드가 일치하는 질문-답변 쌍만 추출
      if (question?.type === 'question' && answer?.type === 'answer' &&
        question.round === round && answer.round === round) {
        conversations.push({
          question: question.text,
          answer: answer.text
        })
        console.log(`✅ ${round}차 매칭됨 - 질문: ${question.text}, 답변: ${answer.text}`)
      } else {
        console.log(`❌ ${round}차 매칭 안됨 - 질문 round: ${question?.round}, 답변 round: ${answer?.round}`)
      }
    }

    console.log(`📊 ${round}차 최종 추출 결과:`, conversations)
    return conversations
  }, [])

  // timestamp 기반 차수별 질문-답변 추출 함수 (더 정확한 방법)
  const extractConversationsByRoundWithTimestamp = useCallback((history: ChatMessage[], round: number) => {
    const conversations: { question: string; answer: string }[] = []
    console.log(`🔍 ${round}차 timestamp 기반 추출 시작 - 전체 히스토리:`, history)

    // timestamp 순서로 정렬
    const sortedHistory = [...history].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    console.log(`📅 ${round}차 정렬된 히스토리:`, sortedHistory)

    // api_response를 제외하고 질문-답변 쌍만 필터링
    const questionAnswerPairs: { question: ChatMessage; answer: ChatMessage }[] = []

    // api_response를 제외한 메시지들만 필터링
    const filteredHistory = sortedHistory.filter(msg => msg.type !== 'api_response')
    console.log(`🔍 ${round}차 api_response 제외 후 필터링된 히스토리:`, filteredHistory)

    for (let i = 0; i < filteredHistory.length - 1; i++) {
      const current = filteredHistory[i]
      const next = filteredHistory[i + 1]

      // 현재가 질문이고 다음이 답변이면서 둘 다 같은 round인 경우만
      if (current?.type === 'question' && next?.type === 'answer' &&
        current.round === round && next.round === round) {
        questionAnswerPairs.push({ question: current, answer: next })
        console.log(`✅ ${round}차 질문-답변 쌍 발견:`, { question: current, answer: next })
      }
    }

    // 추출된 쌍들을 conversations로 변환
    questionAnswerPairs.forEach(pair => {
      conversations.push({
        question: pair.question.text,
        answer: pair.answer.text
      })
    })

    console.log(`📊 ${round}차 timestamp 최종 추출 결과:`, conversations)
    return conversations
  }, [])

  // 현재 차수 계산 함수
  const getCurrentRound = useCallback((history: ChatMessage[]) => {
    const apiResponseCount = history.filter(msg => msg.type === 'api_response').length
    return apiResponseCount + 1 // api_response 개수 + 1 = 현재 차수
  }, [])

  // 입력 필드 상태를 결정하는 함수들
  const isInputDisabled = useCallback(() => {
    return isCompleted || isProcessing
  }, [isCompleted, isProcessing])

  const getInputPlaceholder = useCallback(() => {
    if (isProcessing) return "처리 중..."
    if (isCompleted) return "대화가 완료되었습니다"
    return "메시지를 입력하세요..."
  }, [isProcessing, isCompleted])

  const isSendButtonDisabled = useCallback(() => {
    return !inputValue.trim() || isInputDisabled()
  }, [inputValue, isInputDisabled])

  // 현재 질문인지 확인하는 함수
  const isCurrentQuestion = useCallback((index: number) => {
    const questions = chatHistory.filter(chat => chat.type === 'question')
    const currentQuestionText = questions[currentQuestionIndex]?.text
    const currentItemText = chatHistory[index]?.text

    return chatHistory[index]?.type === 'question' && currentQuestionText === currentItemText
  }, [chatHistory, currentQuestionIndex])

  // 진행률 계산 메모이제이션
  const progressText = useMemo(() => {
    return getProgress(currentQuestionIndex, currentQuestions.length)
  }, [currentQuestionIndex, currentQuestions.length])



  // 상태 초기화 함수
  const resetState = useCallback(() => {
    if (currentQuestions.length > 0) {
      setChatHistory([{
        type: "question",
        text: currentQuestions[0],
        round: 1,
        timestamp: Date.now()
      }])
      setCurrentQuestionIndex(0)
      setIsCompleted(false)
      setInputValue("")
    }
  }, [currentQuestions])



  // question이 설정되면 첫 번째 질문 추가
  useEffect(() => {
    if (currentQuestions.length > 0 && chatHistory.length === 0) {
      setChatHistory([{
        type: "question",
        text: currentQuestions[0],
        round: 1,
        timestamp: Date.now()
      }])
      setCurrentQuestionIndex(0)
    }
  }, [currentQuestions, chatHistory.length])



  // 채팅 히스토리가 변경될 때마다 스크롤을 하단으로 이동
  useEffect(() => {
    scrollToBottom()
  }, [chatHistory, scrollToBottom])

  // 답변 전송 핸들러
  const handleSend = useCallback(async () => {
    if (inputValue.trim()) {
      const currentRound = getCurrentRound(chatHistory)
      const currentTime = Date.now()
      const newHistory: ChatMessage[] = [...chatHistory, {
        type: "answer",
        text: inputValue,
        round: currentRound,
        timestamp: currentTime
      }]
      console.log('답변 추가 후 chatHistory:', newHistory)

      if (currentQuestionIndex < currentQuestions.length - 1) {
        const nextQuestionIndex = currentQuestionIndex + 1
        newHistory.push({
          type: "question",
          text: currentQuestions[nextQuestionIndex],
          round: currentRound,
          timestamp: currentTime + 1 // 질문은 답변보다 1ms 늦게
        })
        console.log('다음 질문 추가 후 chatHistory:', newHistory)
        setCurrentQuestionIndex(nextQuestionIndex)
        setChatHistory(newHistory)
      } else {
        setChatHistory(newHistory)
        setIsCompleted(true)
        setIsProcessing(true)

        try {
          // 현재 차수 계산
          const currentRound = getCurrentRound(newHistory)
          console.log('=== API 호출 시작 ===')
          console.log(`📊 현재 차수: ${currentRound}차`)
          console.log('📝 전체 ChatHistory:', newHistory)

          // 현재 차수의 질문-답변 추출 (timestamp 기반)
          const conversations = extractConversationsByRoundWithTimestamp(newHistory, currentRound)
          console.log(`🔍 추출된 ${currentRound}차 질문-답변:`, conversations)
          console.log(`📊 ${currentRound}차 질문 개수:`, conversations.length)

          // questionAnswerSave API 호출
          console.log(`🚀 ${currentRound}차 API 호출 시작...`)
          console.log(`📤 ${currentRound}차 POST 파라미터:`, { conversations })
          const saveResponse = await saveQuestionAnswer(conversations)
          console.log(`✅ ${currentRound}차 API 응답:`, saveResponse)

          // 응답에서 question 배열과 reason 확인
          if (saveResponse.questions && saveResponse.questions.length >= 4) {
            console.log(`🎯 ${currentRound}차에서 4개 이상 질문 생성됨 (${saveResponse.questions.length}개)`)
            console.log(`📝 생성된 질문들:`, saveResponse.questions)
            console.log(`💡 생성 이유:`, saveResponse.reason)

            // 4개 이상이면 questionAnswer API 재호출
            const questionResponse = await getQuestionAnswer()
            console.log(`🔄 추가 질문 API 응답:`, questionResponse)

            // API 응답 메시지 추가
            const nextRound = currentRound + 1
            const currentTime = Date.now()
            const updatedHistory: ChatMessage[] = [...newHistory, {
              type: "api_response" as const,
              text: `추가 질문이 생성되었습니다: ${saveResponse.reason || '새로운 질문이 준비되었습니다.'}`,
              round: nextRound,
              timestamp: currentTime
            }]

            // API 응답 메시지만 추가하고, 첫 번째 추가 질문만 표시
            const finalHistory: ChatMessage[] = [...updatedHistory]
            if (questionResponse.questions && questionResponse.questions.length > 0) {
              // 첫 번째 질문만 추가
              finalHistory.push({
                type: "question" as const,
                text: questionResponse.questions[0],
                round: nextRound,
                timestamp: currentTime + 1
              })
            }

            console.log(`📝 ${nextRound}차 첫 번째 질문 추가 후 ChatHistory:`, finalHistory)
            setChatHistory(finalHistory)

            // 추가 질문들로 새로운 대화 시작
            if (questionResponse.questions && questionResponse.questions.length > 0) {
              console.log(`🔄 ${nextRound}차 질문들로 새로운 대화 시작`)
              console.log(`📝 새로운 질문 목록:`, questionResponse.questions)
              // 새로운 질문들로 상태 업데이트
              setCurrentQuestions(questionResponse.questions)
              setCurrentQuestionIndex(0)
              setIsCompleted(false)
            }
          } else {
            console.log(`✅ ${currentRound}차에서 3개 이하 질문 생성됨 (${saveResponse.questions?.length || 0}개)`)
            console.log(`🏁 ${currentRound}차 대화 완료`)
          }
        } catch (error) {
          console.error(`❌ ${currentRound}차 API 처리 중 오류:`, error)
          const nextRound = getCurrentRound(newHistory) + 1
          const currentTime = Date.now()
          const errorHistory: ChatMessage[] = [...newHistory, {
            type: "api_response" as const,
            text: '처리 중 오류가 발생했습니다.',
            round: nextRound,
            timestamp: currentTime
          }]
          console.log(`📝 ${currentRound}차 오류 메시지 추가 후 ChatHistory:`, errorHistory)
          setChatHistory(errorHistory)
        } finally {
          console.log(`🏁 ${currentRound}차 API 처리 완료`)
          setIsProcessing(false)
        }
      }
      setInputValue("")
    }
  }, [inputValue, chatHistory, currentQuestionIndex, currentQuestions, extractConversations, extractConversationsByRound, extractConversationsByRoundWithTimestamp, getCurrentRound])

  // 새로 시작하기
  const handleRestart = useCallback(() => {
    resetState()
  }, [resetState])

  return (
    <div className="flex flex-col bg-gray-50 p-4">
      {/* 채팅 메시지 영역 */}
      <div
        ref={chatListRef}
        className="chat-list h-[300px] overflow-auto p-4 space-y-4 bg-white border border-gray-200 rounded-lg mb-4"
      >
        {chatHistory.map((message, index) => (
          <ChatMessage
            key={index}
            message={message}
            index={index}
            isCurrentQuestion={isCurrentQuestion}
          />
        ))}


      </div>

      {/* 입력 영역 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        {!isCompleted ? (
          <ChatInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleSend={handleSend}
            isInputDisabled={isInputDisabled}
            getInputPlaceholder={getInputPlaceholder}
            isSendButtonDisabled={isSendButtonDisabled}
          />
        ) : (
          <RestartButton handleRestart={handleRestart} />
        )}

        {!isCompleted && (
          <div className="mt-2 text-center text-gray-500 text-xs">
            진행률: {progressText}
          </div>
        )}
      </div>
    </div>
  )
}
