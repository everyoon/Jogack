import React from 'react';
import { ChevronLeft, Download } from 'lucide-react';

const EditorHeader = ({ onBack, onExport }) => {
  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-5 border-b border-black/5 z-10">
      <button onClick={onBack} className="icon-btn-base">
        <ChevronLeft size={24} />
      </button>
      <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
        조각하기
      </h1>
      <button onClick={onExport} className="icon-btn-base">
        <Download size={24} />
      </button>
    </header>
  );
};

export default EditorHeader;
