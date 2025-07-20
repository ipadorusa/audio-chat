import React, { useEffect, useState } from 'react'

// 상수 정의
const AUDIO_CONSTRAINTS = { audio: true } as const;
const ERROR_MESSAGES = {
  MIC_PERMISSION_FAILED: '마이크 권한 요청 실패',
  UNKNOWN_ERROR: '알 수 없는 오류'
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

  const turnOff = () => {
    if (micState.stream) {
      micState.stream.getTracks().forEach((track: MediaStreamTrack) => {
        console.log('트랙 정지:', track.kind);
        track.stop();
      });
      setMicState({
        stream: null,
        isOn: false,
        error: null
      });
      console.log('마이크 꺼짐 완료');
    }
  };

  const cleanup = () => {
    if (micState.stream) {
      micState.stream.getTracks().forEach(track => track.stop());
      setMicState({
        stream: null,
        isOn: false,
        error: null
      });
    }
  };

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

const Mic2 = () => {
  const { micState, requestPermission, turnOff, cleanup } = useMicrophone();
  const { speakerState, turnOn, turnOff: turnOffSpeaker } = useSpeaker();

  useEffect(() => {
    return () => {
      cleanup();
      console.log('모든 오디오 리소스 정리 완료');
    };
  }, [cleanup]);

  return (
    <div>
      {micState.error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {micState.error}
        </div>
      )}

      <button
        onClick={requestPermission}
        disabled={micState.isOn}
        style={{ marginRight: '10px' }}
      >
        {micState.isOn ? '마이크 켜짐' : '마이크 권한 요청'}
      </button>

      <button
        onClick={turnOff}
        disabled={!micState.isOn}
        style={{ marginRight: '10px' }}
      >
        마이크 끄기
      </button>

      <button
        onClick={turnOn}
        disabled={speakerState.isOn}
        style={{ marginRight: '10px' }}
      >
        {speakerState.isOn ? '스피커 켜짐' : '스피커 켜기'}
      </button>

      <button
        onClick={turnOffSpeaker}
        disabled={!speakerState.isOn}
      >
        스피커 끄기
      </button>

      <audio />
    </div>
  )
}

export default Mic2