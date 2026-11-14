import React from 'react';
import { Activity, CheckCircle2, Gauge, ShieldCheck } from 'lucide-react';
import {
  Language,
  LiveTelemetry,
  Module1State,
  Module2State,
  Module3State,
  Module4State,
  ModuleId,
} from '../types/simulation';
import { TRANSLATIONS } from '../i18n/translations';

interface TelemetryPanelProps {
  lang: Language;
  activeModule: ModuleId;
  m1: Module1State;
  m2: Module2State;
  m3: Module3State;
  m4: Module4State;
  telemetry: LiveTelemetry;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  lang,
  activeModule,
  m1,
  m2,
  m3,
  m4,
  telemetry,
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <aside className="w-full lg:w-[330px] shrink-0 flex flex-col gap-4">
      <div className="bg-white/95 backdrop-blur-sm border border-sky-200 shadow-sm rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-2 border-b border-sky-100 pb-3">
          <Gauge className="w-4 h-4 text-emerald-700" />
          <h2 className="text-sm font-bold text-slate-950">{t.common.telemetryTitle}</h2>
        </div>

        {/* ================= MODULE 1 TELEMETRY ================= */}
        {activeModule === 1 && (() => {
          const v = m1.frequency * m1.wavelength;
          const period = 1 / m1.frequency;
          const maxVy = 2 * Math.PI * m1.frequency * m1.amplitude;

          const transPct = Math.max(-100, Math.min(100, (telemetry.m1TransverseY / m1.amplitude) * 100));
          const longPct = Math.max(-100, Math.min(100, (telemetry.m1LongitudinalX / m1.amplitude) * 100));

          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                  <div className="text-[11px] font-semibold text-slate-600">{t.common.waveSpeed}</div>
                  <div className="font-mono tabular-nums text-lg font-extrabold text-sky-800 mt-0.5">
                    {v.toFixed(2)} <span className="text-xs font-semibold text-slate-500">{t.common.ms}</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 mt-0.5">v = f × λ</div>
                </div>
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                  <div className="text-[11px] font-semibold text-slate-600">{t.common.timePeriod}</div>
                  <div className="font-mono tabular-nums text-lg font-extrabold text-slate-900 mt-0.5">
                    {period.toFixed(3)} <span className="text-xs font-semibold text-slate-500">{t.common.s}</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 mt-0.5">T = 1 / f</div>
                </div>
              </div>

              {/* Crimson Marker Particle Kinematics */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-sky-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Activity className="w-3.5 h-3.5 text-rose-600" />
                  <span>{t.m1.particleProofTitle}</span>
                </div>

                {/* Transverse Particle Telemetry */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">{t.m1.particleDisplacementY}</span>
                    <span className="font-mono tabular-nums font-bold text-rose-700">
                      {telemetry.m1TransverseY >= 0 ? '+' : ''}
                      {telemetry.m1TransverseY.toFixed(2)} {t.common.m}
                    </span>
                  </div>
                  <div className="relative h-2 bg-sky-100 rounded-full overflow-hidden">
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400" />
                    <div
                      className="absolute top-0 bottom-0 bg-rose-500 rounded-full"
                      style={{
                        left: transPct >= 0 ? '50%' : `${50 + transPct * 0.5}%`,
                        width: `${Math.abs(transPct) * 0.5}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>{t.m1.particleVelocityVy}</span>
                    <span className="font-mono tabular-nums font-semibold">
                      {telemetry.m1TransverseVy >= 0 ? '+' : ''}
                      {telemetry.m1TransverseVy.toFixed(2)} {t.common.ms}
                    </span>
                  </div>
                </div>

                {/* Longitudinal Particle Telemetry */}
                <div className="space-y-1 pt-2 border-t border-sky-100">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">{t.m1.particleDisplacementX}</span>
                    <span className="font-mono tabular-nums font-bold text-rose-700">
                      {telemetry.m1LongitudinalX >= 0 ? '+' : ''}
                      {telemetry.m1LongitudinalX.toFixed(2)} {t.common.m}
                    </span>
                  </div>
                  <div className="relative h-2 bg-sky-100 rounded-full overflow-hidden">
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400" />
                    <div
                      className="absolute top-0 bottom-0 bg-emerald-600 rounded-full"
                      style={{
                        left: longPct >= 0 ? '50%' : `${50 + longPct * 0.5}%`,
                        width: `${Math.abs(longPct) * 0.5}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>{t.m1.particleVelocityVx}</span>
                    <span className="font-mono tabular-nums font-semibold">
                      {telemetry.m1LongitudinalVx >= 0 ? '+' : ''}
                      {telemetry.m1LongitudinalVx.toFixed(2)} {t.common.ms}
                    </span>
                  </div>
                </div>

                {/* Net Matter Transport Zero Proof */}
                <div className="pt-2 border-t border-sky-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-700">
                    {t.m1.netMatterTransport}
                  </span>
                  <span className="font-mono tabular-nums text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    0.00 {t.common.m}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 leading-relaxed">
                  v_max = ωA = <span className="font-mono font-semibold">{maxVy.toFixed(2)} m/s</span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed bg-sky-50/70 border border-sky-200 rounded-xl p-3">
                {t.m1.energyVsMatterNote}
              </p>
            </div>
          );
        })()}

        {/* ================= MODULE 2 TELEMETRY ================= */}
        {activeModule === 2 && (() => {
          const v = m2.frequency * m2.wavelength;
          const period = 1 / m2.frequency;
          const omega = 2 * Math.PI * m2.frequency;
          const k = (2 * Math.PI) / m2.wavelength;
          const ampFactor = Math.pow(m2.amplitude / 0.5, 2);
          const freqFactor = Math.pow(m2.frequency / 1.0, 2);
          const energyIndex = m2.vacuumMode && m2.subMode === 'energy' ? 0 : ampFactor * freqFactor;

          return (
            <div className="space-y-3.5">
              <div className="text-xs font-bold text-slate-900">{t.m2.formulaCardTitle}</div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                  <div className="text-[11px] font-semibold text-slate-600">{t.common.waveSpeed}</div>
                  <div className="font-mono tabular-nums text-base font-extrabold text-sky-800 mt-0.5">
                    {m2.subMode === 'em3d'
                      ? '3.00×10⁸'
                      : m2.vacuumMode
                      ? '0.00'
                      : v.toFixed(2)}{' '}
                    <span className="text-[11px] font-semibold text-slate-500">{t.common.ms}</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                    {m2.subMode === 'em3d' ? 'c = 1/√(μ₀ε₀)' : 'v = f · λ'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                  <div className="text-[11px] font-semibold text-slate-600">{t.common.timePeriod}</div>
                  <div className="font-mono tabular-nums text-base font-extrabold text-slate-900 mt-0.5">
                    {period.toFixed(3)}{' '}
                    <span className="text-[11px] font-semibold text-slate-500">{t.common.s}</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 mt-0.5">T = 1 / f</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-sky-200">
                  <div className="text-[11px] font-semibold text-slate-600">{t.common.angularFreq}</div>
                  <div className="font-mono tabular-nums text-base font-extrabold text-slate-900 mt-0.5">
                    {omega.toFixed(2)}{' '}
                    <span className="text-[10px] font-semibold text-slate-500">{t.common.rads}</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 mt-0.5">ω = 2πf</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-sky-200">
                  <div className="text-[11px] font-semibold text-slate-600">{t.common.waveNumber}</div>
                  <div className="font-mono tabular-nums text-base font-extrabold text-slate-900 mt-0.5">
                    {k.toFixed(2)}{' '}
                    <span className="text-[10px] font-semibold text-slate-500">{t.common.radm}</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 mt-0.5">k = 2π / λ</div>
                </div>
              </div>

              {/* Relative Energy Density Index */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-950">
                    {t.m2.relativeEnergyIndex}
                  </span>
                  <span className="font-mono tabular-nums text-base font-extrabold text-emerald-700">
                    {energyIndex.toFixed(2)}×
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white/90 border border-emerald-200 rounded-lg p-2">
                    <div className="text-slate-600">{t.m2.ampFactor}</div>
                    <div className="font-mono tabular-nums font-bold text-slate-900 mt-0.5">
                      {ampFactor.toFixed(2)}×
                    </div>
                  </div>
                  <div className="bg-white/90 border border-emerald-200 rounded-lg p-2">
                    <div className="text-slate-600">{t.m2.freqFactor}</div>
                    <div className="font-mono tabular-nums font-bold text-slate-900 mt-0.5">
                      {freqFactor.toFixed(2)}×
                    </div>
                  </div>
                </div>
              </div>

              {/* Mechanical vs EM Comparison */}
              <div className="p-3 rounded-xl bg-slate-50 border border-sky-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{t.m2.mechanicalWave}</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-md border text-[11px] ${
                      m2.vacuumMode
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-sky-50 text-sky-800 border-sky-200'
                    }`}
                  >
                    {t.m2.mediumRequired}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{t.m2.emWave}</span>
                  <span className="font-semibold px-2 py-0.5 rounded-md border bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px]">
                    {t.m2.noMediumNeeded}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ================= MODULE 3 TELEMETRY ================= */}
        {activeModule === 3 && (() => {
          const lam1 = m3.v1 / m3.frequency;
          const lam2 = m3.v2 / m3.frequency;
          const vRatio = m3.v1 / m3.v2;
          const lamRatio = lam1 / lam2;

          const phaseText =
            Math.abs(m3.v2 - m3.v1) < 1
              ? t.m3.phaseMatched
              : m3.v2 < m3.v1
              ? t.m3.phaseInversionPi
              : t.m3.phaseZero;

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900">{t.m3.comparisonTitle}</span>
                <span className="inline-flex items-center gap-1 bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[11px] whitespace-nowrap">
                  <ShieldCheck className="w-3 h-3" />
                  <span>f₁ = f₂ ({t.m3.invariantBadge})</span>
                </span>
              </div>

              {/* Side-by-Side Comparison Table */}
              <div className="overflow-hidden rounded-xl border border-sky-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-sky-50 border-b border-sky-200 text-slate-700">
                      <th className="py-2 px-2.5 font-bold">{t.m3.parameter}</th>
                      <th className="py-2 px-2 font-bold text-sky-800">{t.m3.medium1Col}</th>
                      <th className="py-2 px-2 font-bold text-emerald-800">{t.m3.medium2Col}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-100 bg-white">
                    <tr className="bg-emerald-50/40">
                      <td className="py-2.5 px-2.5 font-semibold text-slate-900">{t.m3.freqRow}</td>
                      <td className="py-2.5 px-2 font-mono tabular-nums font-bold text-emerald-700">
                        {m3.frequency.toFixed(1)} Hz
                      </td>
                      <td className="py-2.5 px-2 font-mono tabular-nums font-bold text-emerald-700">
                        {m3.frequency.toFixed(1)} Hz
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-2.5 font-semibold text-slate-800">{t.m3.speedRow}</td>
                      <td className="py-2.5 px-2 font-mono tabular-nums font-bold text-sky-800">
                        {m3.v1.toFixed(0)} m/s
                      </td>
                      <td className="py-2.5 px-2 font-mono tabular-nums font-bold text-emerald-800">
                        {m3.v2.toFixed(0)} m/s
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-2.5 font-semibold text-slate-800">{t.m3.wavelengthRow}</td>
                      <td className="py-2.5 px-2 font-mono tabular-nums font-bold text-sky-800">
                        {lam1.toFixed(2)} m
                      </td>
                      <td className="py-2.5 px-2 font-mono tabular-nums font-bold text-emerald-800">
                        {lam2.toFixed(2)} m
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Proportional Ratios */}
              <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 space-y-2">
                <div className="text-xs font-bold text-slate-900">{t.m3.ratiosTitle}</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">{t.m3.speedRatio}</span>
                  <span className="font-mono tabular-nums font-extrabold text-sky-800">
                    {vRatio.toFixed(3)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">{t.m3.wavelengthRatio}</span>
                  <span className="font-mono tabular-nums font-extrabold text-emerald-700">
                    {lamRatio.toFixed(3)}
                  </span>
                </div>
                <div className="pt-2 border-t border-sky-200 flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">{t.m3.crestsCrossed}</span>
                  <span className="font-mono tabular-nums font-bold text-slate-950">
                    {telemetry.m3CrestsCrossed}
                  </span>
                </div>
              </div>

              {/* Phase Shift Status */}
              <div className="p-3 rounded-xl bg-slate-50 border border-sky-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.m3.phaseShiftTitle}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{phaseText}</p>
              </div>
            </div>
          );
        })()}

        {/* ================= MODULE 4 TELEMETRY ================= */}
        {activeModule === 4 && (() => {
          const v = m4.tension === 'low' ? 1.5 : m4.tension === 'medium' ? 3.0 : 5.0;
          const period = m4.frequency > 0 ? 1 / m4.frequency : 0;
          const lambdaCm = m4.frequency > 0 ? v / m4.frequency : 0;

          const ruleText =
            m4.endMode === 'fixed'
              ? t.m4.fixedRule
              : m4.endMode === 'loose'
              ? t.m4.looseRule
              : t.m4.noEndRule;

          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                  <div className="text-[11px] font-semibold text-slate-600">{t.common.waveSpeed}</div>
                  <div className="font-mono tabular-nums text-lg font-extrabold text-sky-800 mt-0.5">
                    {v.toFixed(2)}{' '}
                    <span className="text-xs font-semibold text-slate-500">{t.m4.cms}</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 mt-0.5">v = √(T / μ)</div>
                </div>
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                  <div className="text-[11px] font-semibold text-slate-600">{t.common.wavelength}</div>
                  <div className="font-mono tabular-nums text-lg font-extrabold text-emerald-700 mt-0.5">
                    {lambdaCm.toFixed(2)}{' '}
                    <span className="text-xs font-semibold text-slate-500">{t.m4.cm}</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 mt-0.5">λ = v / f</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-sky-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{t.common.timePeriod}</span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {period.toFixed(3)} {t.common.s}
                </span>
              </div>

              {/* String Bead Positions */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-sky-200 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.m4.stringKinematicsTitle}</span>
                </div>

                {[
                  [t.m4.sourcePos, telemetry.m4SourceY],
                  [t.m4.midBeadPos, telemetry.m4MidY],
                  [t.m4.endBeadPos, telemetry.m4EndY],
                ].map(([label, val]) => {
                  const num = val as number;
                  const pct = Math.max(-100, Math.min(100, (num / 1.25) * 100));
                  return (
                    <div key={String(label)} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-slate-700">{label}</span>
                        <span className="font-mono tabular-nums font-bold text-sky-800">
                          {num >= 0 ? '+' : ''}
                          {num.toFixed(2)} {t.m4.cm}
                        </span>
                      </div>
                      <div className="relative h-2 bg-sky-100 rounded-full overflow-hidden">
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400" />
                        <div
                          className="absolute top-0 bottom-0 bg-emerald-600 rounded-full"
                          style={{
                            left: pct >= 0 ? '50%' : `${50 + pct * 0.5}%`,
                            width: `${Math.abs(pct) * 0.5}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* End Boundary Reflection Rule */}
              <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.m4.endBehaviorTitle}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{ruleText}</p>
              </div>
            </div>
          );
        })()}
      </div>
    </aside>
  );
};
