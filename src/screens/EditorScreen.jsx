import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, Download, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { applyClipPath, getShapeRect } from '../utils/shapes';
import Toast from '../components/Toast';

const categories = [
  { id: 'square', label: 'SQUARE' },
  { id: 'circle', label: 'CIRCLE' },
  { id: 'triangle', label: 'TRIANGLE' },
  { id: 'stamp', label: 'STAMP' },
  { id: 'heart', label: 'HEART' },
];

const shapesByCategory = {
  square: [
    { id: 'sq-basic', label: '기본', svg: <rect x="2" y="2" width="36" height="36" rx="0" fill="currentColor"/> },
    { id: 'sq-rounded', label: '둥근', svg: <rect x="2" y="2" width="36" height="36" rx="8" fill="currentColor"/> },
  ],
  circle: [
    { id: 'ci-circle', label: '원', svg: <circle cx="20" cy="20" r="18" fill="currentColor"/> },
    { id: 'ci-oval', label: '타원', svg: <ellipse cx="20" cy="20" rx="18" ry="13" fill="currentColor"/> },
  ],
  triangle: [
    { id: 'tr-basic', label: '삼각형', svg: <polygon points="20,2 38,38 2,38" fill="currentColor"/> },
  ],
  stamp: [
    { id: 'st-square', label: '정사각', svg: (
      <g fill="currentColor">
        <rect x="4" y="4" width="32" height="32" rx="2"/>
        <circle cx="4" cy="10" r="2" fill="white"/>
        <circle cx="4" cy="20" r="2" fill="white"/>
        <circle cx="4" cy="30" r="2" fill="white"/>
        <circle cx="36" cy="10" r="2" fill="white"/>
        <circle cx="36" cy="20" r="2" fill="white"/>
        <circle cx="36" cy="30" r="2" fill="white"/>
        <circle cx="10" cy="4" r="2" fill="white"/>
        <circle cx="20" cy="4" r="2" fill="white"/>
        <circle cx="30" cy="4" r="2" fill="white"/>
        <circle cx="10" cy="36" r="2" fill="white"/>
        <circle cx="20" cy="36" r="2" fill="white"/>
        <circle cx="30" cy="36" r="2" fill="white"/>
      </g>
    )},
    { id: 'st-land', label: '가로', svg: (
      <g fill="currentColor">
        <rect x="4" y="8" width="32" height="24" rx="2"/>
        <circle cx="4" cy="14" r="2" fill="white"/>
        <circle cx="4" cy="20" r="2" fill="white"/>
        <circle cx="4" cy="26" r="2" fill="white"/>
        <circle cx="36" cy="14" r="2" fill="white"/>
        <circle cx="36" cy="20" r="2" fill="white"/>
        <circle cx="36" cy="26" r="2" fill="white"/>
        <circle cx="10" cy="8" r="2" fill="white"/>
        <circle cx="20" cy="8" r="2" fill="white"/>
        <circle cx="30" cy="8" r="2" fill="white"/>
        <circle cx="10" cy="32" r="2" fill="white"/>
        <circle cx="20" cy="32" r="2" fill="white"/>
        <circle cx="30" cy="32" r="2" fill="white"/>
      </g>
    )},
    { id: 'st-port', label: '세로', svg: (
      <g fill="currentColor">
        <rect x="8" y="4" width="24" height="32" rx="2"/>
        <circle cx="8" cy="10" r="2" fill="white"/>
        <circle cx="8" cy="20" r="2" fill="white"/>
        <circle cx="8" cy="30" r="2" fill="white"/>
        <circle cx="32" cy="10" r="2" fill="white"/>
        <circle cx="32" cy="20" r="2" fill="white"/>
        <circle cx="32" cy="30" r="2" fill="white"/>
        <circle cx="14" cy="4" r="2" fill="white"/>
        <circle cx="20" cy="4" r="2" fill="white"/>
        <circle cx="26" cy="4" r="2" fill="white"/>
        <circle cx="14" cy="36" r="2" fill="white"/>
        <circle cx="20" cy="36" r="2" fill="white"/>
        <circle cx="26" cy="36" r="2" fill="white"/>
      </g>
    )},
  ],
  heart: [
    { id: 'ht-basic', label: '하트', svg: <path d="M 20 38 C 20 38 2 26 2 14 C 2 6 10 2 20 10 C 30 2 38 6 38 14 C 38 26 20 38 20 38 Z" fill="currentColor"/> },
  ],
};

