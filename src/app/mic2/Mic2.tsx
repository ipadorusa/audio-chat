import React, { useEffect, useState, useRef, useCallback } from 'react'

// 상수 정의
const AUDIO_CONSTRAINTS = { audio: true } as const;
const ERROR_MESSAGES = {
  MIC_PERMISSION_FAILED: '마이크 권한 요청 실패',
  UNKNOWN_ERROR: '알 수 없는 오류',
  RECORDING_FAILED: '녹음 시작 실패'
} as const;

// 타입 정의
interface MicrophoneState {
  stream: MediaStream | null;
  isOn: boolean;
  error: string | null;
}

interface SpeakerState {
  isOn: boolean;
}

interface RecordingState {
  isRecording: boolean;
  mediaRecorder: MediaRecorder | null;
  audioBlob: Blob | null;
  error: string | null;
}

// 마이크 관련 커스텀 훅
const useMicrophone = () => {
  const [micState, setMicState] = useState<MicrophoneState>({
    stream: null,
    isOn: false,
    error: null
  });

  const requestPermission = async () => {
    try {
      setMicState(prev => ({ ...prev, error: null }));
      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
      setMicState({
        stream,
        isOn: true,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      setMicState(prev => ({
        ...prev,
        error: `${ERROR_MESSAGES.MIC_PERMISSION_FAILED}: ${errorMessage}`
      }));
    }
  };

  const turnOff = useCallback(() => {
    setMicState(prev => {
      if (prev.stream) {
        prev.stream.getTracks().forEach((track: MediaStreamTrack) => {
          console.log('트랙 정지:', track.kind);
          track.stop();
        });
      }
      console.log('마이크 꺼짐 완료');
      return {
        stream: null,
        isOn: false,
        error: null
      };
    });
  }, []);

  const cleanup = useCallback(() => {
    setMicState(prev => {
      if (prev.stream) {
        prev.stream.getTracks().forEach(track => track.stop());
      }
      return {
        stream: null,
        isOn: false,
        error: null
      };
    });
  }, []);

  return {
    micState,
    requestPermission,
    turnOff,
    cleanup
  };
};

// 스피커 관련 커스텀 훅
const useSpeaker = () => {
  const [speakerState, setSpeakerState] = useState<SpeakerState>({
    isOn: true
  });

  const toggleMediaMute = (muted: boolean) => {
    const mediaElements = document.querySelectorAll('audio, video');
    mediaElements.forEach(element => {
      if (element instanceof HTMLMediaElement) {
        element.muted = muted;
        console.log(`${muted ? '스피커 꺼짐' : '스피커 켜짐'}:`, element.tagName);
      }
    });
    setSpeakerState({ isOn: !muted });
  };

  const turnOn = () => toggleMediaMute(false);
  const turnOff = () => toggleMediaMute(true);

  return {
    speakerState,
    turnOn,
    turnOff
  };
};

// 녹음 관련 커스텀 훅
const useRecording = (micState: MicrophoneState) => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    mediaRecorder: null,
    audioBlob: null,
    error: null
  });

  // ref로 MediaRecorder 상태 관리
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    if (!micState.stream || !micState.isOn) {
      setRecordingState(prev => ({
        ...prev,
        error: '마이크가 켜져있지 않습니다. 먼저 마이크를 켜주세요.'
      }));
      return;
    }

    // 이미 녹음 중이면 리턴
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('이미 녹음 중입니다.');
      return;
    }

    try {
      setRecordingState(prev => ({ ...prev, error: null }));

      // 새로운 스트림 생성
      const recordingStream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
      recordingStreamRef.current = recordingStream;

      // chunks 초기화
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(recordingStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        console.log('데이터 수신:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        console.log('MediaRecorder 시작됨');
        setRecordingState(prev => ({
          ...prev,
          isRecording: true,
          mediaRecorder: mediaRecorder
        }));
      };

      mediaRecorder.onstop = () => {
        console.log('MediaRecorder 중지됨');

        // 스트림 정리
        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach(track => {
            console.log('녹음용 트랙 정지:', track.kind);
            track.stop();
          });
          recordingStreamRef.current = null;
        }

        // 녹음 데이터 처리
        if (chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          console.log('녹음 완료:', audioBlob.size, 'bytes');

          setRecordingState(prev => ({
            ...prev,
            audioBlob,
            isRecording: false,
            mediaRecorder: null
          }));
        } else {
          console.log('녹음 데이터가 없음');
          setRecordingState(prev => ({
            ...prev,
            isRecording: false,
            mediaRecorder: null
          }));
        }

        // ref 정리
        mediaRecorderRef.current = null;
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder 에러:', event.error);

        // 에러 시 정리
        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach(track => track.stop());
          recordingStreamRef.current = null;
        }
        mediaRecorderRef.current = null;

        setRecordingState(prev => ({
          ...prev,
          error: `${ERROR_MESSAGES.RECORDING_FAILED}: ${event.error?.message || '알 수 없는 오류'}`,
          isRecording: false,
          mediaRecorder: null
        }));
      };

      // 녹음 시작
      mediaRecorder.start(1000);
      console.log('녹음 시작 요청됨');

    } catch (error) {
      console.error('녹음 시작 에러:', error);
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach(track => track.stop());
        recordingStreamRef.current = null;
      }
      mediaRecorderRef.current = null;

      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      setRecordingState(prev => ({
        ...prev,
        error: `${ERROR_MESSAGES.RECORDING_FAILED}: ${errorMessage}`
      }));
    }
  }, [micState.stream, micState.isOn]);

  const stopRecording = useCallback(() => {
    console.log('🛑 stopRecording 호출됨');

    if (mediaRecorderRef.current) {
      try {
        console.log('🎥 현재 MediaRecorder 상태:', mediaRecorderRef.current.state);

        if (mediaRecorderRef.current.state === 'recording') {
          console.log('📣 MediaRecorder stop() 호출');
          mediaRecorderRef.current.stop();
        } else {
          console.warn('⚠️ MediaRecorder가 recording 상태가 아님:', mediaRecorderRef.current.state);
        }
      } catch (err) {
        console.error('❌ mediaRecorder.stop() 중 에러 발생:', err);
      }
    } else {
      console.warn('⚠️ mediaRecorderRef.current가 null임');
    }
  }, []);

  const toggleRecording = useCallback(() => {
    console.log('🎛 toggleRecording 호출됨, 현재 상태:', recordingState.isRecording);

    if (recordingState.isRecording) {
      console.log('🛑 녹음 중지 시도');
      stopRecording();
    } else {
      console.log('▶️ 녹음 시작 시도');
      startRecording();
    }
  }, [recordingState.isRecording, stopRecording, startRecording]);

  const clearRecording = useCallback(() => {
    // 모든 리소스 정리
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      } catch (error) {
        console.error('MediaRecorder 정리 에러:', error);
      }
    }

    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach(track => track.stop());
      recordingStreamRef.current = null;
    }

    mediaRecorderRef.current = null;
    chunksRef.current = [];

    setRecordingState({
      isRecording: false,
      mediaRecorder: null,
      audioBlob: null,
      error: null
    });
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    recordingState,
    toggleRecording,
    clearRecording
  };
};

