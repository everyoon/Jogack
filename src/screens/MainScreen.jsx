import React, { useState, useRef } from 'react';
import { Camera, Image } from 'lucide-react';
import Logo from '../components/Logo';

const MainScreen = ({ setScreen, setSourceImage }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    if (showCamera && stream && videoRef.current && !capturedImage) {
      videoRef.current.srcObject = stream;
    }
  }, [showCamera, stream, capturedImage]);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('이 브라우저에서는 카메라 기능을 지원하지 않습니다. 앨범에서 불러오기를 이용해주세요.');
      fileInputRef.current.click();
      return;
    }

    const constraints = [
      {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 4096 },
          height: { ideal: 4096 },
        },
      },
      { video: { facingMode: 'user' } },
      { video: true },
    ];

    let mediaStream = null;
    for (const constraint of constraints) {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraint);
        if (mediaStream) break;
      } catch (err) {
        console.warn(`Camera constraint failed:`, err.name);
      }
    }

    if (mediaStream) {
      setStream(mediaStream);
      setShowCamera(true);
      setCapturedImage(null);
    } else {
      alert('카메라를 찾을 수 없거나 권한이 거부되었습니다. 앨범에서 불러오기를 이용해주세요.');
      fileInputRef.current.click();
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setShowCamera(false);
    setCapturedImage(null);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataURL = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(dataURL);
  };

  const confirmPhoto = () => {
    setSourceImage(capturedImage);
    stopCamera();
    setScreen('editor');
  };

  const retryPhoto = () => {
    setCapturedImage(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setSourceImage(event.target.result);
      setScreen('editor');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative w-full h-full flex" style={{ backgroundColor: 'var(--surface-primary)' }}>
      <div className="flex-1 flex flex-col items-center justify-center gap-10 z-10 px-5">
        <Logo className="h-auto" />

        <div className="flex flex-col items-center j gap-4 w-full max-w-xs">
          <button className="btn-base" onClick={startCamera}>
            <Camera size={24} />
            사진 촬영하기
          </button>

          <button className="btn-base" onClick={() => fileInputRef.current.click()}>
            <Image size={24} />
            앨범에서 선택
          </button>

          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: 'var(--surface-invert)' }}>
          <div className="flex-1 relative overflow-hidden">
            {capturedImage ? (
              <img src={capturedImage} alt="Captured" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>

          <div
            className="py-10 w-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--surface-invert)' }}
          >
            {capturedImage ? (
              <div className="flex w-full justify-between px-10 items-center">
                <button className="text-invert text-lg font-medium w-1/2" onClick={retryPhoto}>
                  다시시도
                </button>
                <button className="text-invert text-lg font-bold w-1/2" onClick={confirmPhoto}>
                  다음
                </button>
              </div>
            ) : (
              <div className="flex w-full items-center justify-between px-10">
                <button className="text-invert text-lg font-medium w-20" onClick={stopCamera}>
                  취소
                </button>
                <button
                  className="w-20 h-20 rounded-full border-[6px] border-white bg-transparent shadow-lg active:scale-90 transition-transform flex items-center justify-center group"
                  onClick={capturePhoto}
                  aria-label="촬영"
                >
                  <div className="w-[85%] h-[85%] rounded-full bg-white group-active:bg-white/80 transition-colors" />
                </button>
                <div className="w-20" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MainScreen;
