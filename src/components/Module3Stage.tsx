import React, { useEffect, useRef } from 'react';
import { Language, LiveTelemetry, Module3State } from '../types/simulation';
import { MEDIUM_PRESETS, TRANSLATIONS } from '../i18n/translations';

interface Module3StageProps {
  lang: Language;
  state: Module3State;
  isPlaying: boolean;
  playbackSpeed: number;
  simTimeRef: React.MutableRefObject<number>;
  stepSignal: number;
  onTelemetry: (patch: Partial<LiveTelemetry>) => void;
}

export const Module3Stage: React.FC<Module3StageProps> = ({
  lang,
  state,
  isPlaying,
  playbackSpeed,
  simTimeRef,
  stepSignal,
  onTelemetry,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stateRef = useRef(state);
  stateRef.current = state;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const speedRef = useRef(playbackSpeed);
  speedRef.current = playbackSpeed;

  const langRef = useRef(lang);
  langRef.current = lang;

  const lastStepSignalRef = useRef(stepSignal);
  const lastCrestCountRef = useRef(0);
  const pulseFlashRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animId = 0;
    let lastTimestamp = performance.now();
    let lastTelemetryPush = 0;
    let cssW = Math.max(300, container.clientWidth);
    let cssH = Math.max(360, container.clientHeight);

    const updateSize = () => {
      cssW = Math.max(300, container.clientWidth);
      cssH = Math.max(360, container.clientHeight);
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);

    const drawChip = (
      ctx: CanvasRenderingContext2D,
      text: string,
      x: number,
      y: number,
      bg: string,
      border: string,
      color: string
    ) => {
      ctx.save();
      ctx.font = '700 11px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
      const w = ctx.measureText(text).width + 16;
      const h = 22;
      ctx.fillStyle = bg;
      ctx.strokeStyle = border;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - h / 2, w, h, 7);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y + 0.5);
      ctx.restore();
    };

    const render = (now: number) => {
      const dtSec = Math.min(0.05, (now - lastTimestamp) / 1000);
      lastTimestamp = now;

      const st = stateRef.current;
      const tr = TRANSLATIONS[langRef.current];

      if (stepSignal !== lastStepSignalRef.current) {
        lastStepSignalRef.current = stepSignal;
        simTimeRef.current += 1 / 60;
      } else if (isPlayingRef.current) {
        simTimeRef.current += dtSec * speedRef.current;
      }

      const simT = simTimeRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.max(300, Math.floor(cssW * dpr));
      const targetH = Math.max(360, Math.floor(cssH * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      const W = cssW;
      const H = cssH;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      const xB = W * 0.5;
      const centerY = H * 0.53;

      // Zone backgrounds: Medium 1 (Left) vs Medium 2 (Right)
      const tint1 =
        st.medium1Preset !== 'custom' ? MEDIUM_PRESETS[st.medium1Preset].tint : '#e0f2fe';
      const tint2 =
        st.medium2Preset !== 'custom' ? MEDIUM_PRESETS[st.medium2Preset].tint : '#d1fae5';

      ctx.fillStyle = tint1;
      ctx.globalAlpha = 0.42;
      ctx.fillRect(0, 0, xB, H);

      ctx.fillStyle = tint2;
      ctx.globalAlpha = 0.48;
      ctx.fillRect(xB, 0, W - xB, H);
      ctx.globalAlpha = 1;

      // Subtle vertical density stipple/grid to convey medium density difference
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.045)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 28) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, H);
        ctx.stroke();
      }
      for (let gy = 0; gy < H; gy += 28) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(W, gy);
        ctx.stroke();
      }

      // Equilibrium line
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(16, centerY);
      ctx.lineTo(W - 16, centerY);
      ctx.stroke();
      ctx.restore();

      // Exact proportional wavelength scaling using geometric mean
      const v1 = Math.max(10, st.v1);
      const v2 = Math.max(10, st.v2);
      const ratioV = Math.sqrt(v2 / v1);
      const lambdaMidPx = 220 / (1 + 0.28 * (st.frequency - 1));
      let lambda1Px = lambdaMidPx / ratioV;
      let lambda2Px = lambdaMidPx * ratioV;

      // Guard minimum readable pixel wavelength while keeping exact ratio when possible
      if (lambda1Px < 28) {
        const scaleUp = 28 / lambda1Px;
        lambda1Px *= scaleUp;
        lambda2Px *= scaleUp;
      } else if (lambda2Px < 28) {
        const scaleUp = 28 / lambda2Px;
        lambda1Px *= scaleUp;
        lambda2Px *= scaleUp;
      }

      const k1 = (2 * Math.PI) / lambda1Px;
      const k2 = (2 * Math.PI) / lambda2Px;

      // Visual angular frequency proportional to source f (smoothly scaled to avoid 60Hz aliasing)
      const omegaVis = 2 * Math.PI * (st.frequency * 0.42);
      const phaseB = omegaVis * simT;

      // Track crests crossing boundary (phaseB - pi/2 crosses multiples of 2*pi)
      const crestCount = Math.max(0, Math.floor((phaseB + Math.PI * 1.5) / (2 * Math.PI)));
      if (crestCount > lastCrestCountRef.current) {
        lastCrestCountRef.current = crestCount;
        pulseFlashRef.current = 1.0;
      }
      pulseFlashRef.current = Math.max(0, pulseFlashRef.current - dtSec * 3.5);

      // Reflection & Transmission physics
      const R = st.showReflection ? (v2 - v1) / (v2 + v1) : 0;
      const T = st.showReflection ? 1 + R : 1;
      const baseAmpPx = st.showReflection ? Math.min(48, H * 0.13) : Math.min(68, H * 0.18);

      const startX = 24;
      const endX = W - 24;

      // Medium 1 wave curves (u <= 0)
      const leftSamples = 140;
      const leftPtsNet: { x: number; y: number }[] = [];
      const leftPtsInc: { x: number; y: number }[] = [];
      const leftPtsRef: { x: number; y: number }[] = [];

      for (let i = 0; i <= leftSamples; i++) {
        const x = startX + (i / leftSamples) * (xB - startX);
        const u = x - xB;
        const yi = baseAmpPx * Math.sin(k1 * u - phaseB);
        const yr = R * baseAmpPx * Math.sin(-k1 * u - phaseB);
        const yNet = yi + yr;
        leftPtsInc.push({ x, y: centerY - yi });
        leftPtsRef.push({ x, y: centerY - yr });
        leftPtsNet.push({ x, y: centerY - yNet });
      }

      // Medium 2 wave curve (u >= 0)
      const rightSamples = 140;
      const rightPts: { x: number; y: number }[] = [];
      for (let i = 0; i <= rightSamples; i++) {
        const x = xB + (i / rightSamples) * (endX - xB);
        const u = x - xB;
        const yt = T * baseAmpPx * Math.sin(k2 * u - phaseB);
        rightPts.push({ x, y: centerY - yt });
      }

      // Draw optional Incident & Reflected dashed component curves
      if (st.showReflection && st.showComponents && Math.abs(R) > 0.01) {
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.6;

        ctx.strokeStyle = 'rgba(2, 132, 199, 0.55)';
        ctx.beginPath();
        leftPtsInc.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();

        ctx.strokeStyle = 'rgba(225, 29, 72, 0.65)';
        ctx.beginPath();
        leftPtsRef.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();
        ctx.restore();
      }

      // Draw primary net wave in Medium 1
      ctx.save();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      leftPtsNet.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();

      // Medium 1 particles
      const numDotsLeft = 24;
      for (let i = 0; i < numDotsLeft; i++) {
        const idx = Math.floor((i / numDotsLeft) * (leftPtsNet.length - 1));
        const p = leftPtsNet[idx];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.6, 0, Math.PI * 2);
        ctx.fillStyle = '#0369a1';
        ctx.fill();
      }
      ctx.restore();

      // Draw transmitted wave in Medium 2
      ctx.save();
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 3;
      ctx.beginPath();
      rightPts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();

      // Medium 2 particles
      const numDotsRight = 24;
      for (let i = 1; i <= numDotsRight; i++) {
        const idx = Math.floor((i / numDotsRight) * (rightPts.length - 1));
        const p = rightPts[idx];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.6, 0, Math.PI * 2);
        ctx.fillStyle = '#047857';
        ctx.fill();
      }
      ctx.restore();

      // Crisp Vertical Interface Boundary Line
      ctx.save();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.moveTo(xB, 48);
      ctx.lineTo(xB, H - 44);
      ctx.stroke();
      ctx.restore();

      // Continuous Boundary Node Bead at u = 0
      const yBoundary = centerY - T * baseAmpPx * Math.sin(-phaseB);
      if (pulseFlashRef.current > 0.02) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(xB, yBoundary, 10 + (1 - pulseFlashRef.current) * 16, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(5, 150, 105, ${pulseFlashRef.current * 0.7})`;
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.restore();
      }

      ctx.beginPath();
      ctx.arc(xB, yBoundary, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#e11d48';
      ctx.fill();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Top zone titles & boundary label
      const m1Label =
        st.medium1Preset !== 'custom'
          ? langRef.current === 'bn'
            ? MEDIUM_PRESETS[st.medium1Preset].bn
            : MEDIUM_PRESETS[st.medium1Preset].en
          : `${tr.m3.medium1Col} (${v1} m/s)`;
      const m2Label =
        st.medium2Preset !== 'custom'
          ? langRef.current === 'bn'
            ? MEDIUM_PRESETS[st.medium2Preset].bn
            : MEDIUM_PRESETS[st.medium2Preset].en
          : `${tr.m3.medium2Col} (${v2} m/s)`;

      drawChip(ctx, m1Label, xB * 0.5, 26, '#ffffff', '#7dd3fc', '#0369a1');
      drawChip(ctx, m2Label, xB + (W - xB) * 0.5, 26, '#ffffff', '#6ee7b7', '#047857');
      drawChip(ctx, tr.m3.boundaryLabel, xB, 58, '#0f172a', '#0f172a', '#ffffff');

      // Visual Wavelength Caliper λ1 in Medium 1
      const lam1Phys = v1 / st.frequency;
      const lam2Phys = v2 / st.frequency;

      const drawCaliper = (
        cx1: number,
        cx2: number,
        cy: number,
        label: string,
        color: string
      ) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(cx1, cy - 5);
        ctx.lineTo(cx1, cy + 5);
        ctx.moveTo(cx2, cy - 5);
        ctx.lineTo(cx2, cy + 5);
        ctx.moveTo(cx1, cy);
        ctx.lineTo(cx2, cy);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.font = '700 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, (cx1 + cx2) / 2, cy - 9);
        ctx.restore();
      };

      const calY = centerY - Math.max(76, baseAmpPx * 1.45) - 18;
      if (lambda1Px <= xB - 48) {
        const c1Start = Math.max(32, xB * 0.5 - lambda1Px * 0.5);
        drawCaliper(c1Start, c1Start + lambda1Px, calY, `λ₁ = ${lam1Phys.toFixed(2)} m`, '#0369a1');
      } else {
        const halfLen = Math.min(xB - 54, lambda1Px * 0.5);
        const c1Start = Math.max(32, xB * 0.5 - halfLen * 0.5);
        drawCaliper(c1Start, c1Start + halfLen, calY, `½λ₁ (${lam1Phys.toFixed(2)} m)`, '#0369a1');
      }

      if (lambda2Px <= W - xB - 48) {
        const c2Start = Math.min(W - 32 - lambda2Px, xB + (W - xB) * 0.5 - lambda2Px * 0.5);
        drawCaliper(c2Start, c2Start + lambda2Px, calY, `λ₂ = ${lam2Phys.toFixed(2)} m`, '#047857');
      } else {
        const span = Math.min(W - xB - 56, lambda2Px * 0.25);
        const c2Start = xB + (W - xB) * 0.5 - span * 0.5;
        drawCaliper(c2Start, c2Start + span, calY, `¼λ₂ (λ₂=${lam2Phys.toFixed(2)}m)`, '#047857');
      }

      // Bottom summary hint & crest counter banner
      const hintText =
        Math.abs(v2 - v1) < 1
          ? tr.m3.equalHint
          : v2 > v1
          ? tr.m3.fasterHint
          : tr.m3.slowerHint;

      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.roundRect(18, H - 40, W - 36, 28, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = '600 11px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(hintText, 30, H - 22);

      ctx.fillStyle = '#065f46';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`f₁ = f₂ = ${st.frequency.toFixed(1)} Hz`, W - 30, H - 22);
      ctx.restore();

      if (now - lastTelemetryPush > 60) {
        lastTelemetryPush = now;
        onTelemetry({
          m3CrestsCrossed: crestCount,
          m3BoundaryY: T * Math.sin(-phaseB),
        });
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [stepSignal, onTelemetry, simTimeRef]);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 min-h-[460px] lg:min-h-[560px] bg-white/95 backdrop-blur-sm border border-sky-200 shadow-sm rounded-2xl overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full cursor-crosshair" />
    </div>
  );
};
