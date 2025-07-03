'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [error, setError] = useState('');
  const [useWebSpeechAPI, setUseWebSpeechAPI] = useState(true);
  const [micStatus, setMicStatus] = useState<'unknown' | 'granted' | 'denied' | 'checking'>('unknown');
  const [audioLevel, setAudioLevel] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 마이크 권한 확인
  const checkMicrophonePermission = async () => {
    try {
      setMicStatus('checking');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStatus('granted');
      stream.getTracks().forEach(track => track.stop()); // 권한 확인 후 스트림 해제
    } catch (err) {
      console.error('마이크 권한 오류:', err);
      setMicStatus('denied');
    }
  };

  // 오디오 레벨 모니터링 시작
  const startAudioLevelMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average);
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      updateAudioLevel();
    } catch (err) {
      console.error('오디오 레벨 모니터링 오류:', err);
      setError('마이크에 접근할 수 없습니다.');
    }
  };

  // 오디오 레벨 모니터링 중지
  const stopAudioLevelMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setAudioLevel(0);
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopAudioLevelMonitoring();
    };
  }, []);

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
        // 음성 인식 시작 시 오디오 레벨 모니터링도 시작
        startAudioLevelMonitoring();
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
        stopAudioLevelMonitoring();
      };

      recognition.onend = () => {
        setIsRecording(false);
        stopAudioLevelMonitoring();
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
    stopAudioLevelMonitoring();
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

  // 마이크 상태에 따른 아이콘과 텍스트
  const getMicStatusDisplay = () => {
    switch (micStatus) {
      case 'granted':
        return { icon: '🎤', text: '마이크 권한 허용됨', color: '#4CAF50' };
      case 'denied':
        return { icon: '🚫', text: '마이크 권한 거부됨', color: '#F44336' };
      case 'checking':
        return { icon: '⏳', text: '마이크 권한 확인 중...', color: '#FF9800' };
      default:
        return { icon: '❓', text: '마이크 권한 확인 필요', color: '#9E9E9E' };
    }
  };

  const micStatusDisplay = getMicStatusDisplay();

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>음성 텍스트 변환기</h1>

        {/* 마이크 상태 확인 섹션 */}
        <div className={styles.micStatus}>
          <div className={styles.micStatusInfo}>
            <span style={{ fontSize: '24px', marginRight: '8px' }}>{micStatusDisplay.icon}</span>
            <span style={{ color: micStatusDisplay.color, fontWeight: 'bold' }}>
              {micStatusDisplay.text}
            </span>
          </div>

          <button
            onClick={checkMicrophonePermission}
            className={styles.micCheckButton}
            disabled={micStatus === 'checking'}
          >
            {micStatus === 'checking' ? '확인 중...' : '마이크 권한 확인'}
          </button>
        </div>

        {/* 오디오 레벨 표시 */}
        {isRecording && (
          <div className={styles.audioLevel}>
            <div className={styles.audioLevelBar}>
              <div
                className={styles.audioLevelFill}
                style={{ width: `${(audioLevel / 255) * 100}%` }}
              />
            </div>
            <span className={styles.audioLevelText}>
              오디오 레벨: {Math.round((audioLevel / 255) * 100)}%
            </span>
          </div>
        )}

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
            <li><strong>마이크 권한 확인</strong>: 먼저 마이크 권한을 확인하고 허용해주세요</li>
            <li><strong>Web Speech API</strong>: 브라우저에서 직접 음성 인식 (인터넷 불필요)</li>
            <li><strong>서버 API</strong>: OpenAI Whisper API 사용 (더 정확한 인식)</li>
            <li>음성 인식 중에는 말을 계속하면 실시간으로 텍스트가 변환됩니다</li>
            <li>한국어로 말하면 자동으로 인식됩니다</li>
            <li>오디오 레벨을 통해 마이크가 제대로 작동하는지 확인할 수 있습니다</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
