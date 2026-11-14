import React, { useEffect, useRef } from 'react';
import { Hand, Play } from 'lucide-react';
import { Language, LiveTelemetry, Module1State } from '../types/simulation';
import { TRANSLATIONS } from '../i18n/translations';

interface Module1StageProps {
  lang: Language;
  state: Module1State;
  isPlaying: boolean;
  playbackSpeed: number;
  simTimeRef: React.MutableRefObject<number>;
  stepSignal: number;
  pulseRequest: { nonce: number; kind: 'full' | 'crest' };
  onTelemetry: (patch: Partial<LiveTelemetry>) => void;
}

interface PulsePacket {
  startTime: number;
  amplitude: number; // -1 to 1 normalized
  durationSec: number;
  kind: 'full' | 'crest';
}

const PIXELS_PER_METER = 82;

export const Module1Stage: React.FC<Module1StageProps> = ({
  lang,
  state,
  isPlaying,
  playbackSpeed,
  simTimeRef,
  stepSignal,
  pulseRequest,
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

  // Interactive piston & single-pulse buffer
  const pulsesRef = useRef<PulsePacket[]>([]);
  const isDraggingPistonRef = useRef(false);
  const pistonNormalizedYRef = useRef(0); // -1 to 1
  // Ring buffer of manual piston displacements (time, normVal)
  const manualHistoryRef = useRef<{ t: number; val: number }[]>([]);
  const lastPulseNonceRef = useRef(pulseRequest.nonce);
  const lastStepSignalRef = useRef(stepSignal);

  const enqueuePulse = (kind: 'full' | 'crest') => {
    const f = Math.max(0.5, stateRef.current.frequency);
    const durationSec = kind === 'full' ? 1.0 / f : 0.6 / f;
    pulsesRef.current.push({
      startTime: simTimeRef.current,
      amplitude: 1.0,
      durationSec,
      kind,
    });
    if (pulsesRef.current.length > 8) {
      pulsesRef.current.shift();
    }
  };

  // Launch automated complete-wave or crest pulse when requested
  useEffect(() => {
    if (pulseRequest.nonce !== lastPulseNonceRef.current) {
      lastPulseNonceRef.current = pulseRequest.nonce;
      enqueuePulse(pulseRequest.kind);
    }
  }, [pulseRequest, simTimeRef]);

  // Clear pulses when switching back to continuous; auto-send one lively full wave when entering pulse mode
  useEffect(() => {
    if (state.sourceMode === 'continuous') {
      pulsesRef.current = [];
      manualHistoryRef.current = [];
      pistonNormalizedYRef.current = 0;
    } else if (pulsesRef.current.length === 0 && manualHistoryRef.current.length === 0) {
      enqueuePulse('full');
    }
  }, [state.sourceMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animId = 0;
    let lastTimestamp = performance.now();
    let lastTelemetryPush = 0;
    let cssW = Math.max(300, container.clientWidth);
    let cssH = Math.max(340, container.clientHeight);

    const updateSize = () => {
      cssW = Math.max(300, container.clientWidth);
      cssH = Math.max(340, container.clientHeight);
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);

    // Helper: evaluate normalized displacement (-1..1) at distance dxPx from piston and time simT
    const evalNormalizedWave = (
      dxPx: number,
      simT: number,
      st: Module1State
    ): { disp: number; velFactor: number } => {
      const lambdaPx = st.wavelength * PIXELS_PER_METER;
      const vPx = st.frequency * lambdaPx;

      if (st.sourceMode === 'continuous') {
        const kPx = (2 * Math.PI) / lambdaPx;
        const omega = 2 * Math.PI * st.frequency;
        const phase = kPx * dxPx - omega * simT;
        return {
          disp: Math.sin(phase),
          velFactor: -omega * Math.cos(phase),
        };
      }

      // Single Pulse Mode: combine launched packets + manual piston history
      const tDelay = dxPx / Math.max(40, vPx);
      const tEmit = simT - tDelay;
      let total = 0;
      let deriv = 0;

      for (const p of pulsesRef.current) {
        const dt = tEmit - p.startTime;
        if (dt >= 0 && dt <= p.durationSec) {
          const u = dt / p.durationSec; // 0..1
          if (p.kind === 'full') {
            // Smooth windowed complete 1-cycle sine wave (Crest + Trough)
            const env = Math.pow(Math.sin(Math.PI * u), 0.75);
            const envDeriv =
              (0.75 * Math.PI * Math.cos(Math.PI * u)) /
              (p.durationSec * Math.max(0.08, Math.pow(Math.sin(Math.PI * u), 0.25)));
            const carrier = Math.sin(2 * Math.PI * u);
            const carrierDeriv = (2 * Math.PI * Math.cos(2 * Math.PI * u)) / p.durationSec;
            const val = p.amplitude * 1.15 * env * carrier;
            total += val;
            deriv += p.amplitude * 1.15 * (envDeriv * carrier + env * carrierDeriv);
          } else {
            // Smooth raised-cosine crest pulse
            const s = Math.sin(Math.PI * u);
            const val = p.amplitude * Math.pow(s, 1.5);
            const dVal =
              p.amplitude *
              1.5 *
              Math.pow(s, 0.5) *
              (Math.PI / p.durationSec) *
              Math.cos(Math.PI * u);
            total += val;
            deriv += dVal;
          }
        }
      }

      // Sample manual drag history if present
      const hist = manualHistoryRef.current;
      if (hist.length >= 2 && tEmit >= hist[0].t && tEmit <= hist[hist.length - 1].t) {
        // Binary search or linear scan (history capped ~240 entries)
        for (let i = hist.length - 1; i >= 1; i--) {
          if (hist[i - 1].t <= tEmit && hist[i].t >= tEmit) {
            const span = Math.max(0.0001, hist[i].t - hist[i - 1].t);
            const alpha = (tEmit - hist[i - 1].t) / span;
            const val = hist[i - 1].val * (1 - alpha) + hist[i].val * alpha;
            const dVal = (hist[i].val - hist[i - 1].val) / span;
            total += val;
            deriv += dVal;
            break;
          }
        }
      }

      // Clamp gracefully
      total = Math.max(-1.2, Math.min(1.2, total));
      return { disp: total, velFactor: deriv };
    };

    const drawArrow = (
      ctx: CanvasRenderingContext2D,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color: string,
      lineWidth = 2.2
    ) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      if (len < 3) return;
      const angle = Math.atan2(dy, dx);
      const headLen = Math.min(9, len * 0.45);

      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
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

    const drawLabelChip = (
      ctx: CanvasRenderingContext2D,
      text: string,
      x: number,
      y: number,
      bgColor: string,
      borderColor: string,
      textColor: string
    ) => {
      ctx.save();
      ctx.font = '600 11px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
      const w = ctx.measureText(text).width + 14;
      const h = 20;
      const rx = x - w / 2;
      const ry = y - h / 2;
      ctx.fillStyle = bgColor;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(rx, ry, w, h, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = textColor;
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

      // Record manual piston position if in pulse mode
      if (st.sourceMode === 'pulse' && (isPlayingRef.current || isDraggingPistonRef.current)) {
        const curT = simTimeRef.current;
        const val = isDraggingPistonRef.current ? pistonNormalizedYRef.current : 0;
        const hist = manualHistoryRef.current;
        if (hist.length === 0 || curT - hist[hist.length - 1].t > 0.012) {
          hist.push({ t: curT, val });
          if (hist.length > 260) hist.shift();
        }
      }

      const simT = simTimeRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.max(300, Math.floor(cssW * dpr));
      const targetH = Math.max(340, Math.floor(cssH * dpr));
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

      // Subtle scientific grid backdrop
      ctx.fillStyle = '#f8fbff';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.08)';
      ctx.lineWidth = 1;
      const gridStep = 28;
      for (let gx = 0; gx < W; gx += gridStep) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, H);
        ctx.stroke();
      }
      for (let gy = 0; gy < H; gy += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(W, gy);
        ctx.stroke();
      }

      const startX = st.sourceMode === 'pulse' ? 76 : 44;
      const endX = W - 28;
      const laneW = Math.max(200, endX - startX);
      const showTrans = st.viewMode === 'dual' || st.viewMode === 'transverse';
      const showLong = st.viewMode === 'dual' || st.viewMode === 'longitudinal';

      const transCenterY = showTrans && showLong ? H * 0.28 : H * 0.5;
      const longCenterY = showTrans && showLong ? H * 0.73 : H * 0.5;

      // Visual amplitude scaling
      const maxAmpPx = showTrans && showLong ? Math.min(58, H * 0.14) : Math.min(92, H * 0.24);
      const ampPx = (st.amplitude / 1.5) * maxAmpPx;

      const numCols = Math.max(44, Math.floor(laneW / 14));
      const markerIdx = Math.floor(numCols * 0.36);

      // Divider between lanes in dual mode
      if (showTrans && showLong) {
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(16, H * 0.505);
        ctx.lineTo(W - 16, H * 0.505);
        ctx.stroke();
      }

      let liveTransY = 0;
      let liveTransVy = 0;
      let liveLongX = 0;
      let liveLongVx = 0;

      // =====================================================
      // TOP LANE: TRANSVERSE WAVE
      // =====================================================
      if (showTrans) {
        // Lane title
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 13px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(tr.m1.laneTransverse, 20, 24);

        // Equilibrium axis
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(startX, transCenterY);
        ctx.lineTo(endX, transCenterY);
        ctx.stroke();
        ctx.restore();

        // Compute particle positions
        const pts: { x: number; y: number; disp: number }[] = [];
        for (let i = 0; i <= numCols; i++) {
          const frac = i / numCols;
          const x = startX + frac * laneW;
          const dxPx = x - startX;
          const { disp, velFactor } = evalNormalizedWave(dxPx, simT, st);
          const y = transCenterY - disp * ampPx;
          pts.push({ x, y, disp });

          if (i === markerIdx) {
            liveTransY = disp * st.amplitude;
            liveTransVy = velFactor * st.amplitude;
          }
        }

        // Lively shaded area fill under traveling wave in pulse mode
        if (st.sourceMode === 'pulse') {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(pts[0].x, transCenterY);
          for (let i = 0; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
          }
          ctx.lineTo(pts[pts.length - 1].x, transCenterY);
          ctx.closePath();
          const grad = ctx.createLinearGradient(0, transCenterY - maxAmpPx, 0, transCenterY + maxAmpPx);
          grad.addColorStop(0, 'rgba(2, 132, 199, 0.22)');
          grad.addColorStop(0.5, 'rgba(2, 132, 199, 0.02)');
          grad.addColorStop(1, 'rgba(5, 150, 105, 0.20)');
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.restore();
        }

        // Smooth wave curve stroke
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          const prev = pts[i - 1];
          const curr = pts[i];
          const mx = (prev.x + curr.x) * 0.5;
          const my = (prev.y + curr.y) * 0.5;
          ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = st.sourceMode === 'pulse' ? 3.1 : 2.6;
        ctx.stroke();
        ctx.restore();

        // Highlight Marker Particle Vertical Track
        if (st.highlightMarkers) {
          const mp = pts[markerIdx];
          ctx.save();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = 'rgba(225, 29, 72, 0.55)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(mp.x, transCenterY - maxAmpPx - 14);
          ctx.lineTo(mp.x, transCenterY + maxAmpPx + 14);
          ctx.stroke();
          ctx.restore();

          // Equilibrium dot
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.arc(mp.x, transCenterY, 3, 0, Math.PI * 2);
          ctx.fill();

          if (st.showVectors) {
            drawArrow(ctx, mp.x, transCenterY, mp.x, mp.y, '#e11d48', 2.4);
          }
        }

        // Draw particles along string (with kinetic energy halo when oscillating in pulse mode)
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          const isMarker = st.highlightMarkers && i === markerIdx;
          const energyMag = Math.min(1, Math.abs(p.disp));
          if (st.sourceMode === 'pulse' && energyMag > 0.08 && !isMarker) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4.5 + energyMag * 4.5, 0, Math.PI * 2);
            ctx.fillStyle = p.disp >= 0 ? `rgba(14, 165, 233, ${(energyMag * 0.24).toFixed(2)})` : `rgba(16, 185, 129, ${(energyMag * 0.24).toFixed(2)})`;
            ctx.fill();
          }

          ctx.beginPath();
          const baseR = st.sourceMode === 'pulse' ? 4.2 + energyMag * 1.4 : 4.2;
          ctx.arc(p.x, p.y, isMarker ? 7.5 : baseR, 0, Math.PI * 2);
          if (isMarker) {
            ctx.fillStyle = '#e11d48';
            ctx.fill();
            ctx.lineWidth = 2.2;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
          } else {
            ctx.fillStyle =
              st.sourceMode === 'pulse' && energyMag > 0.25
                ? p.disp >= 0
                  ? '#0284c7'
                  : '#059669'
                : i % 2 === 0
                ? '#0369a1'
                : '#38bdf8';
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
          }
        }

        // Dynamic Crest & Trough labels (detect local extrema in visible range)
        let labeledCrest = false;
        let labeledTrough = false;
        for (let i = 4; i < pts.length - 4; i++) {
          const prev = pts[i - 1].disp;
          const cur = pts[i].disp;
          const next = pts[i + 1].disp;
          if (!labeledCrest && cur > 0.65 && cur >= prev && cur >= next && pts[i].x > startX + 80) {
            drawLabelChip(
              ctx,
              tr.m1.crest,
              pts[i].x,
              pts[i].y - 18,
              '#e0f2fe',
              '#38bdf8',
              '#0369a1'
            );
            labeledCrest = true;
          }
          if (!labeledTrough && cur < -0.65 && cur <= prev && cur <= next && pts[i].x > startX + 80) {
            drawLabelChip(
              ctx,
              tr.m1.trough,
              pts[i].x,
              pts[i].y + 19,
              '#f1f5f9',
              '#94a3b8',
              '#334155'
            );
            labeledTrough = true;
          }
          if (labeledCrest && labeledTrough) break;
        }

        // Wavelength Ruler (λ) on Transverse Lane
        if (st.showWavelengthRuler && st.sourceMode === 'continuous') {
          const lambdaPx = st.wavelength * PIXELS_PER_METER;
          // Find first visible crest
          let crestX = -1;
          for (let i = 2; i < pts.length - 2; i++) {
            if (pts[i].disp > 0.88 && pts[i].disp >= pts[i - 1].disp && pts[i].disp >= pts[i + 1].disp) {
              if (pts[i].x + lambdaPx <= endX - 10) {
                crestX = pts[i].x;
                break;
              }
            }
          }
          if (crestX > 0) {
            const x2 = crestX + lambdaPx;
            const rulerY = transCenterY - maxAmpPx - 20;
            ctx.save();
            ctx.strokeStyle = '#059669';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(crestX, rulerY - 5);
            ctx.lineTo(crestX, rulerY + 5);
            ctx.moveTo(x2, rulerY - 5);
            ctx.lineTo(x2, rulerY + 5);
            ctx.moveTo(crestX, rulerY);
            ctx.lineTo(x2, rulerY);
            ctx.stroke();

            drawLabelChip(
              ctx,
              `λ = ${st.wavelength.toFixed(1)} m`,
              (crestX + x2) / 2,
              rulerY,
              '#ecfdf5',
              '#10b981',
              '#065f46'
            );
            ctx.restore();
          }
        }

        // Manual Oscillator Piston on Left when in pulse mode
        if (st.sourceMode === 'pulse') {
          const pistonY = transCenterY - evalNormalizedWave(0, simT, st).disp * ampPx;
          ctx.save();
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(32, transCenterY - maxAmpPx - 16);
          ctx.lineTo(32, transCenterY + maxAmpPx + 16);
          ctx.stroke();

          ctx.fillStyle = isDraggingPistonRef.current ? '#047857' : '#059669';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(14, pistonY - 14, 36, 28, 8);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = '#059669';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(50, pistonY);
          ctx.lineTo(startX, pts[0].y);
          ctx.stroke();

          ctx.fillStyle = '#065f46';
          ctx.font = '700 10px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(tr.m1.dragPiston, 32, transCenterY + maxAmpPx + 30);
          ctx.restore();
        }
      }

      // =====================================================
      // BOTTOM LANE: LONGITUDINAL WAVE
      // =====================================================
      if (showLong) {
        const laneTopY = showTrans && showLong ? H * 0.505 : 0;
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 13px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(tr.m1.laneLongitudinal, 20, laneTopY + 24);

        const tubeHeight = showTrans && showLong ? Math.min(86, H * 0.21) : Math.min(130, H * 0.36);
        const tubeTop = longCenterY - tubeHeight / 2;

        // Longitudinal displacement scaling (bounded to prevent unphysical crossing)
        const lambdaPx = st.wavelength * PIXELS_PER_METER;
        const maxSafeLongPx = Math.min(28, (lambdaPx / (2 * Math.PI)) * 0.72);
        const longAmpPx = (st.amplitude / 1.5) * maxSafeLongPx;

        // Draw tube chamber background
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(startX - 8, tubeTop, laneW + 16, tubeHeight, 12);
        ctx.fill();
        ctx.stroke();

        // Clip density shading to tube chamber
        ctx.beginPath();
        ctx.roundRect(startX - 8, tubeTop, laneW + 16, tubeHeight, 12);
        ctx.clip();

        // Compute compression / rarefaction shading bands across slices
        const slices = 90;
        const sliceW = laneW / slices;
        const densityVals: number[] = [];

        for (let s = 0; s < slices; s++) {
          const xCenter = startX + (s + 0.5) * sliceW;
          const dx = xCenter - startX;
          const dLeft = evalNormalizedWave(Math.max(0, dx - 3), simT, st).disp;
          const dRight = evalNormalizedWave(dx + 3, simT, st).disp;
          // Local strain compression: -d(xi)/dx
          const strain = -((dRight - dLeft) * longAmpPx) / 6;
          // Normalize roughly -1..1
          const normComp = Math.max(-1, Math.min(1, strain * 2.1));
          densityVals.push(normComp);

          if (normComp > 0.05) {
            ctx.fillStyle = `rgba(2, 132, 199, ${(normComp * 0.26).toFixed(3)})`;
            ctx.fillRect(startX + s * sliceW, tubeTop, sliceW + 1, tubeHeight);
          } else if (normComp < -0.05) {
            ctx.fillStyle = `rgba(241, 245, 249, ${(Math.abs(normComp) * 0.65).toFixed(3)})`;
            ctx.fillRect(startX + s * sliceW, tubeTop, sliceW + 1, tubeHeight);
          }
        }
        ctx.restore();

        // Draw equilibrium vertical ticks & multi-row molecules + coupled spring on center row
        const rowOffsets = [-tubeHeight * 0.28, 0, tubeHeight * 0.28];
        const longPtsCenter: { xEq: number; x: number; dxOffset: number }[] = [];

        for (let i = 0; i <= numCols; i++) {
          const xEq = startX + (i / numCols) * laneW;
          const dxPx = xEq - startX;
          const { disp, velFactor } = evalNormalizedWave(dxPx, simT, st);
          const xCur = xEq + disp * longAmpPx;
          longPtsCenter.push({ xEq, x: xCur, dxOffset: disp * longAmpPx });

          if (i === markerIdx) {
            liveLongX = disp * st.amplitude;
            liveLongVx = velFactor * st.amplitude;
          }
        }

        // Coupled spring zig-zag along center row
        ctx.save();
        ctx.strokeStyle = 'rgba(14, 116, 144, 0.35)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let i = 0; i < longPtsCenter.length - 1; i++) {
          const xA = longPtsCenter[i].x;
          const xB = longPtsCenter[i + 1].x;
          const midX = (xA + xB) * 0.5;
          if (i === 0) ctx.moveTo(xA, longCenterY);
          ctx.lineTo(midX - (xB - xA) * 0.16, longCenterY - 6);
          ctx.lineTo(midX + (xB - xA) * 0.16, longCenterY + 6);
          ctx.lineTo(xB, longCenterY);
        }
        ctx.stroke();
        ctx.restore();

        // Marker particle horizontal guide track
        if (st.highlightMarkers) {
          const mp = longPtsCenter[markerIdx];
          ctx.save();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = 'rgba(225, 29, 72, 0.55)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(mp.xEq - maxSafeLongPx - 14, longCenterY);
          ctx.lineTo(mp.xEq + maxSafeLongPx + 14, longCenterY);
          ctx.stroke();
          ctx.restore();

          // Fixed equilibrium tick mark
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(mp.xEq, longCenterY - 15);
          ctx.lineTo(mp.xEq, longCenterY + 15);
          ctx.stroke();
        }

        // Draw molecular particles across the 3 rows
        for (let r = 0; r < rowOffsets.length; r++) {
          const ry = longCenterY + rowOffsets[r];
          for (let i = 0; i < longPtsCenter.length; i++) {
            // Slight stagger on outer rows for natural molecular gas feel
            const stagger = r === 1 ? 0 : (i % 2 === 0 ? 3 : -3);
            const px = longPtsCenter[i].x + stagger;
            const isMarker = st.highlightMarkers && r === 1 && i === markerIdx;

            ctx.beginPath();
            ctx.arc(px, ry, isMarker ? 7.5 : r === 1 ? 4.2 : 3.2, 0, Math.PI * 2);
            if (isMarker) {
              ctx.fillStyle = '#e11d48';
              ctx.fill();
              ctx.lineWidth = 2.2;
              ctx.strokeStyle = '#ffffff';
              ctx.stroke();
            } else {
              ctx.fillStyle = r === 1 ? '#0284c7' : 'rgba(2, 132, 199, 0.65)';
              ctx.fill();
            }
          }
        }

        // Displacement vector x⃗ on longitudinal marker
        if (st.highlightMarkers && st.showVectors) {
          const mp = longPtsCenter[markerIdx];
          drawArrow(ctx, mp.xEq, longCenterY - 14, mp.x, longCenterY - 14, '#e11d48', 2.2);
        }

        // Label Compression & Rarefaction peaks dynamically
        let compLabeled = false;
        let rareLabeled = false;
        for (let s = 12; s < slices - 10; s++) {
          const v = densityVals[s];
          const xPos = startX + (s + 0.5) * sliceW;
          if (!compLabeled && v > 0.42 && v >= densityVals[s - 1] && v >= densityVals[s + 1]) {
            drawLabelChip(
              ctx,
              tr.m1.compression,
              xPos,
              tubeTop - 13,
              '#d1fae5',
              '#10b981',
              '#065f46'
            );
            compLabeled = true;
          }
          if (!rareLabeled && v < -0.42 && v <= densityVals[s - 1] && v <= densityVals[s + 1]) {
            drawLabelChip(
              ctx,
              tr.m1.rarefaction,
              xPos,
              tubeTop + tubeHeight + 14,
              '#f1f5f9',
              '#94a3b8',
              '#334155'
            );
            rareLabeled = true;
          }
          if (compLabeled && rareLabeled) break;
        }
      }

      // Push live telemetry ~18 Hz to keep React UI snappy without flooding
      if (now - lastTelemetryPush > 55) {
        lastTelemetryPush = now;
        onTelemetry({
          m1TransverseY: liveTransY,
          m1TransverseVy: liveTransVy,
          m1LongitudinalX: liveLongX,
          m1LongitudinalVx: liveLongVx,
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

  // Pointer handlers for manual piston drag in Single Pulse Mode
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (state.sourceMode !== 'pulse') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x <= 120) {
      isDraggingPistonRef.current = true;
      canvas.setPointerCapture(e.pointerId);
      updatePistonFromY(y, rect.height);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingPistonRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    updatePistonFromY(e.clientY - rect.top, rect.height);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingPistonRef.current) return;
    isDraggingPistonRef.current = false;
    pistonNormalizedYRef.current = 0;
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };

  const updatePistonFromY = (y: number, h: number) => {
    const showBoth = state.viewMode === 'dual';
    const centerY = showBoth ? h * 0.28 : h * 0.5;
    const maxOffset = showBoth ? Math.min(58, h * 0.14) : Math.min(92, h * 0.24);
    const norm = Math.max(-1, Math.min(1, (centerY - y) / Math.max(20, maxOffset)));
    pistonNormalizedYRef.current = norm;
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {state.sourceMode === 'pulse' && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 text-xs text-emerald-900">
          <div className="flex items-center gap-2 font-medium">
            <Hand className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{t.m1.pluckerHint}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => enqueuePulse('full')}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{t.actions.launchFullWave}</span>
            </button>
            <button
              type="button"
              onClick={() => enqueuePulse('crest')}
              className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{t.actions.launchCrestPulse}</span>
            </button>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative flex-1 min-h-[460px] lg:min-h-[560px] bg-white/95 backdrop-blur-sm border border-sky-200 shadow-sm rounded-2xl overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`absolute inset-0 block w-full h-full touch-none ${
            state.sourceMode === 'pulse' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
          }`}
        />
      </div>
    </div>
  );
};
