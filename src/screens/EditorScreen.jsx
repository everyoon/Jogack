import React, { useState, useRef, useEffect, useCallback } from 'react';
import { categories, shapesByCategory } from '../data/index.js';
import Toast from '../components/Toast';
import EditorHeader from '../components/EditorHeader';
import ShapeSelector from '../components/ShapeSelector';
import ResultModal from '../components/ResultModal';

const CLIP_SIZE_RATIO = 1;

function getClipPath2D(shapeId, cw, ch) {
  const shape = Object.values(shapesByCategory)
    .flat()
    .find((s) => s.id === shapeId);
  if (!shape) return null;

  const [, , vw, vh] = (shape.viewBox || '0 0 95 95').split(' ').map(Number);
  const size = Math.min(cw, ch) * CLIP_SIZE_RATIO;
  const sx = size / vw;
  const sy = size / vh;
  const ox = (cw - size) / 2;
  const oy = (ch - size) / 2;

  const { svg } = shape;
  const { type, props } = svg;

  if (type === 'path') {
    const scaled = new Path2D();
    scaled.addPath(new Path2D(props.d), new DOMMatrix([sx, 0, 0, sy, ox, oy]));
    return scaled;
  }

  const p = new Path2D();

  if (type === 'rect') {
    const x = (Number(props.x) || 0) * sx + ox;
    const y = (Number(props.y) || 0) * sy + oy;
    const w = Number(props.width) * sx;
    const h = Number(props.height) * sy;
    const rx = Number(props.rx || 0) * sx;
    rx > 0 ? p.roundRect(x, y, w, h, rx) : p.rect(x, y, w, h);
  } else if (type === 'circle') {
    p.arc(Number(props.cx) * sx + ox, Number(props.cy) * sy + oy, Number(props.r) * sx, 0, Math.PI * 2);
  } else if (type === 'ellipse') {
    p.ellipse(
      Number(props.cx) * sx + ox,
      Number(props.cy) * sy + oy,
      Number(props.rx) * sx,
      Number(props.ry) * sy,
      0,
      0,
      Math.PI * 2,
    );
  } else if (type === 'polygon') {
    const pts = props.points
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    p.moveTo(pts[0] * sx + ox, pts[1] * sy + oy);
    for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i] * sx + ox, pts[i + 1] * sy + oy);
    p.closePath();
  } else if (type === 'g') {
    const children = Array.isArray(props.children) ? props.children : [props.children];
    const rect = children.find((c) => c?.type === 'rect');
    if (rect) {
      const { x, y, width, height, rx } = rect.props;
      const rx_ = Number(rx || 0) * sx;
      const px = (Number(x) || 0) * sx + ox;
      const py = (Number(y) || 0) * sy + oy;
      const pw = Number(width) * sx;
      const ph = Number(height) * sy;
      rx_ > 0 ? p.roundRect(px, py, pw, ph, rx_) : p.rect(px, py, pw, ph);
    }
  }

  return p;
}

