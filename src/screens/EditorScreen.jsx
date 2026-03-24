import React, { useState, useRef, useEffect, useCallback } from 'react';
import { categories, shapesByCategory } from '../data/index.js';
import { ChevronLeft, Download } from 'lucide-react';
import Toast from '../components/Toast';

// 컴포넌트 밖으로 분리 - 재렌더 때마다 재생성 방지
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
  const lastDist = useRef(0);
  const [resultImage, setResultImage] = useState(null);

  const showToast = useCallback(() => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2400);
  }, []);

  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  const clampPosition = useCallback((x, y, scale, cw, ch, img) => {
    const scaledW = img.width * scale;
    const scaledH = img.height * scale;
    return {
      x: clamp(x, cw - scaledW, 0),
      y: clamp(y, ch - scaledH, 0),
    };
  }, []);

  const initTransform = useCallback((img, cw, ch) => {
    const scale = Math.max(cw / img.width, ch / img.height);
    minScaleRef.current = scale;
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

  // 캔버스 크기 감지 + transform 초기화
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;

      // 기기의 픽셀 비율 (일반 모니터는 1, 고해상도 모니터/모바일은 2~3)
      const dpr = window.devicePixelRatio || 1;

      // 실제 도화지 해상도를 dpr만큼 크게 설정
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      // 화면에 보이는 CSS 크기는 기존과 동일하게 유지
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // transform을 계산할 때는 CSS 논리적 픽셀(width, height) 기준이어야
      // 마우스/터치 드래그 좌표계와 맞아떨어집니다.
      if (imageRef.current) initTransform(imageRef.current, width, height);
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, [initTransform]);

  // 이미지 로드 후 transform 초기화
  useEffect(() => {
    if (!isImageLoaded) return;
    const canvas = canvasRef.current;
    if (canvas?.width > 0 && canvas?.height > 0) {
      initTransform(imageRef.current, canvas.width, canvas.height);
    }
  }, [isImageLoaded, initTransform]);

  // 렌더
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !isImageLoaded) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // 클리핑 경로 등은 '화면에 보이는 크기(논리적 픽셀)' 기준으로 계산해야 합니다.
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;
    const clipPath = getClipPath2D(selectedShape, cw, ch);

    // 전체 지우기 (실제 픽셀 기준)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 🔥 추가: 이미지 고화질 스무딩 옵션
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.save();
    // 🔥 핵심: 도화지 해상도를 키운 만큼, 붓의 크기(좌표계)도 같이 키워줍니다.
    // 이렇게 하면 아래의 기존 그리기 로직(transform)을 전혀 수정할 필요가 없습니다.
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

    ctx.restore(); // dpr 스케일링 롤백
  }, [selectedShape, transform, isImageLoaded]);

  useEffect(() => {
    render();
  }, [render]);

  // 포인터 이벤트
  const handlePointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId);

    // 현재 터치된 포인터(손가락/마우스) 등록
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.current.size === 1) {
      // 손가락이 1개일 때는 드래그 시작점 저장
      lastTouch.current = { x: e.clientX, y: e.clientY };
    } else if (activePointers.current.size === 2) {
      // 손가락이 2개일 때는 핀치 줌 시작 거리와 현재 스케일 저장
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchDist.current = dist;
      initialScale.current = transform.scale;
    }
  };

  const handlePointerMove = (e) => {
    // 캔버스에 등록된 포인터가 아니면 무시
    if (!activePointers.current.has(e.pointerId) || !imageRef.current) return;

    // 현재 포인터 위치 최신화
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const canvas = canvasRef.current;
    const img = imageRef.current;

    if (activePointers.current.size === 1 && lastTouch.current) {
      // --- 1점 터치: 드래그 ---
      const dx = e.clientX - lastTouch.current.x;
      const dy = e.clientY - lastTouch.current.y;

      setTransform((prev) => ({
        ...prev,
        ...clampPosition(prev.x + dx, prev.y + dy, prev.scale, canvas.width, canvas.height, img),
      }));
      lastTouch.current = { x: e.clientX, y: e.clientY };
    } else if (activePointers.current.size === 2) {
      // --- 2점 터치: 핀치 줌 ---
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);

      if (initialPinchDist.current > 0) {
        // 처음 2개가 닿았을 때의 거리 대비 현재 거리의 비율 계산
        const scaleFactor = dist / initialPinchDist.current;

        setTransform((prev) => {
          // 누적된 이전 스케일에 곱하는 것이 아니라, "터치 시작 시점의 스케일"에 곱해야 널뛰기하지 않습니다.
          const scale = clamp(initialScale.current * scaleFactor, minScaleRef.current, 5);
          return { scale, ...clampPosition(prev.x, prev.y, scale, canvas.width, canvas.height, img) };
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

  const handleTouchMove = (e) => {
    if (e.touches.length !== 2) return;
    const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    if (lastDist.current > 0) {
      const canvas = canvasRef.current;
      const img = imageRef.current;
      setTransform((prev) => {
        const scale = clamp(prev.scale * (dist / lastDist.current), minScaleRef.current, 5);
        return { scale, ...clampPosition(prev.x, prev.y, scale, canvas.width, canvas.height, img) };
      });
    }
    lastDist.current = dist;
  };

  const handleTouchEnd = () => {
    lastDist.current = 0;
  };

  const handleWheel = (e) => {
    if (!imageRef.current) return;
    const canvas = canvasRef.current;
    const img = imageRef.current;
    setTransform((prev) => {
      const scale = clamp(prev.scale * (e.deltaY > 0 ? 0.9 : 1.1), minScaleRef.current, 5);
      return { scale, ...clampPosition(prev.x, prev.y, scale, canvas.width, canvas.height, img) };
    });
  };

  const isInAppBrowser = () => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent.toLowerCase();
    // 카카오톡, 인스타그램, 라인 등을 감지
    return ua.indexOf('kakaotalk') > -1 || ua.indexOf('instagram') > -1 || ua.indexOf('line') > -1;
  };

  const exportPNG = async () => {
    // --- 캔버스에 그리는 공통 로직 (기존과 동일) ---
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
      // 2. 일반 브라우저(크롬, 사파리 등)일 때 -> 즉시 고화질 파일 다운로드
      // (Blob 방식으로 다운로드해야 파일명이 정확하게 지정됩니다)
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), {
          href: url,
          download: 'jogack.png', // 다운로드될 파일명
        });
        a.click();
        URL.revokeObjectURL(url); // 메모리 해제
      }, 'image/png');

      showToast(); // 즉시 다운로드일 때는 토스트 메시지를 보여줍니다.
    }
  };

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--surface-primary)' }}
    >
      {/* Header */}
      <header className="h-16 flex-shrink-0 flex items-center justify-between px-5 border-b border-black/5 z-10">
        <button onClick={() => setScreen('main')} className="icon-btn-base">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          조각하기
        </h1>
        <button onClick={exportPNG} className="icon-btn-base">
          <Download size={24} />
        </button>
      </header>

      {/* Image Section */}
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

      {/* Category */}
      <section
        className="flex-1 py-2 flex flex-col overflow-auto min-h-0"
        style={{ backgroundColor: 'var(--surface-primary)' }}
      >
        <div className="flex px-5 items-center justify-between mb-1">
          <h2 className="body-md tracking-widest" style={{ color: 'var(--text-brand)' }}>
            조각들
          </h2>
        </div>

        <div className="w-full flex items-center gap-2 overflow-x-auto no-scrollbar pl-5 py-4 mb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedShape(shapesByCategory[cat.id][0].id);
              }}
              className={`filter-btn ${selectedCategory === cat.id ? 'bg-brand' : 'bg-secondary hover:bg-brand/10'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-8 px-5 place-items-center overflow-y-auto no-scrollbar">
          {shapesByCategory[selectedCategory].map((shape) => (
            <button
              key={shape.id}
              onClick={() => setSelectedShape(shape.id)}
              className={`w-20 h-20 flex items-center justify-center transition-all ${
                selectedShape === shape.id ? 'bg-brand text-invert' : 'text-primary hover:bg-black/10'
              }`}
              style={{ borderRadius: 'var(--radius-1)' }}
            >
              <svg width="80" height="80" viewBox={shape.viewBox || '0 0 80 80'} className="fill-current">
                {shape.svg}
              </svg>
            </button>
          ))}
        </div>
      </section>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <Toast visible={toastVisible} />
      {resultImage && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 px-5 touch-none">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 flex flex-col items-center shadow-2xl">
            <h3 className="text-xl font-bold mb-2 text-gray-900">조각 완성!</h3>
            <p className="text-sm text-center mb-5 text-gray-600">
              아래 이미지를 <strong>길게 눌러서</strong>
              <br />
              사진 앱에 저장해 주세요.
            </p>

            {/* 완성된 이미지 영역 (길게 누르기 가능) */}
            <div className="w-full aspect-square bg-gray-50 rounded-xl overflow-hidden mb-6 border border-gray-200">
              <img
                src={resultImage}
                alt="완성된 조각"
                className="w-full h-full object-contain select-none pointer-events-auto"
                style={{ WebkitTouchCallout: 'default' }} // 아이폰 꾹 누르기 강제 활성화
              />
            </div>

            <button
              onClick={() => setResultImage(null)}
              className="w-full py-3.5 bg-gray-100 text-gray-800 rounded-xl font-bold text-base hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorScreen;
