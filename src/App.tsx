import { useCallback, useRef, useState } from 'react';
import { TopNav } from './components/TopNav';
import { ControlSidebar } from './components/ControlSidebar';
import { TelemetryPanel } from './components/TelemetryPanel';
import { Module1Stage } from './components/Module1Stage';
import { Module2Stage } from './components/Module2Stage';
import { Module3Stage } from './components/Module3Stage';
import { Module4Stage } from './components/Module4Stage';
import {
  Language,
  LiveTelemetry,
  Module1State,
  Module2State,
  Module3State,
  Module4State,
  ModuleId,
} from './types/simulation';

const DEFAULT_M1: Module1State = {
  frequency: 1.4,
  wavelength: 3.0,
  amplitude: 0.9,
  viewMode: 'dual',
  sourceMode: 'continuous',
  highlightMarkers: true,
  showVectors: true,
  showWavelengthRuler: true,
};

const DEFAULT_M2: Module2State = {
  subMode: 'energy',
  frequency: 1.0,
  wavelength: 3.0,
  amplitude: 0.5,
  vacuumMode: false,
  showEPlane: true,
  showBPlane: true,
};

const DEFAULT_M3: Module3State = {
  medium1Preset: 'air',
  medium2Preset: 'water',
  v1: 340,
  v2: 1480,
  frequency: 2.4,
  showReflection: false,
  showComponents: true,
};

const DEFAULT_M4: Module4State = {
  sourceMode: 'oscillate',
  endMode: 'fixed',
  amplitude: 0.75,
  frequency: 1.5,
  pulseWidth: 0.5,
  damping: 10,
  tension: 'high',
  showRulers: false,
  showTimer: false,
  showRefLine: false,
};

const DEFAULT_TELEMETRY: LiveTelemetry = {
  m1TransverseY: 0,
  m1TransverseVy: 0,
  m1LongitudinalX: 0,
  m1LongitudinalVx: 0,
  m2InstantE: 0,
  m2InstantB: 0,
  m3CrestsCrossed: 0,
  m3BoundaryY: 0,
  m4SourceY: 0,
  m4MidY: 0,
  m4EndY: 0,
};

export default function App() {
  const [lang, setLang] = useState<Language>('bn');
  const [activeModule, setActiveModule] = useState<ModuleId>(1);

  const [m1, setM1] = useState<Module1State>(DEFAULT_M1);
  const [m2, setM2] = useState<Module2State>(DEFAULT_M2);
  const [m3, setM3] = useState<Module3State>(DEFAULT_M3);
  const [m4, setM4] = useState<Module4State>(DEFAULT_M4);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.5);
  const [stepSignal, setStepSignal] = useState<number>(0);
  const [pulseRequest, setPulseRequest] = useState<{ nonce: number; kind: 'full' | 'crest' }>({
    nonce: 0,
    kind: 'full',
  });
  const [m4PulseNonce, setM4PulseNonce] = useState<number>(0);
  const [m4CalmNonce, setM4CalmNonce] = useState<number>(0);
  const [telemetry, setTelemetry] = useState<LiveTelemetry>(DEFAULT_TELEMETRY);

  const simTimeRef = useRef<number>(0);

  const handleTelemetry = useCallback((patch: Partial<LiveTelemetry>) => {
    setTelemetry((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleReset = useCallback(() => {
    simTimeRef.current = 0;
    setIsPlaying(true);
    setPlaybackSpeed(0.5);
    setTelemetry(DEFAULT_TELEMETRY);
    if (activeModule === 1) {
      setM1(DEFAULT_M1);
    } else if (activeModule === 2) {
      setM2(DEFAULT_M2);
    } else if (activeModule === 3) {
      setM3(DEFAULT_M3);
    } else {
      setM4(DEFAULT_M4);
      setM4CalmNonce((n) => n + 1);
    }
  }, [activeModule]);

  const handleToggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === 'bn' ? 'en' : 'bn';
      document.documentElement.lang = next;
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-sky-50 text-slate-950">
      <TopNav
        lang={lang}
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onToggleLang={handleToggleLang}
        onReset={handleReset}
      />

      <main className="flex-1 w-full max-w-[1680px] mx-auto p-4 lg:p-5 flex flex-col lg:flex-row items-stretch gap-4">
        {/* Left Vertical Sidebar (340px on desktop) */}
        <ControlSidebar
          lang={lang}
          activeModule={activeModule}
          m1={m1}
          setM1={setM1}
          m2={m2}
          setM2={setM2}
          m3={m3}
          setM3={setM3}
          m4={m4}
          setM4={setM4}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onStep={() => setStepSignal((s) => s + 1)}
          playbackSpeed={playbackSpeed}
          onChangeSpeed={setPlaybackSpeed}
          onLaunchPulse={(kind) =>
            setPulseRequest((prev) => ({ nonce: prev.nonce + 1, kind }))
          }
          onLaunchM4Pulse={() => setM4PulseNonce((n) => n + 1)}
        />

        {/* Center Canvas Stage (Flexible width) */}
        <section
          aria-label="Interactive Simulation Stage"
          className="flex-1 min-w-0 flex flex-col"
        >
          {activeModule === 1 && (
            <Module1Stage
              lang={lang}
              state={m1}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
              simTimeRef={simTimeRef}
              stepSignal={stepSignal}
              pulseRequest={pulseRequest}
              onTelemetry={handleTelemetry}
            />
          )}
          {activeModule === 2 && (
            <Module2Stage
              lang={lang}
              state={m2}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
              simTimeRef={simTimeRef}
              stepSignal={stepSignal}
              onTelemetry={handleTelemetry}
            />
          )}
          {activeModule === 3 && (
            <Module3Stage
              lang={lang}
              state={m3}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
              simTimeRef={simTimeRef}
              stepSignal={stepSignal}
              onTelemetry={handleTelemetry}
            />
          )}
          {activeModule === 4 && (
            <Module4Stage
              lang={lang}
              state={m4}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
              simTimeRef={simTimeRef}
              stepSignal={stepSignal}
              pulseNonce={m4PulseNonce}
              calmNonce={m4CalmNonce}
              onTelemetry={handleTelemetry}
            />
          )}
        </section>

        {/* Right Telemetry Panel (330px on desktop) */}
        <TelemetryPanel
          lang={lang}
          activeModule={activeModule}
          m1={m1}
          m2={m2}
          m3={m3}
          m4={m4}
          telemetry={telemetry}
        />
      </main>
    </div>
  );
}