const Mic2 = () => {
  const { micState, requestPermission, turnOff, cleanup } = useMicrophone();
  const { speakerState, turnOn, turnOff: turnOffSpeaker } = useSpeaker();
  const { recordingState, toggleRecording, clearRecording } = useRecording(micState);

  useEffect(() => {
    return () => {
      cleanup();
      console.log('컴포넌트 언마운트: 모든 오디오 리소스 정리 완료');
    };
  }, [cleanup]);

  const handleApiSubmit = async () => {
    if (!recordingState.audioBlob) return;

    try {
      const formData = new FormData();
      formData.append('audio', recordingState.audioBlob, 'recording.webm');

      console.log('API 전송 시작...');

      // 실제 API 엔드포인트로 교체하세요
      const response = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('API 전송 성공:', result);
        alert('녹음 파일이 성공적으로 전송되었습니다!');
      } else {
        throw new Error(`HTTP Error: ${response.status}`);
      }
    } catch (error) {
      console.error('API 전송 실패:', error);
      alert('API 전송에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>마이크 녹음 시스템</h2>

      {micState.error && (
        <div style={{
          color: 'red',
          marginBottom: '10px',
          padding: '10px',
          backgroundColor: '#ffe6e6',
          borderRadius: '5px'
        }}>
          {micState.error}
        </div>
      )}

      {recordingState.error && (
        <div style={{
          color: 'red',
          marginBottom: '10px',
          padding: '10px',
          backgroundColor: '#ffe6e6',
          borderRadius: '5px'
        }}>
          {recordingState.error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={requestPermission}
          disabled={micState.isOn}
          style={{
            marginRight: '10px',
            padding: '10px 15px',
            backgroundColor: micState.isOn ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: micState.isOn ? 'not-allowed' : 'pointer'
          }}
        >
          {micState.isOn ? '✅ 마이크 활성화됨' : '🎤 마이크 권한 요청'}
        </button>

        <button
          onClick={turnOff}
          disabled={!micState.isOn}
          style={{
            marginRight: '10px',
            padding: '10px 15px',
            backgroundColor: !micState.isOn ? '#ccc' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: !micState.isOn ? 'not-allowed' : 'pointer'
          }}
        >
          🎤❌ 마이크 끄기
        </button>

        <button
          onClick={toggleRecording}
          disabled={!micState.isOn}
          style={{
            marginRight: '10px',
            padding: '10px 20px',
            backgroundColor: recordingState.isRecording ? '#ff4444' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: !micState.isOn ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {recordingState.isRecording ? '🔴 녹음 중지' : '🟢 녹음 시작'}
        </button>
      </div>

      {/* 상태 표시 */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>📊 현재 상태:</div>
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
          <div>🎤 마이크: <strong>{micState.isOn ? '활성화' : '비활성화'}</strong></div>
          <div>🔴 녹음: <strong>{recordingState.isRecording ? '녹음 중...' : '대기 중'}</strong></div>
          {recordingState.audioBlob && (
            <div>📁 파일: <strong>{Math.round(recordingState.audioBlob.size / 1024)}KB</strong></div>
          )}
        </div>
      </div>

      {recordingState.audioBlob && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#e8f5e8',
          borderRadius: '8px',
          border: '1px solid #4CAF50'
        }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>
            ✅ 녹음 완료! ({Math.round(recordingState.audioBlob.size / 1024)}KB)
          </p>

          <div>
            <button
              onClick={clearRecording}
              style={{
                marginRight: '10px',
                padding: '10px 15px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              🗑️ 녹음 삭제
            </button>

            <button
              onClick={handleApiSubmit}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📤 API 전송
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={turnOn}
          disabled={speakerState.isOn}
          style={{
            marginRight: '10px',
            padding: '10px 15px',
            backgroundColor: speakerState.isOn ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: speakerState.isOn ? 'not-allowed' : 'pointer'
          }}
        >
          {speakerState.isOn ? '🔊 스피커 켜짐' : '🔊 스피커 켜기'}
        </button>

        <button
          onClick={turnOffSpeaker}
          disabled={!speakerState.isOn}
          style={{
            padding: '10px 15px',
            backgroundColor: !speakerState.isOn ? '#ccc' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: !speakerState.isOn ? 'not-allowed' : 'pointer'
          }}
        >
          🔇 스피커 끄기
        </button>
      </div>
    </div>
  )
}

export default Mic2