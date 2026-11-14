import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Send, Waves } from 'lucide-react';
import { Language, LiveTelemetry, Module4State } from '../types/simulation';
import { TRANSLATIONS } from '../i18n/translations';

interface Module4StageProps {
  lang: Language;
  state: Module4State;
  isPlaying: boolean;
  playbackSpeed: number;
  simTimeRef: React.MutableRefObject<number>;
  stepSignal: number;
  pulseNonce: number;
  calmNonce: number;
  onTelemetry: (patch: Partial<LiveTelemetry>) => void;
}

const NUM_BEADS = 76; // 0..75 => 0.0 to 7.5 cm (dx = 0.1 cm)
const DX_CM = 0.1;
const SUB_DT = 0.004; // 250 Hz physics sub-step
const TENSION_SPEED_CM_S: Record<Module4State['tension'], number> = {
  low: 1.5,
  medium: 3.0,
  high: 5.0,
};

export const Module4Stage: React.FC<Module4StageProps> = ({
  lang,
  state,
  isPlaying,
  playbackSpeed,
  simTimeRef,
  stepSignal,
  pulseNonce,
  calmNonce,
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

  // Physics arrays (displacement in cm)
  const yPrevRef = useRef<Float64Array>(new Float64Array(NUM_BEADS));
  const yCurRef = useRef<Float64Array>(new Float64Array(NUM_BEADS));
  const yNextRef = useRef<Float64Array>(new Float64Array(NUM_BEADS));
  const accumRef = useRef<number>(0);

  // Driver state
  const oscPhaseRef = useRef<number>(0);
  const pulseActiveRef = useRef<{ active: boolean; elapsed: number; width: number; amp: number }>({
    active: false,
    elapsed: 0,
    width: 0.5,
    amp: 0.75,
  });
  const manualYCmRef = useRef<number>(0);
  const lastPulseNonceRef = useRef(pulseNonce);
  const lastCalmNonceRef = useRef(calmNonce);
  const lastStepSignalRef = useRef(stepSignal);

  // Draggable measurement tools state (offsets in CSS pixels)
  const hRulerPosRef = useRef<{ x: number; y: number }>({ x: 86, y: 380 });
  const vRulerPosRef = useRef<{ x: number; y: number }>({ x: 112, y: 120 });
  const refLineYOffsetPxRef = useRef<number>(-64); // relative to centerY

  const dragTargetRef = useRef<
    null | 'wrench' | 'hRuler' | 'vRuler' | 'refLine'
  >(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const layoutRef = useRef<{
    startX: number;
    endX: number;
    centerY: number;
    pxPerCmY: number;
    pxPerCmX: number;
    W: number;
    H: number;
  }>({
    startX: 90,
    endX: 700,
    centerY: 260,
    pxPerCmY: 96,
    pxPerCmX: 80,
    W: 800,
    H: 540,
  });

  // Stopwatch state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRunningRef = useRef(false);
  timerRunningRef.current = timerRunning;
  const timerAccumRef = useRef(0);

  const calmString = () => {
    yPrevRef.current.fill(0);
    yCurRef.current.fill(0);
    yNextRef.current.fill(0);
    manualYCmRef.current = 0;
    pulseActiveRef.current.active = false;
    oscPhaseRef.current = 0;
  };

  const triggerPulse = () => {
    const st = stateRef.current;
    pulseActiveRef.current = {
      active: true,
      elapsed: 0,
      width: Math.max(0.15, st.pulseWidth),
      amp: st.amplitude,
    };
  };

  useEffect(() => {
    if (pulseNonce !== lastPulseNonceRef.current) {
      lastPulseNonceRef.current = pulseNonce;
      triggerPulse();
    }
  }, [pulseNonce]);

  useEffect(() => {
    if (calmNonce !== lastCalmNonceRef.current) {
      lastCalmNonceRef.current = calmNonce;
      calmString();
    }
  }, [calmNonce]);

  // Reset source gently when changing sourceMode
  useEffect(() => {
    pulseActiveRef.current.active = false;
    if (state.sourceMode === 'pulse') {
      manualYCmRef.current = 0;
    }
  }, [state.sourceMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animId = 0;
    let lastTimestamp = performance.now();
    let lastTelemetryPush = 0;
    let lastTimerPush = 0;
    let cssW = Math.max(320, container.clientWidth);
    let cssH = Math.max(380, container.clientHeight);
    let initializedRulers = false;

    const updateSize = () => {
      cssW = Math.max(320, container.clientWidth);
      cssH = Math.max(380, container.clientHeight);
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);

    const stepPhysics = (st: Module4State) => {
      const yPrev = yPrevRef.current;
      const yCur = yCurRef.current;
      const yNext = yNextRef.current;

      const c = TENSION_SPEED_CM_S[st.tension];
      const r = (c * SUB_DT) / DX_CM;
      const r2 = r * r;
      const damp = (st.damping / 100) * 0.011; // smooth dimensionless damping

      // 1. Update driver position (bead 0)
      let y0 = 0;
      if (st.sourceMode === 'manual') {
        y0 = manualYCmRef.current;
      } else if (st.sourceMode === 'oscillate') {
        oscPhaseRef.current += 2 * Math.PI * st.frequency * SUB_DT;
        y0 = st.amplitude * Math.sin(oscPhaseRef.current);
      } else {
        // pulse
        const p = pulseActiveRef.current;
        if (p.active) {
          p.elapsed += SUB_DT;
          if (p.elapsed >= p.width) {
            p.active = false;
            y0 = 0;
          } else {
            const u = p.elapsed / p.width;
            y0 = p.amp * Math.pow(Math.sin(Math.PI * u), 1.6);
          }
        } else {
          y0 = 0;
        }
      }
      yNext[0] = y0;

      // 2. Interior beads 1..N-2
      const denom = 1 + damp;
      for (let i = 1; i < NUM_BEADS - 1; i++) {
        const accelTerm = r2 * (yCur[i + 1] - 2 * yCur[i] + yCur[i - 1]);
        yNext[i] = (2 * yCur[i] - (1 - damp) * yPrev[i] + accelTerm) / denom;
      }

      // 3. Right boundary bead (N-1)
      const last = NUM_BEADS - 1;
      if (st.endMode === 'fixed') {
        yNext[last] = 0;
      } else if (st.endMode === 'loose') {
        const accelEnd = r2 * (2 * yCur[last - 1] - 2 * yCur[last]);
        yNext[last] = (2 * yCur[last] - (1 - damp) * yPrev[last] + accelEnd) / denom;
      } else {
        // No End: 1st-order Mur Absorbing Boundary Condition
        const coeff = (r - 1) / (r + 1);
        yNext[last] = yCur[last - 1] + coeff * (yNext[last - 1] - yCur[last]);
      }

      // Rotate buffers
      yPrev.set(yCur);
      yCur.set(yNext);
    };

    const render = (now: number) => {
      const dtSec = Math.min(0.05, (now - lastTimestamp) / 1000);
      lastTimestamp = now;

      const st = stateRef.current;

      // Advance simulation physics
      let simDelta = 0;
      if (stepSignal !== lastStepSignalRef.current) {
        lastStepSignalRef.current = stepSignal;
        simDelta = 1 / 60;
      } else if (isPlayingRef.current) {
        simDelta = dtSec * speedRef.current;
      }

      if (simDelta > 0) {
        simTimeRef.current += simDelta;
        accumRef.current += simDelta;
        while (accumRef.current >= SUB_DT) {
          stepPhysics(st);
          accumRef.current -= SUB_DT;
        }
        if (timerRunningRef.current) {
          timerAccumRef.current += simDelta;
        }
      }

      if (now - lastTimerPush > 50) {
        lastTimerPush = now;
        setTimerSeconds(timerAccumRef.current);
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.max(320, Math.floor(cssW * dpr));
      const targetH = Math.max(380, Math.floor(cssH * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const W = cssW;
      const H = cssH;

      if (!initializedRulers) {
        initializedRulers = true;
        hRulerPosRef.current = { x: Math.max(92, W * 0.14), y: Math.min(H - 64, H * 0.78) };
        vRulerPosRef.current = { x: Math.max(100, W * 0.16), y: Math.max(60, H * 0.22) };
      }

      const startX = 96;
      const endX = W - 64;
      const stringW = Math.max(200, endX - startX);
      const centerY = H * 0.48;
      const pxPerCmX = stringW / 7.5;
      const pxPerCmY = Math.min(115, H * 0.24);

      layoutRef.current = { startX, endX, centerY, pxPerCmY, pxPerCmX, W, H };

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      // Soft light-blue scientific backdrop & grid
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

      // Window opening on the right when endMode === 'none'
      if (st.endMode === 'none') {
        ctx.save();
        ctx.fillStyle = '#e0f2fe';
        ctx.strokeStyle = '#7dd3fc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(endX - 4, centerY - 140, W - endX + 12, 280, 10);
        ctx.fill();
        ctx.stroke();

        // Diagonal open-window sky lines
        ctx.strokeStyle = 'rgba(2, 132, 199, 0.18)';
        ctx.lineWidth = 1.2;
        for (let wy = centerY - 120; wy < centerY + 130; wy += 24) {
          ctx.beginPath();
          ctx.moveTo(endX + 4, wy);
          ctx.lineTo(W - 4, wy - 16);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Equilibrium dashed center line
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(startX, centerY);
      ctx.lineTo(endX, centerY);
      ctx.stroke();
      ctx.restore();

      // Draggable Reference Line (dashed amber/orange)
      if (st.showRefLine) {
        const refY = Math.max(44, Math.min(H - 44, centerY + refLineYOffsetPxRef.current));
        const refCm = (centerY - refY) / pxPerCmY;
        ctx.save();
        ctx.setLineDash([7, 5]);
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(startX - 18, refY);
        ctx.lineTo(endX + 12, refY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Grab tab on right
        ctx.fillStyle = '#fef3c7';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.roundRect(endX - 66, refY - 11, 64, 22, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#92400e';
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${refCm >= 0 ? '+' : ''}${refCm.toFixed(2)} cm`, endX - 34, refY + 0.5);
        ctx.restore();
      }

      // Compute screen points for all beads
      const yCur = yCurRef.current;
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < NUM_BEADS; i++) {
        const bx = startX + (i / (NUM_BEADS - 1)) * stringW;
        const by = centerY - yCur[i] * pxPerCmY;
        pts.push({ x: bx, y: by });
      }

      // Draw string line
      ctx.save();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      pts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
      ctx.restore();

      // Draw beads (every bead subtle, every 10th bead PhET-style Emerald Green marker!)
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const isGreenMarker = i % 10 === 0;
        const isEndLoose = i === NUM_BEADS - 1 && st.endMode === 'loose';
        if (i % 2 === 0 || isGreenMarker || isEndLoose) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, isGreenMarker ? 5.8 : 3.2, 0, Math.PI * 2);
          ctx.fillStyle = isGreenMarker ? '#059669' : '#38bdf8';
          ctx.fill();
          ctx.lineWidth = isGreenMarker ? 1.8 : 0.8;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        }
      }

      // ============================================================
      // LEFT DRIVER MECHANISM (Wrench / Motor Oscillator / Pulse)
      // ============================================================
      const p0 = pts[0];
      if (st.sourceMode === 'manual') {
        // Vertical track guide
        ctx.save();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(startX, centerY - 1.35 * pxPerCmY);
        ctx.lineTo(startX, centerY + 1.35 * pxPerCmY);
        ctx.stroke();

        // Wrench body gripping bead 0
        ctx.fillStyle = dragTargetRef.current === 'wrench' ? '#047857' : '#059669';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(startX - 58, p0.y - 12, 52, 24, 8);
        ctx.fill();
        ctx.stroke();

        // Wrench jaws around bead 0
        ctx.strokeStyle = '#065f46';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(p0.x, p0.y, 9, 0.5, Math.PI * 2 - 0.5);
        ctx.stroke();

        // Grip ridges
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.lineWidth = 1.5;
        for (let rx = startX - 46; rx <= startX - 26; rx += 6) {
          ctx.beginPath();
          ctx.moveTo(rx, p0.y - 5);
          ctx.lineTo(rx, p0.y + 5);
          ctx.stroke();
        }
        ctx.restore();
      } else if (st.sourceMode === 'oscillate') {
        // Motorized flywheel oscillator on left
        const wheelX = startX - 46;
        const wheelY = centerY;
        const wheelR = 24;
        const crankAngle = oscPhaseRef.current;
        const pinX = wheelX + Math.cos(crankAngle) * (wheelR * 0.65);
        const pinY = wheelY - Math.sin(crankAngle) * (wheelR * 0.65);

        ctx.save();
        // Vertical slider track
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(startX, centerY - 1.35 * pxPerCmY);
        ctx.lineTo(startX, centerY + 1.35 * pxPerCmY);
        ctx.stroke();

        // Connecting rod
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pinX, pinY);
        ctx.lineTo(p0.x, p0.y);
        ctx.stroke();

        // Flywheel housing
        ctx.fillStyle = '#e2e8f0';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(wheelX, wheelY, wheelR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Rotating crank pin
        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.arc(pinX, pinY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Slider clamp at bead 0
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(p0.x - 7, p0.y - 7, 14, 14, 4);
        ctx.fill();
        ctx.restore();
      } else {
        // Pulse Piston Actuator
        ctx.save();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(startX, centerY - 1.35 * pxPerCmY);
        ctx.lineTo(startX, centerY + 1.35 * pxPerCmY);
        ctx.stroke();

        ctx.fillStyle = pulseActiveRef.current.active ? '#059669' : '#0284c7';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(startX - 44, p0.y - 12, 38, 24, 7);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // ============================================================
      // RIGHT END MECHANISM (Fixed Clamp / Loose Pole+Ring / Open)
      // ============================================================
      const pEnd = pts[NUM_BEADS - 1];
      if (st.endMode === 'fixed') {
        ctx.save();
        // Steel post + clamp
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(endX + 4, centerY - 36, 14, 72, 4);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(endX - 6, centerY - 11, 20, 22, 4);
        ctx.fill();
        ctx.restore();
      } else if (st.endMode === 'loose') {
        ctx.save();
        // Vertical frictionless metal rod
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(endX + 6, centerY - 1.55 * pxPerCmY);
        ctx.lineTo(endX + 6, centerY + 1.55 * pxPerCmY);
        ctx.stroke();

        // Sliding ring around pole attached to last bead
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 3.5;
        ctx.fillStyle = '#d1fae5';
        ctx.beginPath();
        ctx.ellipse(endX + 6, pEnd.y, 11, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(pEnd.x, pEnd.y);
        ctx.lineTo(endX - 4, pEnd.y);
        ctx.stroke();
        ctx.restore();
      }

      // ============================================================
      // DRAGGABLE CM RULERS (Horizontal & Vertical)
      // ============================================================
      if (st.showRulers) {
        // Horizontal 0 - 7.5 cm ruler
        const hr = hRulerPosRef.current;
        const hLen = 7.5 * pxPerCmX;
        ctx.save();
        ctx.fillStyle = 'rgba(254, 249, 195, 0.92)';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(hr.x, hr.y, hLen, 34, 6);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#713f12';
        ctx.fillStyle = '#713f12';
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';

        for (let mm = 0; mm <= 75; mm += 2) {
          const cm = mm / 10;
          const tx = hr.x + cm * pxPerCmX;
          const isMajor = mm % 10 === 0;
          const tickH = isMajor ? 11 : 6;
          ctx.lineWidth = isMajor ? 1.4 : 0.9;
          ctx.beginPath();
          ctx.moveTo(tx, hr.y);
          ctx.lineTo(tx, hr.y + tickH);
          ctx.stroke();
          if (isMajor) {
            ctx.fillText(`${cm.toFixed(0)}`, tx, hr.y + 22);
          }
        }
        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.fillText('cm', hr.x + hLen - 14, hr.y + 24);
        ctx.restore();

        // Vertical cm ruler (-1.5 to +1.5 cm, total 3.0 cm span)
        const vr = vRulerPosRef.current;
        const vLen = 3.0 * pxPerCmY;
        ctx.save();
        ctx.fillStyle = 'rgba(254, 249, 195, 0.92)';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(vr.x, vr.y, 40, vLen, 6);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#713f12';
        ctx.fillStyle = '#713f12';
        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        for (let step = 0; step <= 30; step += 2) {
          const cmVal = 1.5 - step / 10;
          const ty = vr.y + (step / 10) * pxPerCmY;
          const isMajor = step % 5 === 0;
          ctx.lineWidth = isMajor ? 1.4 : 0.9;
          ctx.beginPath();
          ctx.moveTo(vr.x, ty);
          ctx.lineTo(vr.x + (isMajor ? 10 : 5), ty);
          ctx.stroke();
          if (step % 10 === 0 || Math.abs(cmVal) < 0.01) {
            ctx.fillText(`${cmVal.toFixed(1)}`, vr.x + 34, ty);
          }
        }
        ctx.restore();
      }

      if (now - lastTelemetryPush > 55) {
        lastTelemetryPush = now;
        onTelemetry({
          m4SourceY: yCur[0],
          m4MidY: yCur[Math.floor((NUM_BEADS - 1) / 2)],
          m4EndY: yCur[NUM_BEADS - 1],
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

  // Interactive Pointer Dragging for Wrench, Rulers, and Reference Line
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { startX, endX, centerY, pxPerCmY, pxPerCmX, H } = layoutRef.current;

    // 1. Check Reference Line drag
    if (state.showRefLine) {
      const refY = Math.max(44, Math.min(H - 44, centerY + refLineYOffsetPxRef.current));
      if (Math.abs(y - refY) <= 12 && x >= startX - 20 && x <= endX + 16) {
        dragTargetRef.current = 'refLine';
        dragOffsetRef.current = { dx: 0, dy: y - refY };
        canvas.setPointerCapture(e.pointerId);
        return;
      }
    }

    // 2. Check Vertical Ruler drag
    if (state.showRulers) {
      const vr = vRulerPosRef.current;
      const vLen = 3.0 * pxPerCmY;
      if (x >= vr.x && x <= vr.x + 40 && y >= vr.y && y <= vr.y + vLen) {
        dragTargetRef.current = 'vRuler';
        dragOffsetRef.current = { dx: x - vr.x, dy: y - vr.y };
        canvas.setPointerCapture(e.pointerId);
        return;
      }

      // 3. Check Horizontal Ruler drag
      const hr = hRulerPosRef.current;
      const hLen = 7.5 * pxPerCmX;
      if (x >= hr.x && x <= hr.x + hLen && y >= hr.y && y <= hr.y + 34) {
        dragTargetRef.current = 'hRuler';
        dragOffsetRef.current = { dx: x - hr.x, dy: y - hr.y };
        canvas.setPointerCapture(e.pointerId);
        return;
      }
    }

    // 4. Check Wrench drag in Manual mode
    if (state.sourceMode === 'manual' && x <= startX + 70) {
      dragTargetRef.current = 'wrench';
      canvas.setPointerCapture(e.pointerId);
      const yCm = Math.max(-1.25, Math.min(1.25, (centerY - y) / pxPerCmY));
      manualYCmRef.current = yCm;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const target = dragTargetRef.current;
    if (!target) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { centerY, pxPerCmY, W, H } = layoutRef.current;

    if (target === 'wrench') {
      const yCm = Math.max(-1.25, Math.min(1.25, (centerY - y) / pxPerCmY));
      manualYCmRef.current = yCm;
    } else if (target === 'refLine') {
      const clampedY = Math.max(44, Math.min(H - 44, y - dragOffsetRef.current.dy));
      refLineYOffsetPxRef.current = clampedY - centerY;
    } else if (target === 'hRuler') {
      hRulerPosRef.current = {
        x: Math.max(10, Math.min(W - 180, x - dragOffsetRef.current.dx)),
        y: Math.max(10, Math.min(H - 40, y - dragOffsetRef.current.dy)),
      };
    } else if (target === 'vRuler') {
      vRulerPosRef.current = {
        x: Math.max(10, Math.min(W - 48, x - dragOffsetRef.current.dx)),
        y: Math.max(10, Math.min(H - 120, y - dragOffsetRef.current.dy)),
      };
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragTargetRef.current = null;
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };

  const bannerHint =
    state.sourceMode === 'manual'
      ? t.m4.wrenchHint
      : state.sourceMode === 'oscillate'
      ? t.m4.oscillateHint
      : t.m4.pulseHint;

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Top interactive action strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-sky-50 border border-sky-200 rounded-xl px-3.5 py-2 text-xs text-slate-900">
        <div className="flex items-center gap-2 font-medium">
          <Waves className="w-4 h-4 text-sky-700 shrink-0" />
          <span>{bannerHint}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {state.sourceMode === 'pulse' && (
            <button
              type="button"
              onClick={triggerPulse}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.m4.sendPulse}</span>
            </button>
          )}
          <button
            type="button"
            onClick={calmString}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-sky-100 border border-sky-200 text-slate-800 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>{t.m4.resetString}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Stage */}
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
          className="absolute inset-0 block w-full h-full touch-none cursor-grab active:cursor-grabbing"
        />

        {/* Floating Interactive Stopwatch Overlay */}
        {state.showTimer && (
          <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-sm border border-sky-200 rounded-xl shadow-sm p-2.5 flex items-center gap-2.5">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {t.m4.stopwatchTitle}
              </div>
              <div className="font-mono tabular-nums text-base font-extrabold text-slate-950">
                {timerSeconds.toFixed(2)} <span className="text-xs font-semibold text-slate-500">s</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTimerRunning((r) => !r)}
                className={`p-1.5 rounded-lg text-white transition-colors cursor-pointer ${
                  timerRunning ? 'bg-slate-900 hover:bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
                aria-label={timerRunning ? t.actions.pause : t.actions.play}
              >
                {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  timerAccumRef.current = 0;
                  setTimerSeconds(0);
                }}
                className="p-1.5 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-slate-700 transition-colors cursor-pointer"
                aria-label={t.actions.reset}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {(state.showRulers || state.showRefLine) && (
          <div className="pointer-events-none absolute bottom-2.5 left-3 z-10 bg-white/85 border border-sky-200 rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-600">
            {t.m4.dragRulerHint}
          </div>
        )}
      </div>
    </div>
  );
};
