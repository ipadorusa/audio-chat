"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, AlertCircle } from 'lucide-react';

const MicComponent = () => {
  const [isMicOn, setIsMicOn] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [micStatus, setMicStatus] = useState('대기중');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const micStreamRef = useRef<MediaStream | null>(null);

  // 마이크 켜기
  const turnOnMic = async () => {
    console.log('=== 마이크 켜기 시작 ===');
    setIsLoading(true);
    setErrorMessage('');
    setMicStatus('권한 요청 중...');

    // 기본 환경 체크
    if (!window.isSecureContext) {
      const error = '보안 컨텍스트가 아닙니다. HTTPS 환경이 필요합니다.';
      setErrorMessage(error);
      setMicStatus('실패');
      setIsLoading(false);
      console.error(error);
      return;
    }

    if (!navigator.mediaDevices) {
      const error = 'MediaDevices API가 지원되지 않습니다.';
      setErrorMessage(error);
      setMicStatus('실패');
      setIsLoading(false);
      console.error(error);
      return;
    }

    if (!navigator.mediaDevices.getUserMedia) {
      const error = 'getUserMedia가 지원되지 않습니다.';
      setErrorMessage(error);
      setMicStatus('실패');
      setIsLoading(false);
      console.error(error);
      return;
    }

    try {
      console.log('마이크 권한 요청 중...');
      setMicStatus('마이크 접근 중...');

      // 먼저 장치 목록 확인
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      console.log('사용 가능한 마이크 장치:', audioInputs.length);

      if (audioInputs.length === 0) {
        throw new Error('마이크 장치가 없습니다.');
      }

      // 마이크 스트림 요청
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('마이크 스트림 획득 성공:', stream);
      console.log('오디오 트랙 수:', stream.getAudioTracks().length);

      // 스트림 저장
      micStreamRef.current = stream;
      setIsMicOn(true);
      setMicStatus('켜짐');
      setErrorMessage('');

      // 트랙 상태 확인
      const audioTrack = stream.getAudioTracks()[0];
      console.log('오디오 트랙 상태:', {
        enabled: audioTrack.enabled,
        muted: audioTrack.muted,
        readyState: audioTrack.readyState
      });

    } catch (error) {
      console.error('마이크 접근 실패:', error);

      let errorMsg = '마이크 접근 실패: ';

      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMsg += '권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.';
            break;
          case 'NotFoundError':
            errorMsg += '마이크 장치를 찾을 수 없습니다.';
            break;
          case 'NotSupportedError':
            errorMsg += '브라우저에서 지원하지 않는 기능입니다.';
            break;
          case 'NotReadableError':
            errorMsg += '마이크가 다른 앱에서 사용 중입니다.';
            break;
          case 'OverconstrainedError':
            errorMsg += '마이크 설정에 문제가 있습니다.';
            break;
          case 'SecurityError':
            errorMsg += '보안 오류가 발생했습니다.';
            break;
          default:
            errorMsg += error.message || '알 수 없는 오류';
        }
      } else {
        errorMsg += '알 수 없는 오류';
      }

      setErrorMessage(errorMsg);
      setMicStatus('실패');
      setIsMicOn(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 마이크 끄기
  const turnOffMic = () => {
    console.log('마이크 끄기 시작');

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => {
        console.log('트랙 정지:', track.kind);
        track.stop();
      });
      micStreamRef.current = null;
      setIsMicOn(false);
      setMicStatus('꺼짐');
      setErrorMessage('');
      console.log('마이크 꺼짐 완료');
    }
  };

  // 간단한 마이크 테스트
  const testMicSimple = async () => {
    console.log('=== 간단한 마이크 테스트 ===');
    setIsLoading(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });

      console.log('테스트 성공!', stream);

      // 즉시 정지
      stream.getTracks().forEach(track => track.stop());

      alert('마이크 테스트 성공! 마이크가 정상적으로 작동합니다.');

    } catch (error) {
      console.error('테스트 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`마이크 테스트 실패: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 마이크 토글
  const toggleMic = () => {
    if (isMicOn) {
      turnOffMic();
    } else {
      turnOnMic();
    }
  };

  // 스피커 켜기
  const turnOnSpeaker = () => {
    const audioElements = document.querySelectorAll('audio, video');
    audioElements.forEach(element => {
      if (element instanceof HTMLMediaElement) {
        element.muted = false;
      }
    });
    setIsSpeakerOn(true);
    console.log('스피커 켜짐');
  };

  // 스피커 끄기
  const turnOffSpeaker = () => {
    const audioElements = document.querySelectorAll('audio, video');
    audioElements.forEach(element => {
      if (element instanceof HTMLMediaElement) {
        element.muted = true;
      }
    });
    setIsSpeakerOn(false);
    console.log('스피커 꺼짐');
  };

  // 스피커 토글
  const toggleSpeaker = () => {
    if (isSpeakerOn) {
      turnOffSpeaker();
    } else {
      turnOnSpeaker();
    }
  };

  // 컴포넌트 언마운트 시 마이크 정리
  useEffect(() => {
    return () => {
      turnOffMic();
    };
  }, []);

  return (
    <div className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-center mb-6 text-gray-800">
        오디오 제어
      </h2>

      {/* 마이크 제어 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">마이크</h3>

        {/* 마이크 상태 표시 */}
        <div className="mb-3 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">상태:</span>
            <span className={`text-sm font-medium ${micStatus === '켜짐' ? 'text-green-600' :
              micStatus === '실패' ? 'text-red-600' :
                'text-yellow-600'
              }`}>
              {micStatus}
            </span>
          </div>
        </div>

        {/* 에러 메시지 */}
        {errorMessage && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="text-red-500 mt-0.5" size={16} />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={turnOnMic}
            disabled={isMicOn || isLoading}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${isMicOn || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>처리중...</span>
              </>
            ) : (
              <>
                <Mic size={20} />
                <span>켜기</span>
              </>
            )}
          </button>

          <button
            onClick={turnOffMic}
            disabled={!isMicOn || isLoading}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${!isMicOn || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
          >
            <MicOff size={20} />
            <span>끄기</span>
          </button>
        </div>

        {/* 마이크 테스트 버튼 */}
        <div className="mt-3">
          <button
            onClick={testMicSimple}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:bg-gray-300"
          >
            🎤 마이크 테스트
          </button>
        </div>
      </div>

      {/* 스피커 제어 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">스피커</h3>
        <div className="flex space-x-3">
          <button
            onClick={turnOnSpeaker}
            disabled={isSpeakerOn}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${isSpeakerOn
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
          >
            <Volume2 size={20} />
            <span>켜기</span>
          </button>

          <button
            onClick={turnOffSpeaker}
            disabled={!isSpeakerOn}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${!isSpeakerOn
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
          >
            <VolumeX size={20} />
            <span>끄기</span>
          </button>
        </div>

        {/* 스피커 상태 */}
        <div className="mt-2 text-center">
          <span className={`text-sm font-medium ${isSpeakerOn ? 'text-green-600' : 'text-red-600'}`}>
            스피커: {isSpeakerOn ? '켜짐' : '꺼짐'}
          </span>
        </div>
      </div>

      {/* 토글 버튼 (선택사항) */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">토글 버튼</h3>
        <div className="flex space-x-3">
          <button
            onClick={toggleMic}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${isMicOn
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
          >
            {isMicOn ? <MicOff size={20} /> : <Mic size={20} />}
            <span>마이크</span>
          </button>

          <button
            onClick={toggleSpeaker}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${isSpeakerOn
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
          >
            {isSpeakerOn ? <VolumeX size={20} /> : <Volume2 size={20} />}
            <span>스피커</span>
          </button>
        </div>
      </div>

      {/* 현재 상태 요약 */}
      <div className="mt-6 p-3 bg-gray-100 rounded-lg">
        <div className="text-sm text-gray-600 text-center">
          <p><strong>마이크:</strong> {isMicOn ? '🟢 켜짐' : '🔴 꺼짐'}</p>
          <p><strong>스피커:</strong> {isSpeakerOn ? '🟢 켜짐' : '🔴 꺼짐'}</p>
        </div>
      </div>

      {/* 실시간 환경 체크 */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">실시간 환경 체크</h4>
        <div className="text-xs text-blue-700 space-y-1">
          <p>• 보안 컨텍스트: {window.isSecureContext ? '✅ 안전' : '❌ 불안전 (HTTPS 필요)'}</p>
          <p>• 프로토콜: {window.location.protocol}</p>
          <p>• MediaDevices: {navigator.mediaDevices ? '✅ 지원' : '❌ 미지원'}</p>
          <p>• getUserMedia: {typeof navigator.mediaDevices?.getUserMedia === 'function' ? '✅ 지원' : '❌ 미지원'}</p>
          <p>• 권한 API: {navigator.permissions ? '✅ 지원' : '❌ 미지원'}</p>
        </div>
      </div>

      {/* 문제 해결 단계 */}
      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <h4 className="text-sm font-semibold text-yellow-800 mb-2">문제 해결 단계</h4>
        <ol className="text-xs text-yellow-700 space-y-1 list-decimal list-inside">
          <li>먼저 &ldquo;마이크 테스트&rdquo; 버튼을 클릭해보세요</li>
          <li>브라우저 주소창에서 마이크 권한을 확인하세요</li>
          <li>개발자 도구(F12) → 콘솔에서 오류 메시지 확인</li>
          <li>다른 앱에서 마이크 사용 중인지 확인</li>
          <li>마이크가 물리적으로 연결되어 있는지 확인</li>
        </ol>
      </div>
    </div>
  );
};

export default MicComponent;