const EditorScreen = ({ sourceImage, setScreen }) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState('square');
  const [selectedShape, setSelectedShape] = useState('sq-basic');
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const minScaleRef = useRef(1);

  function showToast() {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2400);
  }

  // Gesture tracking
  const lastTouch = useRef(null);
  const lastDist = useRef(0);

  useEffect(() => {
    const img = new Image();
    img.src = sourceImage;
    img.onload = () => {
      imageRef.current = img;
      setIsImageLoaded(true);
      
      // Initial scale calculation (object-fit: cover)
      const canvas = canvasRef.current;
      if (canvas) {
        const cw = canvas.width;
        const ch = canvas.height;
        const iw = img.width;
        const ih = img.height;
        
        const scaleX = cw / iw;
        const scaleY = ch / ih;
        const initialScale = Math.max(scaleX, scaleY);
        minScaleRef.current = initialScale;
        
        setTransform({
          x: (cw - iw * initialScale) / 2,
          y: (ch - ih * initialScale) / 2,
          scale: initialScale
        });
      }
    };
  }, [sourceImage]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current || !isImageLoaded) return;
    
    const ctx = canvas.getContext('2d');
    const { width: cw, height: ch } = canvas;
    const img = imageRef.current;

    ctx.clearRect(0, 0, cw, ch);

    // 1. Draw Image with transform
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);
    ctx.drawImage(img, 0, 0);
    ctx.restore();

    // 2. Apply dimming overlay with clip
    ctx.save();
    // Create a path for the dimming overlay
    ctx.beginPath();
    ctx.rect(0, 0, cw, ch);
    
    // Create the shape path to "cut out"
    // We use even-odd rule to punch a hole
    applyClipPath(ctx, selectedShape, cw, ch);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // var(--surface-modal-bg)
    ctx.fill('evenodd');
    ctx.restore();

    // 3. Optional: Draw a subtle border for the shape
    ctx.save();
    ctx.beginPath();
    applyClipPath(ctx, selectedShape, cw, ch);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

  }, [selectedShape, transform, isImageLoaded]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      render();
    }
  }, [render]);

  // Gesture Handlers
  const handlePointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId);
    lastTouch.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e) => {
    if (!lastTouch.current || !imageRef.current) return;
    
    const dx = e.clientX - lastTouch.current.x;
    const dy = e.clientY - lastTouch.current.y;
    
    const canvas = canvasRef.current;
    const img = imageRef.current;
    
    setTransform(prev => {
      let newX = prev.x + dx;
      let newY = prev.y + dy;
      
      // Clamp X
      const minX = canvas.width - img.width * prev.scale;
      const maxX = 0;
      newX = Math.min(Math.max(newX, minX), maxX);
      
      // Clamp Y
      const minY = canvas.height - img.height * prev.scale;
      const maxY = 0;
      newY = Math.min(Math.max(newY, minY), maxY);
      
      return {
        ...prev,
        x: newX,
        y: newY
      };
    });
    
    lastTouch.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e) => {
    lastTouch.current = null;
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      
      if (lastDist.current > 0) {
        const delta = dist / lastDist.current;
        setTransform(prev => {
          const newScale = Math.min(Math.max(prev.scale * delta, minScaleRef.current), 5);
          
          // Clamp position after scale change
          const canvas = canvasRef.current;
          const img = imageRef.current;
          
          let newX = prev.x;
          let newY = prev.y;
          
          const minX = canvas.width - img.width * newScale;
          const maxX = 0;
          newX = Math.min(Math.max(newX, minX), maxX);
          
          const minY = canvas.height - img.height * newScale;
          const maxY = 0;
          newY = Math.min(Math.max(newY, minY), maxY);
          
          return { ...prev, scale: newScale, x: newX, y: newY };
        });
      }
      lastDist.current = dist;
    }
  };

  const handleTouchEnd = () => {
    lastDist.current = 0;
  };

  const handleWheel = (e) => {
    if (!imageRef.current) return;
    
    // Determine zoom direction
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    
    setTransform(prev => {
      const newScale = Math.min(Math.max(prev.scale * delta, minScaleRef.current), 5);
      
      // Clamp position after scale change
      const canvas = canvasRef.current;
      const img = imageRef.current;
      
      let newX = prev.x;
      let newY = prev.y;
      
      const minX = canvas.width - img.width * newScale;
      const maxX = 0;
      newX = Math.min(Math.max(newX, minX), maxX);
      
      const minY = canvas.height - img.height * newScale;
      const maxY = 0;
      newY = Math.min(Math.max(newY, minY), maxY);
      
      return { ...prev, scale: newScale, x: newX, y: newY };
    });
  };

  const exportPNG = async () => {
    const outputSize = 1000;
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');

    // 1. 클립 적용
    applyClipPath(ctx, selectedShape, outputSize, outputSize);
    ctx.clip();

    // 2. 디스플레이 캔버스 대비 스케일 비율 계산
    const displayCanvas = canvasRef.current;
    const ratio = outputSize / displayCanvas.width;

    // 3. 이미지 드로잉 (현재 transform 반영)
    const img = new Image();
    img.src = sourceImage;
    await new Promise(res => { img.onload = res; });
    ctx.drawImage(
      img,
      transform.x * ratio,
      transform.y * ratio,
      img.naturalWidth * transform.scale * ratio,
      img.naturalHeight * transform.scale * ratio
    );

    // 4. PNG blob → 다운로드
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jogack.png';
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');

    // 5. Toast 표시
    showToast();
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--surface-primary)' }}>
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-black/5 z-10">
        <button 
          onClick={() => setScreen('main')} 
          className="p-2 -ml-2 text-black/60 hover:text-black transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">스티커 만들기</h1>
        <button 
          onClick={exportPNG} 
          className="bg-black text-white px-5 py-2 rounded-full text-sm font-bold active:scale-95 transition-all shadow-md"
        >
          저장하기
        </button>
      </header>

      {/* Image Section (58%) */}
      <section className="h-[58%] bg-[#1a1a1a] relative flex items-center justify-center overflow-hidden">
        <div className="h-full aspect-square relative shadow-2xl">
          <canvas 
            ref={canvasRef}
            className="w-full h-full touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          />
          
          {/* Zoom Controls Overlay - Hidden on mobile/tablet, shown on desktop */}
          <div className="absolute bottom-6 right-6 hidden lg:flex flex-col gap-2">
            <button 
              className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              onClick={() => handleWheel({ deltaY: -100, preventDefault: () => {} })}
            >
              <ZoomIn size={20} />
            </button>
            <button 
              className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              onClick={() => handleWheel({ deltaY: 100, preventDefault: () => {} })}
            >
              <ZoomOut size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Object Section (42%) */}
      <section className="flex-1 bg-white px-6 py-4 flex flex-col overflow-visible">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-black/40 tracking-widest uppercase">Select Shape</h2>
          <button 
            className="text-black/40 hover:text-black transition-colors"
            onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
            title="초기화"
          >
            <RotateCcw size={16} />
          </button>
        </div>
        
        {/* Filter Row */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 -mx-2 px-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedShape(shapesByCategory[cat.id][0].id);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat.id 
                ? 'bg-black text-white shadow-lg' 
                : 'bg-black/5 text-black/40 hover:bg-black/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Shape Grid */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar mt-4 py-4 -mx-2 px-2">
          {shapesByCategory[selectedCategory].map(shape => (
            <button
              key={shape.id}
              onClick={() => setSelectedShape(shape.id)}
              className={`w-20 h-20 flex-shrink-0 rounded-2xl flex items-center justify-center transition-all ${
                selectedShape === shape.id 
                ? 'bg-black text-white shadow-xl scale-110 z-10' 
                : 'bg-black/5 text-black/20 hover:bg-black/10'
              }`}
            >
              <div className="w-12 h-12 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 40 40" className="fill-current">
                  {shape.svg}
                </svg>
              </div>
            </button>
          ))}
        </div>
      </section>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <Toast visible={toastVisible} />
    </div>
  );
};

export default EditorScreen;
