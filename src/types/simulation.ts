export type Language = 'bn' | 'en';

export type ModuleId = 1 | 2 | 3 | 4;

export type Module1ViewMode = 'dual' | 'transverse' | 'longitudinal';
export type Module1SourceMode = 'continuous' | 'pulse';

export interface Module1State {
  frequency: number; // 0.5 to 5.0 Hz
  wavelength: number; // 1.0 to 6.0 m
  amplitude: number; // 0.1 to 1.5 m
  viewMode: Module1ViewMode;
  sourceMode: Module1SourceMode;
  highlightMarkers: boolean;
  showVectors: boolean;
  showWavelengthRuler: boolean;
}

export type Module2SubMode = 'energy' | 'em3d';

export interface Module2State {
  subMode: Module2SubMode;
  frequency: number; // 0.5 to 5.0 Hz
  wavelength: number; // 1.0 to 6.0 m
  amplitude: number; // 0.1 to 1.5 m
  vacuumMode: boolean;
  showEPlane: boolean;
  showBPlane: boolean;
}

export type MediumPresetId = 'air' | 'water' | 'steel' | 'light_cord' | 'heavy_cord' | 'custom';

export interface Module3State {
  medium1Preset: MediumPresetId;
  medium2Preset: MediumPresetId;
  v1: number; // m/s
  v2: number; // m/s
  frequency: number; // 1.0 to 10.0 Hz
  showReflection: boolean;
  showComponents: boolean;
}

export type Module4SourceMode = 'manual' | 'oscillate' | 'pulse';
export type Module4EndMode = 'fixed' | 'loose' | 'none';
export type Module4Tension = 'low' | 'medium' | 'high';

export interface Module4State {
  sourceMode: Module4SourceMode;
  endMode: Module4EndMode;
  amplitude: number; // 0.00 to 1.25 cm
  frequency: number; // 0.10 to 3.00 Hz
  pulseWidth: number; // 0.20 to 1.00 s
  damping: number; // 0 to 100 %
  tension: Module4Tension;
  showRulers: boolean;
  showTimer: boolean;
  showRefLine: boolean;
}

export interface LiveTelemetry {
  // Module 1 live values
  m1TransverseY: number;
  m1TransverseVy: number;
  m1LongitudinalX: number;
  m1LongitudinalVx: number;
  // Module 2 live values
  m2InstantE: number;
  m2InstantB: number;
  // Module 3 live values
  m3CrestsCrossed: number;
  m3BoundaryY: number;
  // Module 4 live values
  m4SourceY: number;
  m4MidY: number;
  m4EndY: number;
}
