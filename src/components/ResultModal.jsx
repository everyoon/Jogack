import React from 'react';

const ResultModal = ({ resultImage, onClose }) => {
  if (!resultImage) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 px-5 touch-none">
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 flex flex-col items-center shadow-2xl">
        <h3 className="text-xl font-bold mb-2 text-gray-900">조각 완성!</h3>
        <p className="text-sm text-center mb-5 text-gray-600">
          아래 이미지를 <strong>길게 눌러서</strong>
          <br />
          사진 앱에 저장해 주세요.
        </p>

        <div className="w-full aspect-square bg-gray-50 rounded-xl overflow-hidden mb-6 border border-gray-200">
          <img
            src={resultImage}
            alt="완성된 조각"
            className="w-full h-full object-contain select-none pointer-events-auto"
            style={{ WebkitTouchCallout: 'default' }}
          />
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-gray-100 text-gray-800 rounded-xl font-bold text-base hover:bg-gray-200 active:bg-gray-300 transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default ResultModal;
