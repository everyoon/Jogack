import React from 'react';

const Toast = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="toast-container label-md">
      저장되었습니다.
      <style>{`
        .toast-container {
          position: fixed;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          background: #2E86DE;
          color: var( --text-invert);
          border-radius: var(--radius-2);
          padding: var(--spacing-3)  var(--spacing-5);
          white-space: nowrap;
          box-shadow: var(--elevation-3);
          pointer-events: none;
          z-index: 9999;
          animation: toast-in 200ms ease-out forwards, toast-out 200ms ease-in 2200ms forwards;
        }

        @keyframes toast-in {
          from { transform: translateX(-50%) translateY(20px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }

        @keyframes toast-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Toast;