const EditorScreen = ({ sourceImage, setScreen }) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState(() => categories[0].id);
  const [selectedShape, setSelectedShape] = useState(() => shapesByCategory[categories[0].id][0].id);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const minScaleRef = useRef(1);
  const activePointers = useRef(new Map());
  const initialPinchDist = useRef(0);
  const initialScale = useRef(1);
  const lastTouch = useRef(null);
  const [resultImage, setResultImage] = useState(null);

  useEffect(() => {
    window.history.pushState({ page: 'editor' }, '');

    const handlePopState = () => {
      setScreen('main');
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [setScreen]);

  const showToast = useCallback(() => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2400);
  }, []);

  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  const clampPosition = useCallback((x, y, scale, cw, ch, img) => {
    const scaledW = img.width * scale;
    const scaledH = img.height * scale;

    // 이미지가 도화지 밖으로 완전히 사라지지 않도록 최소 100px 여유만 남깁니다.
    const padding = 100;
    const minX = -scaledW + padding;
    const maxX = cw - padding;

    const minY = -scaledH + padding;
    const maxY = ch - padding;

    return {
      x: clamp(x, minX, maxX),
      y: clamp(y, minY, maxY),
    };
  }, []);

  const initTransform = useCallback((img, cw, ch) => {
    // Math.max(꽉 차게) 대신 Math.min(다 보이게)로 변경

    const scale = Math.min(cw / img.width, ch / img.height);

    // 최소 축소 한계치를 현재 스케일의 절반 수준으로 낮춰서 더 작게 축소 가능하도록 허용

    minScaleRef.current = scale * 0.8;

    setTransform({
      x: (cw - img.width * scale) / 2,

      y: (ch - img.height * scale) / 2,

      scale,
    });
  }, []);

  // 이미지 로드
  useEffect(() => {
    const img = new Image();
    img.src = sourceImage;
    img.onload = () => {
      imageRef.current = img;
      setIsImageLoaded(true);
    };
  }, [sourceImage]);

  // 렌더
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !isImageLoaded) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;
    const clipPath = getClipPath2D(selectedShape, cw, ch);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.save();
    ctx.scale(dpr, dpr);

    // 배경 이미지
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);
    ctx.drawImage(img, 0, 0);
    ctx.restore();

    if (!clipPath) {
      ctx.restore(); // 첫 번째 ctx.save()에 대한 짝 맞추기
      return;
    }

    // 딤 오버레이 (클리핑 밖)
    ctx.save();
    const overlay = new Path2D();
    overlay.rect(0, 0, cw, ch);
    overlay.addPath(clipPath);
    ctx.fillStyle = 'rgba(39, 38, 34, 0.7)';
    ctx.fill(overlay, 'evenodd');
    ctx.restore();

    // 클리핑 영역 이미지
    ctx.save();
    ctx.clip(clipPath);
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);
    ctx.drawImage(img, 0, 0);
    ctx.restore();

    // 테두리
    ctx.save();
    ctx.strokeStyle = 'rgba(239, 233, 220, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke(clipPath);
    ctx.restore();

    ctx.restore();
  }, [selectedShape, transform, isImageLoaded]);

  // 캔버스 크기 감지
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // 크기가 변하면 위치는 냅두고 다시 그리기만 합니다.
      render();
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, [render]); // initTransform 의존성 제거

  // 이미지 로드 후 transform 초기화
  useEffect(() => {
    if (!isImageLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 캔버스의 실제 물리적 크기 말고, 화면에 보이는 CSS 크기를 가져옵니다.
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      initTransform(imageRef.current, rect.width, rect.height);
    }
  }, [isImageLoaded, initTransform]);

  useEffect(() => {
    render();
  }, [render]);

  // 포인터 이벤트
  const handlePointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId);

    // 현재 터치된 포인터(손가락/마우스) 등록
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.current.size === 1) {
      lastTouch.current = { x: e.clientX, y: e.clientY };
    } else if (activePointers.current.size === 2) {
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchDist.current = dist;
      initialScale.current = transform.scale;
    }
  };

  const handlePointerMove = (e) => {
    if (!activePointers.current.has(e.pointerId) || !imageRef.current) return;

    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const canvas = canvasRef.current;
    const img = imageRef.current;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;

    if (activePointers.current.size === 1 && lastTouch.current) {
      const dx = e.clientX - lastTouch.current.x;
      const dy = e.clientY - lastTouch.current.y;

      setTransform((prev) => ({
        ...prev,
        ...clampPosition(prev.x + dx, prev.y + dy, prev.scale, cssWidth, cssHeight, img),
      }));
      lastTouch.current = { x: e.clientX, y: e.clientY };
    } else if (activePointers.current.size === 2) {
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);

      if (initialPinchDist.current > 0) {
        const scaleFactor = dist / initialPinchDist.current;

        setTransform((prev) => {
          const scale = clamp(initialScale.current * scaleFactor, minScaleRef.current, 5);
          return { scale, ...clampPosition(prev.x, prev.y, scale, cssWidth, cssHeight, img) };
        });
      }
    }
  };

  const handlePointerUp = (e) => {
    // 화면에서 떨어진 손가락(포인터) 제거
    activePointers.current.delete(e.pointerId);

    if (activePointers.current.size === 1) {
      // 두 손가락 중 하나만 뗐다면, 남은 손가락을 기준으로 드래그 좌표 재설정
      const remainingPointer = Array.from(activePointers.current.values())[0];
      lastTouch.current = { x: remainingPointer.x, y: remainingPointer.y };
    } else {
      lastTouch.current = null;
    }

    // 손가락이 2개 미만이 되면 핀치 거리 초기화
    if (activePointers.current.size < 2) {
      initialPinchDist.current = 0;
    }
  };

  const handleWheel = (e) => {
    if (!imageRef.current) return;
    const canvas = canvasRef.current;
    const img = imageRef.current;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;

    setTransform((prev) => {
      const scale = clamp(prev.scale * (e.deltaY > 0 ? 0.9 : 1.1), minScaleRef.current, 5);
      return { scale, ...clampPosition(prev.x, prev.y, scale, cssWidth, cssHeight, img) };
    });
  };

  const isInAppBrowser = () => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent.toLowerCase();
    // 카카오톡, 인스타그램, 라인 등을 감지
    return ua.indexOf('kakaotalk') > -1 || ua.indexOf('instagram') > -1 || ua.indexOf('line') > -1;
  };

  const exportPNG = async () => {
    const SIZE = 1000;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const clipPath = getClipPath2D(selectedShape, SIZE, SIZE);
    if (clipPath) ctx.clip(clipPath);
    const cssWidth = canvasRef.current.getBoundingClientRect().width;
    const ratio = SIZE / cssWidth;
    const img = imageRef.current;
    ctx.save();
    ctx.scale(ratio, ratio);
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
    // ------------------------------------------

    // 🔥 핵심: 환경에 따른 저장 방식 분기 🔥
    if (isInAppBrowser()) {
      // 1. 카카오톡 등 인앱 브라우저일 때 -> '길게 눌러 저장' 모달창
      const dataUrl = canvas.toDataURL('image/png');
      setResultImage(dataUrl);
    } else {
      // 2. 일반 브라우저(크롬, 사파리 등)일 때
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), {
          href: url,
          download: 'jogack.png',
        });
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');

      showToast();
    }
  };

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--surface-primary)' }}
    >
      {/* header */}
      <EditorHeader onBack={() => setScreen('main')} onExport={exportPNG} />

      {/* img section */}
      <section
        className="flex-shrink-0 relative w-full flex items-center justify-center"
        style={{ height: '50vh', backgroundColor: 'var(--surface-primary)' }}
      >
        <div className="relative h-full" style={{ aspectRatio: '1 / 1' }}>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerOut={handlePointerUp}
            onWheel={handleWheel}
          />
        </div>
      </section>

      {/* category section */}
      <ShapeSelector
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedShape={selectedShape}
        setSelectedShape={setSelectedShape}
      />

      {/* toast & modal */}
      <Toast visible={toastVisible} />
      <ResultModal resultImage={resultImage} onClose={() => setResultImage(null)} />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default EditorScreen;
