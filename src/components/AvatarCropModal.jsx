import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ZoomIn, ZoomOut, RotateCw, Check, X, Move } from 'lucide-react';

export default function AvatarCropModal({ imageSrc, onCropComplete, onCancel }) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgElement, setImgElement] = useState(null);

  const CANVAS_SIZE = 300;
  const CROP_RADIUS = 115; // 230px diameter circle

  // Load image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImgElement(img);
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Calculate base scale to fill the crop circle
  const getBaseScale = useCallback((img, rot) => {
    if (!img) return 1;
    const isRotated = rot % 180 !== 0;
    const w = isRotated ? img.naturalHeight : img.naturalWidth;
    const h = isRotated ? img.naturalWidth : img.naturalHeight;
    const diameter = CROP_RADIUS * 2;
    return Math.max(diameter / w, diameter / h);
  }, []);

  // Redraw preview canvas
  useEffect(() => {
    if (!canvasRef.current || !imgElement) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseScale = getBaseScale(imgElement, rotation);
    const scale = baseScale * zoom;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 1. Draw Image with transforms
    ctx.save();
    ctx.translate(CANVAS_SIZE / 2 + pan.x, CANVAS_SIZE / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(imgElement, -imgElement.naturalWidth / 2, -imgElement.naturalHeight / 2);
    ctx.restore();

    // 2. Draw Dark Overlay outside circle mask (Discord style)
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CROP_RADIUS, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();

    // 3. Draw Circular Crop Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CROP_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = '#00FFF5';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0, 255, 245, 0.4)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();
  }, [imgElement, zoom, rotation, pan, getBaseScale]);

  // Mouse / Touch Drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(Math.max(prev + delta, 1), 3));
  };

  // Rotate 90 deg clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Generate cropped output
  const handleApplyCrop = () => {
    if (!imgElement) return;

    const outputSize = 240; // 240x240 clean avatar
    const outCanvas = document.createElement('canvas');
    outCanvas.width = outputSize;
    outCanvas.height = outputSize;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) return;

    const baseScale = getBaseScale(imgElement, rotation);
    const scale = (baseScale * zoom * outputSize) / (CROP_RADIUS * 2);

    outCtx.save();
    outCtx.translate(
      outputSize / 2 + (pan.x * outputSize) / (CROP_RADIUS * 2),
      outputSize / 2 + (pan.y * outputSize) / (CROP_RADIUS * 2)
    );
    outCtx.rotate((rotation * Math.PI) / 180);
    outCtx.scale(scale, scale);
    outCtx.drawImage(imgElement, -imgElement.naturalWidth / 2, -imgElement.naturalHeight / 2);
    outCtx.restore();

    const croppedDataUrl = outCanvas.toDataURL('image/jpeg', 0.85);
    onCropComplete(croppedDataUrl);
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onCancel}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '380px',
          background: 'linear-gradient(145deg, rgba(34, 40, 49, 0.98), rgba(20, 24, 30, 0.98))',
          border: '1px solid rgba(0, 173, 181, 0.35)',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 173, 181, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Edit Foto Profil</span>
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
              Geser dan sesuaikan zoom seperti di Discord
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Canvas Area */}
        <div
          style={{
            position: 'relative',
            width: `${CANVAS_SIZE}px`,
            height: `${CANVAS_SIZE}px`,
            margin: '0 auto',
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#0f172a',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            touchAction: 'none'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={{ display: 'block' }}
          />

          {/* Hint Overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0, 0, 0, 0.65)',
              padding: '2px 8px',
              borderRadius: '20px',
              fontSize: '10px',
              color: '#94a3b8',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Move size={10} />
            <span>Tarik untuk menggeser</span>
          </div>
        </div>

        {/* Zoom & Rotate Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(prev - 0.15, 1))}
              style={{ background: 'transparent', border: 'none', color: '#00ADB5', cursor: 'pointer', display: 'flex', padding: '2px' }}
              title="Perkecil"
            >
              <ZoomOut size={16} />
            </button>

            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{
                flex: 1,
                accentColor: '#00FFF5',
                cursor: 'pointer',
                height: '4px'
              }}
            />

            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(prev + 0.15, 3))}
              style={{ background: 'transparent', border: 'none', color: '#00ADB5', cursor: 'pointer', display: 'flex', padding: '2px' }}
              title="Perbesar"
            >
              <ZoomIn size={16} />
            </button>

            <button
              type="button"
              onClick={handleRotate}
              className="glass-button"
              style={{
                fontSize: '11px',
                padding: '5px 8px',
                borderRadius: '6px',
                gap: '4px',
                marginLeft: '4px'
              }}
              title="Putar 90°"
            >
              <RotateCw size={13} />
              <span>Putar</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={onCancel}
            className="glass-button"
            style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px' }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            className="glass-button glass-button-primary"
            style={{ fontSize: '12px', padding: '8px 18px', borderRadius: '8px', gap: '6px', fontWeight: 700 }}
          >
            <Check size={14} />
            <span>Terapkan</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
