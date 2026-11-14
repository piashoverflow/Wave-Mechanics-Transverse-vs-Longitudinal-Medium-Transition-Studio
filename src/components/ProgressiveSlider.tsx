import React from 'react';

interface ProgressiveSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  precision?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export const ProgressiveSlider: React.FC<ProgressiveSliderProps> = ({
  id,
  label,
  value,
  min,
  max,
  step,
  unit = '',
  precision = 1,
  disabled = false,
  onChange,
}) => {
  const clamped = Math.min(max, Math.max(min, value));
  const pct = max > min ? ((clamped - min) / (max - min)) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="text-xs font-semibold text-slate-800 leading-tight"
        >
          {label}
        </label>
        <span className="font-mono tabular-nums text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md whitespace-nowrap">
          {value.toFixed(precision)}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamped}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="emerald-slider"
        style={{
          background: `linear-gradient(to right, #059669 0%, #059669 ${pct}%, #d1fae5 ${pct}%, #d1fae5 100%)`,
        }}
      />
      <div className="flex justify-between text-[10px] font-mono tabular-nums text-slate-400">
        <span>
          {min}
          {unit ? ` ${unit}` : ''}
        </span>
        <span>
          {max}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
    </div>
  );
};
