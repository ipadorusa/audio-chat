'use client';

import { useState, useRef } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [error, setError] = useState('');
  const [useWebSpeechAPI, setUseWebSpeechAPI] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Web Speech API 지원 확인
  const isWebSpeechSupported = () => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  };

  // Web Speech API로 음성 인식 시작
  const startWebSpeechRecognition = () => {
    if (!isWebSpeechSupported()) {
      setError('이 브라우저는 음성 인식을 지원하지 않습니다.');
      return;
    }

    try {
      // 브라우저 호환성을 위한 SpeechRecognition 객체 생성
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true; // 연속 인식
      recognition.interimResults = true; // 중간 결과 표시
      recognition.lang = 'ko-KR'; // 한국어 설정

      recognition.onstart = () => {
        setIsRecording(true);
        setError('');
        setTranscribedText('');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscribedText(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('음성 인식 오류:', event.error);
        setError(`음성 인식 오류: ${event.error}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError('음성 인식을 시작할 수 없습니다.');
      console.error('음성 인식 시작 오류:', err);
    }
  };

  // Web Speech API 음성 인식 중지
  const stopWebSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  // 녹음 시작/중지 통합 함수
  const toggleRecording = () => {
    if (isRecording) {
      if (useWebSpeechAPI) {
        stopWebSpeechRecognition();
      }
    } else {
      if (useWebSpeechAPI) {
        startWebSpeechRecognition();
      }
    }
  };

  // 텍스트 복사
  const copyText = () => {
    if (transcribedText) {
      navigator.clipboard.writeText(transcribedText);
      alert('텍스트가 클립보드에 복사되었습니다.');
    }
  };

  // 텍스트 지우기
  const clearText = () => {
    setTranscribedText('');
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>음성 텍스트 변환기</h1>

        <div className={styles.options}>
          <label className={styles.option}>
            <input
              type="radio"
              checked={useWebSpeechAPI}
              onChange={() => setUseWebSpeechAPI(true)}
            />
            <span>Web Speech API (클라이언트)</span>
          </label>
          <label className={styles.option}>
            <input
              type="radio"
              checked={!useWebSpeechAPI}
              onChange={() => setUseWebSpeechAPI(false)}
            />
            <span>서버 API (OpenAI Whisper)</span>
          </label>
        </div>

        {!isWebSpeechSupported() && useWebSpeechAPI && (
          <div className={styles.warning}>
            ⚠️ 이 브라우저는 Web Speech API를 지원하지 않습니다. Chrome, Edge, Safari를 사용해주세요.
          </div>
        )}

        <div className={styles.recorder}>
          <button
            onClick={toggleRecording}
            className={`${styles.recordButton} ${isRecording ? styles.recording : ''}`}
            disabled={useWebSpeechAPI && !isWebSpeechSupported()}
          >
            {isRecording ? '음성 인식 중지' : '음성 인식 시작'}
          </button>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
        </div>

        {transcribedText && (
          <div className={styles.result}>
            <div className={styles.resultHeader}>
              <h3>변환된 텍스트:</h3>
              <div className={styles.resultActions}>
                <button onClick={copyText} className={styles.copyButton}>
                  복사
                </button>
                <button onClick={clearText} className={styles.clearButton}>
                  지우기
                </button>
              </div>
            </div>
            <div className={styles.textBox}>
              {transcribedText}
            </div>
          </div>
        )}

        <div className={styles.info}>
          <h4>사용법:</h4>
          <ul>
            <li><strong>Web Speech API</strong>: 브라우저에서 직접 음성 인식 (인터넷 불필요)</li>
            <li><strong>서버 API</strong>: OpenAI Whisper API 사용 (더 정확한 인식)</li>
            <li>음성 인식 중에는 말을 계속하면 실시간으로 텍스트가 변환됩니다</li>
            <li>한국어로 말하면 자동으로 인식됩니다</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
