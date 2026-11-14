import React from 'react';
import { Pause, Play, SkipForward, Sparkles, Sliders } from 'lucide-react';
import {
  Language,
  MediumPresetId,
  Module1State,
  Module2State,
  Module3State,
  Module4State,
  ModuleId,
} from '../types/simulation';
import { MEDIUM_PRESETS, TRANSLATIONS } from '../i18n/translations';
import { ProgressiveSlider } from './ProgressiveSlider';

interface ControlSidebarProps {
  lang: Language;
  activeModule: ModuleId;
  m1: Module1State;
  setM1: React.Dispatch<React.SetStateAction<Module1State>>;
  m2: Module2State;
  setM2: React.Dispatch<React.SetStateAction<Module2State>>;
  m3: Module3State;
  setM3: React.Dispatch<React.SetStateAction<Module3State>>;
  m4: Module4State;
  setM4: React.Dispatch<React.SetStateAction<Module4State>>;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  playbackSpeed: number;
  onChangeSpeed: (s: number) => void;
  onLaunchPulse: (kind: 'full' | 'crest') => void;
  onLaunchM4Pulse: () => void;
}

export const ControlSidebar: React.FC<ControlSidebarProps> = ({
  lang,
  activeModule,
  m1,
  setM1,
  m2,
  setM2,
  m3,
  setM3,
  m4,
  setM4,
  isPlaying,
  onTogglePlay,
  onStep,
  playbackSpeed,
  onChangeSpeed,
  onLaunchPulse,
  onLaunchM4Pulse,
}) => {
  const t = TRANSLATIONS[lang];

  const handleMediumPreset = (which: 1 | 2, preset: MediumPresetId) => {
    if (preset === 'custom') {
      setM3((prev) => ({
        ...prev,
        [which === 1 ? 'medium1Preset' : 'medium2Preset']: 'custom',
      }));
      return;
    }
    const speed = MEDIUM_PRESETS[preset].speed;
    setM3((prev) => ({
      ...prev,
      [which === 1 ? 'medium1Preset' : 'medium2Preset']: preset,
      [which === 1 ? 'v1' : 'v2']: speed,
    }));
  };

  return (
    <aside className="w-full lg:w-[340px] shrink-0 flex flex-col gap-4">
      <div className="bg-white/95 backdrop-blur-sm border border-sky-200 shadow-sm rounded-2xl p-4 space-y-5">
        <div className="flex items-center justify-between border-b border-sky-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-700" />
            <h2 className="text-sm font-bold text-slate-950">{t.common.controlsTitle}</h2>
          </div>
        </div>

        {/* ================= MODULE 1 CONTROLS ================= */}
        {activeModule === 1 && (
          <div className="space-y-4">
            <ProgressiveSlider
              id="m1-freq"
              label={t.common.frequency}
              value={m1.frequency}
              min={0.5}
              max={5.0}
              step={0.1}
              unit={t.common.hz}
              precision={1}
              onChange={(frequency) => setM1((prev) => ({ ...prev, frequency }))}
            />
            <ProgressiveSlider
              id="m1-lambda"
              label={t.common.wavelength}
              value={m1.wavelength}
              min={1.0}
              max={6.0}
              step={0.1}
              unit={t.common.m}
              precision={1}
              onChange={(wavelength) => setM1((prev) => ({ ...prev, wavelength }))}
            />
            <ProgressiveSlider
              id="m1-amp"
              label={t.common.amplitude}
              value={m1.amplitude}
              min={0.1}
              max={1.5}
              step={0.05}
              unit={t.common.m}
              precision={2}
              onChange={(amplitude) => setM1((prev) => ({ ...prev, amplitude }))}
            />

            {/* Source Mode */}
            <div className="space-y-1.5 pt-1">
              <span className="block text-xs font-semibold text-slate-800">{t.m1.sourceMode}</span>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-sky-50 border border-sky-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setM1((prev) => ({ ...prev, sourceMode: 'continuous' }))}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    m1.sourceMode === 'continuous'
                      ? 'bg-sky-700 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  {t.m1.continuous}
                </button>
                <button
                  type="button"
                  onClick={() => setM1((prev) => ({ ...prev, sourceMode: 'pulse' }))}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    m1.sourceMode === 'pulse'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  {t.m1.singlePulse}
                </button>
              </div>
              {m1.sourceMode === 'pulse' && (
                <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => onLaunchPulse('full')}
                    className="inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-2 rounded-xl text-[11px] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.actions.launchFullWave}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onLaunchPulse('crest')}
                    className="inline-flex items-center justify-center gap-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-2 rounded-xl text-[11px] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>{t.actions.launchCrestPulse}</span>
                  </button>
                </div>
              )}
            </div>

            {/* View Mode */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-800">{t.m1.viewMode}</span>
              <div className="grid grid-cols-1 gap-1.5">
                {(
                  [
                    ['dual', t.m1.dualView],
                    ['transverse', t.m1.transverseOnly],
                    ['longitudinal', t.m1.longitudinalOnly],
                  ] as const
                ).map(([modeKey, modeLabel]) => (
                  <button
                    key={modeKey}
                    type="button"
                    onClick={() => setM1((prev) => ({ ...prev, viewMode: modeKey }))}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                      m1.viewMode === modeKey
                        ? 'bg-sky-50 border-sky-500 text-sky-900'
                        : 'bg-white border-sky-200 text-slate-700 hover:bg-sky-50/50'
                    }`}
                  >
                    {modeLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Aids */}
            <div className="space-y-2 pt-1 border-t border-sky-100">
              <span className="block text-xs font-semibold text-slate-800">{t.m1.visualAids}</span>
              <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={m1.highlightMarkers}
                  onChange={(e) => setM1((prev) => ({ ...prev, highlightMarkers: e.target.checked }))}
                  className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                />
                <span>{t.m1.highlightMarkers}</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={m1.showVectors}
                  onChange={(e) => setM1((prev) => ({ ...prev, showVectors: e.target.checked }))}
                  className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                />
                <span>{t.m1.showVectors}</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={m1.showWavelengthRuler}
                  onChange={(e) =>
                    setM1((prev) => ({ ...prev, showWavelengthRuler: e.target.checked }))
                  }
                  className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                />
                <span>{t.m1.showRuler}</span>
              </label>
            </div>
          </div>
        )}

        {/* ================= MODULE 2 CONTROLS ================= */}
        {activeModule === 2 && (
          <div className="space-y-4">
            {/* Sub-Mode Switcher */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-800">{t.m2.modeSwitcher}</span>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-sky-50 border border-sky-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setM2((prev) => ({ ...prev, subMode: 'energy' }))}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    m2.subMode === 'energy'
                      ? 'bg-sky-700 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  {t.m2.energyMode}
                </button>
                <button
                  type="button"
                  onClick={() => setM2((prev) => ({ ...prev, subMode: 'em3d' }))}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    m2.subMode === 'em3d'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  {t.m2.emMode}
                </button>
              </div>
            </div>

            {/* Vacuum Toggle */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-800">
                {t.m2.mediumCondition}
              </span>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-sky-50 border border-sky-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setM2((prev) => ({ ...prev, vacuumMode: false }))}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    !m2.vacuumMode
                      ? 'bg-sky-700 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  {t.m2.mediumPresent}
                </button>
                <button
                  type="button"
                  onClick={() => setM2((prev) => ({ ...prev, vacuumMode: true }))}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    m2.vacuumMode
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  {t.m2.vacuumMode}
                </button>
              </div>
            </div>

            <ProgressiveSlider
              id="m2-freq"
              label={t.common.frequency}
              value={m2.frequency}
              min={0.5}
              max={5.0}
              step={0.1}
              unit={t.common.hz}
              precision={1}
              onChange={(frequency) => setM2((prev) => ({ ...prev, frequency }))}
            />
            <ProgressiveSlider
              id="m2-lambda"
              label={t.common.wavelength}
              value={m2.wavelength}
              min={1.0}
              max={6.0}
              step={0.1}
              unit={t.common.m}
              precision={1}
              onChange={(wavelength) => setM2((prev) => ({ ...prev, wavelength }))}
            />
            <ProgressiveSlider
              id="m2-amp"
              label={t.common.amplitude}
              value={m2.amplitude}
              min={0.1}
              max={1.5}
              step={0.05}
              unit={t.common.m}
              precision={2}
              onChange={(amplitude) => setM2((prev) => ({ ...prev, amplitude }))}
            />

            {m2.subMode === 'energy' ? (
              <div className="space-y-2 pt-2 border-t border-sky-100">
                <span className="block text-xs font-semibold text-slate-800">
                  {t.m2.quickScalingTitle}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setM2((prev) => ({ ...prev, amplitude: 0.5, frequency: 1.0, vacuumMode: false }))
                    }
                    className="px-2.5 py-2 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-xs font-semibold text-slate-900 cursor-pointer"
                  >
                    {t.m2.presetBase}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setM2((prev) => ({ ...prev, amplitude: 1.0, frequency: 1.0, vacuumMode: false }))
                    }
                    className="px-2.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-900 cursor-pointer"
                  >
                    {t.m2.preset2A}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setM2((prev) => ({ ...prev, amplitude: 0.5, frequency: 2.0, vacuumMode: false }))
                    }
                    className="px-2.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-900 cursor-pointer"
                  >
                    {t.m2.preset2F}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setM2((prev) => ({ ...prev, amplitude: 1.0, frequency: 2.0, vacuumMode: false }))
                    }
                    className="px-2.5 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs font-semibold text-amber-900 cursor-pointer"
                  >
                    {t.m2.preset2Both}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-2 border-t border-sky-100">
                <span className="block text-xs font-semibold text-slate-800">
                  {t.m2.emVisualOptions}
                </span>
                <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={m2.showEPlane}
                    onChange={(e) => setM2((prev) => ({ ...prev, showEPlane: e.target.checked }))}
                    className="w-4 h-4 rounded accent-sky-600 cursor-pointer"
                  />
                  <span>{t.m2.showEPlane}</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={m2.showBPlane}
                    onChange={(e) => setM2((prev) => ({ ...prev, showBPlane: e.target.checked }))}
                    className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                  />
                  <span>{t.m2.showBPlane}</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* ================= MODULE 3 CONTROLS ================= */}
        {activeModule === 3 && (
          <div className="space-y-4">
            {/* Medium 1 Preset + Slider */}
            <div className="space-y-2 p-3 rounded-xl bg-sky-50/70 border border-sky-200">
              <label
                htmlFor="m3-preset1"
                className="block text-xs font-bold text-sky-900"
              >
                {t.m3.medium1Title}
              </label>
              <select
                id="m3-preset1"
                value={m3.medium1Preset}
                onChange={(e) => handleMediumPreset(1, e.target.value as MediumPresetId)}
                className="w-full rounded-lg border border-sky-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {(Object.keys(MEDIUM_PRESETS) as Exclude<MediumPresetId, 'custom'>[]).map((k) => (
                  <option key={k} value={k}>
                    {lang === 'bn' ? MEDIUM_PRESETS[k].bn : MEDIUM_PRESETS[k].en}
                  </option>
                ))}
                <option value="custom">{t.m3.customPreset}</option>
              </select>
              <ProgressiveSlider
                id="m3-v1"
                label={t.m3.medium1Speed}
                value={m3.v1}
                min={100}
                max={5000}
                step={20}
                unit={t.common.ms}
                precision={0}
                onChange={(v1) =>
                  setM3((prev) => ({ ...prev, v1, medium1Preset: 'custom' }))
                }
              />
            </div>

            {/* Medium 2 Preset + Slider */}
            <div className="space-y-2 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <label
                htmlFor="m3-preset2"
                className="block text-xs font-bold text-emerald-900"
              >
                {t.m3.medium2Title}
              </label>
              <select
                id="m3-preset2"
                value={m3.medium2Preset}
                onChange={(e) => handleMediumPreset(2, e.target.value as MediumPresetId)}
                className="w-full rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {(Object.keys(MEDIUM_PRESETS) as Exclude<MediumPresetId, 'custom'>[]).map((k) => (
                  <option key={k} value={k}>
                    {lang === 'bn' ? MEDIUM_PRESETS[k].bn : MEDIUM_PRESETS[k].en}
                  </option>
                ))}
                <option value="custom">{t.m3.customPreset}</option>
              </select>
              <ProgressiveSlider
                id="m3-v2"
                label={t.m3.medium2Speed}
                value={m3.v2}
                min={100}
                max={5000}
                step={20}
                unit={t.common.ms}
                precision={0}
                onChange={(v2) =>
                  setM3((prev) => ({ ...prev, v2, medium2Preset: 'custom' }))
                }
              />
            </div>

            {/* Locked Source Frequency */}
            <ProgressiveSlider
              id="m3-freq"
              label={t.m3.sourceFreqLocked}
              value={m3.frequency}
              min={1.0}
              max={10.0}
              step={0.2}
              unit={t.common.hz}
              precision={1}
              onChange={(frequency) => setM3((prev) => ({ ...prev, frequency }))}
            />

            {/* Boundary Reflection Toggles */}
            <div className="space-y-2 pt-1 border-t border-sky-100">
              <span className="block text-xs font-semibold text-slate-800">
                {t.m3.boundaryOptions}
              </span>
              <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={m3.showReflection}
                  onChange={(e) =>
                    setM3((prev) => ({ ...prev, showReflection: e.target.checked }))
                  }
                  className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                />
                <span>{t.m3.showReflection}</span>
              </label>
              {m3.showReflection && (
                <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer select-none pl-2">
                  <input
                    type="checkbox"
                    checked={m3.showComponents}
                    onChange={(e) =>
                      setM3((prev) => ({ ...prev, showComponents: e.target.checked }))
                    }
                    className="w-4 h-4 rounded accent-sky-600 cursor-pointer"
                  />
                  <span>{t.m3.showComponents}</span>
                </label>
              )}
            </div>
          </div>
        )}

        {/* ================= MODULE 4 CONTROLS (WAVE ON A STRING) ================= */}
        {activeModule === 4 && (
          <div className="space-y-4">
            {/* Source Driver Mode */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-800">{t.m4.sourceType}</span>
              <div className="grid grid-cols-3 gap-1 p-1 bg-sky-50 border border-sky-200 rounded-xl">
                {(
                  [
                    ['manual', t.m4.manual],
                    ['oscillate', t.m4.oscillate],
                    ['pulse', t.m4.pulse],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setM4((prev) => ({ ...prev, sourceMode: key }))}
                    className={`py-1.5 px-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer leading-tight ${
                      m4.sourceMode === key
                        ? 'bg-sky-700 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {m4.sourceMode === 'pulse' && (
                <button
                  type="button"
                  onClick={onLaunchM4Pulse}
                  className="w-full mt-1.5 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.m4.sendPulse}</span>
                </button>
              )}
            </div>

            {/* Right End Boundary Condition */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-800">{t.m4.endCondition}</span>
              <div className="grid grid-cols-3 gap-1 p-1 bg-sky-50 border border-sky-200 rounded-xl">
                {(
                  [
                    ['fixed', t.m4.fixedEnd],
                    ['loose', t.m4.looseEnd],
                    ['none', t.m4.noEnd],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setM4((prev) => ({ ...prev, endMode: key }))}
                    className={`py-1.5 px-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer leading-tight ${
                      m4.endMode === key
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <ProgressiveSlider
              id="m4-amp"
              label={t.m4.amplitudeCm}
              value={m4.amplitude}
              min={0.0}
              max={1.25}
              step={0.05}
              unit={t.m4.cm}
              precision={2}
              disabled={m4.sourceMode === 'manual'}
              onChange={(amplitude) => setM4((prev) => ({ ...prev, amplitude }))}
            />

            {m4.sourceMode === 'pulse' ? (
              <ProgressiveSlider
                id="m4-pulse-w"
                label={t.m4.pulseWidth}
                value={m4.pulseWidth}
                min={0.2}
                max={1.0}
                step={0.05}
                unit={t.common.s}
                precision={2}
                onChange={(pulseWidth) => setM4((prev) => ({ ...prev, pulseWidth }))}
              />
            ) : (
              <ProgressiveSlider
                id="m4-freq"
                label={t.common.frequency}
                value={m4.frequency}
                min={0.1}
                max={3.0}
                step={0.05}
                unit={t.common.hz}
                precision={2}
                disabled={m4.sourceMode === 'manual'}
                onChange={(frequency) => setM4((prev) => ({ ...prev, frequency }))}
              />
            )}

            <ProgressiveSlider
              id="m4-damp"
              label={t.m4.damping}
              value={m4.damping}
              min={0}
              max={100}
              step={5}
              unit="%"
              precision={0}
              onChange={(damping) => setM4((prev) => ({ ...prev, damping }))}
            />

            {/* Tension Selector */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-800">{t.m4.tension}</span>
              <div className="grid grid-cols-3 gap-1 p-1 bg-sky-50 border border-sky-200 rounded-xl">
                {(
                  [
                    ['low', t.m4.tensionLow],
                    ['medium', t.m4.tensionMedium],
                    ['high', t.m4.tensionHigh],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setM4((prev) => ({ ...prev, tension: key }))}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      m4.tension === key
                        ? 'bg-sky-700 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Measurement Tools */}
            <div className="space-y-2 pt-2 border-t border-sky-100">
              <span className="block text-xs font-semibold text-slate-800">{t.m4.toolsTitle}</span>
              <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={m4.showRulers}
                  onChange={(e) => setM4((prev) => ({ ...prev, showRulers: e.target.checked }))}
                  className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                />
                <span>{t.m4.showRulers}</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={m4.showTimer}
                  onChange={(e) => setM4((prev) => ({ ...prev, showTimer: e.target.checked }))}
                  className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                />
                <span>{t.m4.showTimer}</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={m4.showRefLine}
                  onChange={(e) => setM4((prev) => ({ ...prev, showRefLine: e.target.checked }))}
                  className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                />
                <span>{t.m4.showRefLine}</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Global Playback Dock */}
      <div className="bg-white/95 backdrop-blur-sm border border-sky-200 shadow-sm rounded-2xl p-4 space-y-3">
        <span className="block text-xs font-bold text-slate-900">{t.common.playbackTitle}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              isPlaying
                ? 'bg-slate-900 hover:bg-slate-800 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? t.actions.pause : t.actions.play}</span>
          </button>
          <button
            type="button"
            onClick={onStep}
            disabled={isPlaying}
            className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 disabled:opacity-45 disabled:cursor-not-allowed text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>{t.actions.step}</span>
          </button>
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-xs font-semibold text-slate-600">{t.actions.speed}</span>
          <div className="flex items-center gap-1 bg-sky-50 border border-sky-200 rounded-lg p-0.5">
            {[0.5, 1, 2].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => onChangeSpeed(spd)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                  playbackSpeed === spd
                    ? 'bg-sky-700 text-white'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                {spd}×
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
