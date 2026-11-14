import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Language, LiveTelemetry, Module2State } from '../types/simulation';
import { TRANSLATIONS } from '../i18n/translations';

interface Module2StageProps {
  lang: Language;
  state: Module2State;
  isPlaying: boolean;
  playbackSpeed: number;
  simTimeRef: React.MutableRefObject<number>;
  stepSignal: number;
  onTelemetry: (patch: Partial<LiveTelemetry>) => void;
}

const BASE_AMP = 0.5;
const BASE_FREQ = 1.0;

export const Module2Stage: React.FC<Module2StageProps> = ({
  lang,
  state,
  isPlaying,
  playbackSpeed,
  simTimeRef,
  stepSignal,
  onTelemetry,
}) => {
  const t = TRANSLATIONS[lang];
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

  // 3D Orbit camera & zoom state (yaw, pitch, zoom)
  const cameraRef = useRef({ yaw: -0.62, pitch: -0.36 });
  const [zoom, setZoom] = useState<number>(1.0);
  const zoomRef = useRef<number>(1.0);
  const dragRef = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false,
    lastX: 0,
    lastY: 0,
  });

  const applyZoom = (nextZoom: number) => {
    const clamped = Math.round(Math.max(0.55, Math.min(2.4, nextZoom)) * 100) / 100;
    zoomRef.current = clamped;
    setZoom(clamped);
  };

  const resetCamera = () => {
    cameraRef.current = { yaw: -0.62, pitch: -0.36 };
    applyZoom(1.0);
  };

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

    const drawArrow = (
      ctx: CanvasRenderingContext2D,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color: string,
      lineWidth = 2
    ) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      if (len < 3) return;
      const angle = Math.atan2(dy, dx);
      const headLen = Math.min(8, len * 0.4);

      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - headLen * Math.cos(angle - Math.PI / 6),
        y2 - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        x2 - headLen * Math.cos(angle + Math.PI / 6),
        y2 - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
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

      // Base scientific grid background
      ctx.fillStyle = '#f8fbff';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.08)';
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

      let liveE = 0;
      let liveB = 0;

      if (st.subMode === 'energy') {
        // ============================================================
        // SUB-MODE 1: WAVE ENERGY & PARAMETER EXPLORER
        // ============================================================
        const waveZoneH = H * 0.64;
        const centerY = waveZoneH * 0.52;
        const startX = 48;
        const endX = W - 36;
        const laneW = Math.max(200, endX - startX);

        const pxPerM = 78;
        const lambdaPx = st.wavelength * pxPerM;
        const kPx = (2 * Math.PI) / lambdaPx;
        const omega = 2 * Math.PI * st.frequency;
        const maxAmpPx = Math.min(90, waveZoneH * 0.28);
        const ampPx = (st.amplitude / 1.5) * maxAmpPx;

        const ampFactor = Math.pow(st.amplitude / BASE_AMP, 2);
        const freqFactor = Math.pow(st.frequency / BASE_FREQ, 2);
        const energyRatio = st.vacuumMode ? 0 : ampFactor * freqFactor;

        // Title
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 13px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(
          `${tr.m2.energyMode} — v = fλ = ${(st.frequency * st.wavelength).toFixed(2)} m/s`,
          20,
          26
        );

        // Equilibrium axis
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(startX, centerY);
        ctx.lineTo(endX, centerY);
        ctx.stroke();
        ctx.restore();

        if (st.vacuumMode) {
          // Halted mechanical wave in vacuum
          ctx.save();
          ctx.strokeStyle = '#e11d48';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(startX, centerY);
          ctx.lineTo(endX, centerY);
          ctx.stroke();

          ctx.fillStyle = 'rgba(255, 241, 242, 0.94)';
          ctx.strokeStyle = '#fda4af';
          ctx.lineWidth = 1.2;
          const boxW = Math.min(460, W - 64);
          const boxH = 68;
          ctx.beginPath();
          ctx.roundRect((W - boxW) / 2, centerY - 34, boxW, boxH, 12);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#be123c';
          ctx.font = '700 13px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(tr.m2.mechHaltedTitle, W / 2, centerY - 6);
          ctx.fillStyle = '#475569';
          ctx.font = '500 11px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
          ctx.fillText(tr.m2.mechHaltedDesc, W / 2, centerY + 16);
          ctx.restore();
        } else {
          // Amplitude envelope lines (+A / -A)
          ctx.save();
          ctx.setLineDash([3, 4]);
          ctx.strokeStyle = 'rgba(5, 150, 105, 0.45)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(startX, centerY - ampPx);
          ctx.lineTo(endX, centerY - ampPx);
          ctx.moveTo(startX, centerY + ampPx);
          ctx.lineTo(endX, centerY + ampPx);
          ctx.stroke();
          ctx.restore();

          // Amplitude double-arrow indicator on left
          drawArrow(ctx, startX + 16, centerY, startX + 16, centerY - ampPx, '#059669', 1.8);
          ctx.fillStyle = '#065f46';
          ctx.font = '700 11px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`A=${st.amplitude.toFixed(2)}m`, startX + 24, centerY - ampPx * 0.55);

          // Shaded wave area proportional to energy density
          const fillAlpha = Math.min(0.32, 0.08 + Math.log10(1 + energyRatio) * 0.12);
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(startX, centerY);
          const samples = 140;
          for (let i = 0; i <= samples; i++) {
            const x = startX + (i / samples) * laneW;
            const y = centerY - ampPx * Math.sin(kPx * (x - startX) - omega * simT);
            ctx.lineTo(x, y);
          }
          ctx.lineTo(endX, centerY);
          ctx.closePath();
          ctx.fillStyle = `rgba(2, 132, 199, ${fillAlpha.toFixed(3)})`;
          ctx.fill();

          // Primary wave curve
          ctx.beginPath();
          for (let i = 0; i <= samples; i++) {
            const x = startX + (i / samples) * laneW;
            const y = centerY - ampPx * Math.sin(kPx * (x - startX) - omega * simT);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();

          // Animated Energy Flux Packets moving at wave speed v
          const vPx = st.frequency * lambdaPx;
          const numPackets = Math.min(14, Math.max(4, Math.round(3 + st.frequency * 1.8)));
          const packetSpacing = laneW / numPackets;
          const phaseShiftPx = (simT * vPx) % packetSpacing;
          const packetRadius = Math.min(8.5, Math.max(3.5, 3 + Math.sqrt(energyRatio) * 1.1));

          for (let p = 0; p <= numPackets; p++) {
            const px = startX + p * packetSpacing + phaseShiftPx;
            if (px > endX - 6) continue;
            const py = centerY - ampPx * Math.sin(kPx * (px - startX) - omega * simT);
            ctx.beginPath();
            ctx.arc(px, py, packetRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#059669';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
          }

          // Wavelength bracket (λ)
          const firstCrestPhaseOffset = (((Math.PI / 2 + omega * simT) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
          const crestX1 = startX + firstCrestPhaseOffset / kPx;
          if (crestX1 + lambdaPx <= endX - 10) {
            const crestX2 = crestX1 + lambdaPx;
            const bY = centerY - ampPx - 18;
            ctx.save();
            ctx.strokeStyle = '#0369a1';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(crestX1, bY - 5);
            ctx.lineTo(crestX1, bY + 5);
            ctx.moveTo(crestX2, bY - 5);
            ctx.lineTo(crestX2, bY + 5);
            ctx.moveTo(crestX1, bY);
            ctx.lineTo(crestX2, bY);
            ctx.stroke();
            ctx.fillStyle = '#0369a1';
            ctx.font = '700 11px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`λ = ${st.wavelength.toFixed(1)} m`, (crestX1 + crestX2) / 2, bY - 8);
            ctx.restore();
          }

          liveE = Math.sin(-omega * simT) * st.amplitude;
        }

        // Bottom Panel inside Canvas: Live Energy Transfer Flux Meter
        const meterTop = waveZoneH + 6;
        const meterH = H - meterTop - 16;
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(18, meterTop, W - 36, meterH, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = '700 12px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(tr.m2.energyFluxMeter, 34, meterTop + 24);

        const barX = 34;
        const barW = W - 68;
        const barY = meterTop + 42;
        const barH = 22;

        // Track background
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 8);
        ctx.fill();

        // Scale up to 25x smoothly with logarithmic or capped linear gauge (16x = ~75%)
        const fillRatio = Math.min(1, energyRatio / 20);
        if (fillRatio > 0.005) {
          const grad = ctx.createLinearGradient(barX, 0, barX + barW * fillRatio, 0);
          grad.addColorStop(0, '#0284c7');
          grad.addColorStop(0.5, '#059669');
          grad.addColorStop(1, '#d97706');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(barX, barY, Math.max(10, barW * fillRatio), barH, 8);
          ctx.fill();
        }

        // Baseline 1x tick mark
        const baseTickX = barX + barW * (1 / 20);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(baseTickX, barY - 4);
        ctx.lineTo(baseTickX, barY + barH + 4);
        ctx.stroke();

        // Readout below bar
        ctx.fillStyle = '#065f46';
        ctx.font = '700 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`E / E₀ = ${energyRatio.toFixed(2)}×`, barX, barY + barH + 22);

        ctx.fillStyle = '#475569';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(
          `(${(st.amplitude / BASE_AMP).toFixed(2)})² × (${(st.frequency / BASE_FREQ).toFixed(2)})² = ${energyRatio.toFixed(2)}×`,
          barX + barW,
          barY + barH + 22
        );
        ctx.restore();
      } else {
        // ============================================================
        // SUB-MODE 2: 3D-PROJECTED ELECTROMAGNETIC WAVE VISUALIZER
        // ============================================================
        const emZoneH = H * 0.72;
        const cx = W * 0.49;
        const cy = emZoneH * 0.46;

        const { yaw, pitch } = cameraRef.current;
        const zoomScale = zoomRef.current;
        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);
        const cosP = Math.cos(pitch);
        const sinP = Math.sin(pitch);

        // Clip 3D viewport cleanly above the mechanical comparison strip
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W, emZoneH);
        ctx.clip();

        // 3D Projection: x along wave propagation, y = E-field (vertical), z = B-field (horizontal)
        const project3D = (x3: number, y3: number, z3: number) => {
          // Rotate around Y (yaw)
          const xr = x3 * cosY - z3 * sinY;
          const zr = x3 * sinY + z3 * cosY;
          // Rotate around X (pitch)
          const yr = y3 * cosP - zr * sinP;
          const zFinal = y3 * sinP + zr * cosP;
          const focal = 720;
          const persp = (focal / (focal + zFinal)) * zoomScale;
          return {
            sx: cx + xr * persp,
            sy: cy - yr * persp,
            depth: zFinal,
          };
        };

        // Title & drag hint
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 13px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(tr.m2.emMode, 20, 26);

        ctx.fillStyle = '#475569';
        ctx.font = '500 11px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
        ctx.fillText(tr.m2.emDragHint, 20, 44);

        const halfLen = Math.min(245, W * 0.34);
        const numSamples = 72;
        const lambda3D = (st.wavelength / 3.0) * 142;
        const k3D = (2 * Math.PI) / lambda3D;
        const omega = 2 * Math.PI * st.frequency;
        const fieldAmp = (st.amplitude / 1.5) * Math.min(76, emZoneH * 0.21);

        // Draw 3D coordinate axes
        const axX1 = project3D(-halfLen - 20, 0, 0);
        const axX2 = project3D(halfLen + 30, 0, 0);
        drawArrow(ctx, axX1.sx, axX1.sy, axX2.sx, axX2.sy, '#334155', 1.8);
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 12px "JetBrains Mono", monospace';
        ctx.fillText('c (x)', axX2.sx + 6, axX2.sy + 4);

        const axY1 = project3D(-halfLen, -fieldAmp - 18, 0);
        const axY2 = project3D(-halfLen, fieldAmp + 26, 0);
        drawArrow(ctx, axY1.sx, axY1.sy, axY2.sx, axY2.sy, '#0284c7', 1.8);
        ctx.fillStyle = '#0369a1';
        ctx.fillText('E (y)', axY2.sx + 6, axY2.sy + 4);

        const axZ1 = project3D(-halfLen, 0, -fieldAmp - 18);
        const axZ2 = project3D(-halfLen, 0, fieldAmp + 26);
        drawArrow(ctx, axZ1.sx, axZ1.sy, axZ2.sx, axZ2.sy, '#059669', 1.8);
        ctx.fillStyle = '#047857';
        ctx.fillText('B (z)', axZ2.sx + 6, axZ2.sy + 4);

        // Compute E & B 3D curve points
        const ePts: { sx: number; sy: number; bx: number; by: number; val: number; x3: number }[] = [];
        const bPts: { sx: number; sy: number; bx: number; by: number; val: number; x3: number }[] = [];

        for (let i = 0; i <= numSamples; i++) {
          const x3 = -halfLen + (i / numSamples) * (halfLen * 2);
          const phase = k3D * (x3 + halfLen) - omega * simT;
          const waveVal = Math.sin(phase);
          const eVal = waveVal * fieldAmp;
          const bVal = waveVal * fieldAmp * 0.85;

          const base = project3D(x3, 0, 0);
          const pE = project3D(x3, eVal, 0);
          const pB = project3D(x3, 0, bVal);

          ePts.push({ sx: pE.sx, sy: pE.sy, bx: base.sx, by: base.sy, val: waveVal, x3 });
          bPts.push({ sx: pB.sx, sy: pB.sy, bx: base.sx, by: base.sy, val: waveVal, x3 });

          if (i === 0) {
            liveE = waveVal * st.amplitude;
            liveB = waveVal * st.amplitude;
          }
        }

        // Translucent B-field horizontal plane ribbon & vectors (Emerald Green)
        if (st.showBPlane) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(bPts[0].bx, bPts[0].by);
          for (const p of bPts) ctx.lineTo(p.sx, p.sy);
          ctx.lineTo(bPts[bPts.length - 1].bx, bPts[bPts.length - 1].by);
          ctx.closePath();
          ctx.fillStyle = 'rgba(5, 150, 105, 0.14)';
          ctx.fill();

          for (let i = 0; i < bPts.length; i += 3) {
            const p = bPts[i];
            if (Math.hypot(p.sx - p.bx, p.sy - p.by) > 4) {
              drawArrow(ctx, p.bx, p.by, p.sx, p.sy, 'rgba(5, 150, 105, 0.78)', 1.5);
            }
          }

          ctx.beginPath();
          bPts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy)));
          ctx.strokeStyle = '#059669';
          ctx.lineWidth = 2.6;
          ctx.stroke();
          ctx.restore();
        }

        // Translucent E-field vertical plane ribbon & vectors (Sky Blue)
        if (st.showEPlane) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(ePts[0].bx, ePts[0].by);
          for (const p of ePts) ctx.lineTo(p.sx, p.sy);
          ctx.lineTo(ePts[ePts.length - 1].bx, ePts[ePts.length - 1].by);
          ctx.closePath();
          ctx.fillStyle = 'rgba(2, 132, 199, 0.14)';
          ctx.fill();

          for (let i = 0; i < ePts.length; i += 3) {
            const p = ePts[i];
            if (Math.hypot(p.sx - p.bx, p.sy - p.by) > 4) {
              drawArrow(ctx, p.bx, p.by, p.sx, p.sy, 'rgba(2, 132, 199, 0.85)', 1.6);
            }
          }

          ctx.beginPath();
          ePts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy)));
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 2.8;
          ctx.stroke();
          ctx.restore();
        }

        // Draw 90-degree orthogonality marker at peak
        if (st.showEPlane && st.showBPlane) {
          for (let i = 10; i < ePts.length - 10; i++) {
            if (ePts[i].val > 0.92 && ePts[i].val >= ePts[i - 1].val && ePts[i].val >= ePts[i + 1].val) {
              const x3 = ePts[i].x3;
              const sqSize = 14;
              const p0 = project3D(x3, 0, 0);
              const p1 = project3D(x3, sqSize, 0);
              const p2 = project3D(x3, sqSize, sqSize);
              const p3 = project3D(x3, 0, sqSize);
              ctx.save();
              ctx.strokeStyle = '#0f172a';
              ctx.lineWidth = 1.4;
              ctx.beginPath();
              ctx.moveTo(p1.sx, p1.sy);
              ctx.lineTo(p2.sx, p2.sy);
              ctx.lineTo(p3.sx, p3.sy);
              ctx.stroke();
              ctx.fillStyle = '#0f172a';
              ctx.font = '700 10px "JetBrains Mono", monospace';
              ctx.fillText('90°', p2.sx + 4, p2.sy - 2);
              ctx.restore();
              void p0;
              break;
            }
          }
        }

        // Legend strip top-left of 3D view
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(18, emZoneH - 42, Math.min(W - 36, 490), 30, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0284c7';
        ctx.font = '700 11px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
        ctx.fillText(`■ ${tr.m2.emElectricField}`, 30, emZoneH - 23);

        ctx.fillStyle = '#059669';
        ctx.fillText(`■ ${tr.m2.emMagneticField}`, 155, emZoneH - 23);

        ctx.fillStyle = '#0f172a';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.fillText(tr.m2.emSpeedLabel, 280, emZoneH - 23);
        ctx.restore();

        // End 3D viewport clip
        ctx.restore();

        // Bottom Mechanical vs EM Vacuum Comparison Strip
        const stripTop = emZoneH + 4;
        const stripH = H - stripTop - 14;
        const stripCenterY = stripTop + stripH * 0.58;
        ctx.save();
        ctx.fillStyle = st.vacuumMode ? '#fff1f2' : '#ffffff';
        ctx.strokeStyle = st.vacuumMode ? '#fda4af' : '#bae6fd';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(18, stripTop, W - 36, stripH, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = st.vacuumMode ? '#be123c' : '#0f172a';
        ctx.font = '700 12px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(
          st.vacuumMode ? tr.m2.mechHaltedTitle : `${tr.m2.mechanicalWave} — ${tr.m2.mediumPresent}`,
          34,
          stripTop + 22
        );

        const mStartX = 36;
        const mEndX = W - 36;
        const mW = mEndX - mStartX;

        if (st.vacuumMode) {
          ctx.setLineDash([6, 6]);
          ctx.strokeStyle = '#fb7185';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(mStartX, stripCenterY);
          ctx.lineTo(mEndX, stripCenterY);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#881337';
          ctx.font = '500 11px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
          ctx.fillText(tr.m2.emVacuumActive, 34, stripTop + stripH - 12);
        } else {
          const mAmp = Math.min(26, stripH * 0.25) * (st.amplitude / 1.5);
          const mK = (2 * Math.PI) / (st.wavelength * 65);
          ctx.beginPath();
          for (let i = 0; i <= 100; i++) {
            const mx = mStartX + (i / 100) * mW;
            const my = stripCenterY - mAmp * Math.sin(mK * (mx - mStartX) - omega * simT);
            if (i === 0) ctx.moveTo(mx, my);
            else ctx.lineTo(mx, my);
          }
          ctx.strokeStyle = '#0369a1';
          ctx.lineWidth = 2.4;
          ctx.stroke();

          // Medium particles
          for (let i = 0; i <= 26; i++) {
            const mx = mStartX + (i / 26) * mW;
            const my = stripCenterY - mAmp * Math.sin(mK * (mx - mStartX) - omega * simT);
            ctx.beginPath();
            ctx.arc(mx, my, 3.2, 0, Math.PI * 2);
            ctx.fillStyle = '#0284c7';
            ctx.fill();
          }
        }
        ctx.restore();
      }

      if (now - lastTelemetryPush > 60) {
        lastTelemetryPush = now;
        onTelemetry({
          m2InstantE: liveE,
          m2InstantB: liveB,
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

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (state.subMode !== 'em3d') return;
    dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    cameraRef.current.yaw = Math.max(-1.25, Math.min(1.25, cameraRef.current.yaw + dx * 0.007));
    cameraRef.current.pitch = Math.max(-0.9, Math.min(0.95, cameraRef.current.pitch + dy * 0.007));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current.active = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (state.subMode !== 'em3d') return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.09 : 0.92;
    applyZoom(zoomRef.current * factor);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 min-h-[460px] lg:min-h-[560px] bg-white/95 backdrop-blur-sm border border-sky-200 shadow-sm rounded-2xl overflow-hidden"
    >
      {state.subMode === 'em3d' && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          <div className="inline-flex items-center bg-white/95 border border-sky-200 rounded-lg shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => applyZoom(zoomRef.current - 0.15)}
              title={t.actions.zoomOut}
              aria-label={t.actions.zoomOut}
              className="p-1.5 hover:bg-sky-50 text-slate-800 transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5 text-sky-700" />
            </button>
            <button
              type="button"
              onClick={() => applyZoom(1.0)}
              className="px-2 py-1 text-[11px] font-mono tabular-nums font-bold text-slate-900 border-x border-sky-100 hover:bg-sky-50 transition-colors cursor-pointer"
              title={t.actions.resetCamera}
            >
              {zoom.toFixed(1)}×
            </button>
            <button
              type="button"
              onClick={() => applyZoom(zoomRef.current + 0.15)}
              title={t.actions.zoomIn}
              aria-label={t.actions.zoomIn}
              className="p-1.5 hover:bg-sky-50 text-slate-800 transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5 text-sky-700" />
            </button>
          </div>
          <button
            type="button"
            onClick={resetCamera}
            className="inline-flex items-center gap-1.5 bg-white/95 hover:bg-sky-50 border border-sky-200 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-700" />
            <span>{t.actions.resetCamera}</span>
          </button>
        </div>
      )}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className={`absolute inset-0 block w-full h-full touch-none ${
          state.subMode === 'em3d' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
        }`}
      />
    </div>
  );
};
