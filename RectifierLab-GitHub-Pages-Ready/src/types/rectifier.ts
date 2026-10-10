/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PhaseType = '1-phase' | '3-phase';

export type ConverterType = 'full-bridge' | 'half-wave' | 'center-tapped';

export type LoadType = 'R' | 'RL' | 'RLE' | 'constant-current';

export type DeviceType = 'diode' | 'thyristor';

export type QuickDevicePreset = 'all-diodes' | 'all-thyristors' | 'semi-converter' | 'custom';

export type WaveformViewMode = 'superimposed' | 'oscilloscope' | 'harmonics';

export interface ConverterConfig {
  phase: PhaseType;
  topology: ConverterType;
  firingAngle: number; // in degrees (0 to 180)
  hasFreewheelingDiode: boolean;
  forwardVoltageDrop: number; // V_F (e.g. 0.8V to 1.5V)
  
  // Custom switch assignments: array of device types
  // For 1-phase bridge: [T1, T2, T3, T4]
  // For 3-phase bridge: [T1, T3, T5, T4, T6, T2] (top: T1, T3, T5; bottom: T4, T6, T2)
  // For half-wave 1-phase: [T1]
  // For half-wave 3-phase: [T1, T2, T3]
  switches: DeviceType[];

  // Source parameters
  sourceRms: number; // Volts (phase RMS for 1-ph, line-to-line RMS for 3-ph)
  frequency: number; // Hz (50 or 60)
  sourceInductanceLs: number; // mH (0 = bypassed)
  
  // Load parameters
  loadType: LoadType;
  resistance: number; // Ohms
  inductance: number; // mH
  backEmf: number; // Volts (for RLE load, e.g. battery or DC motor)
  constantCurrentIdc: number; // Amperes (for constant current load)
}

export interface SimulationPoint {
  t: number; // seconds
  wtDeg: number; // degrees (0 to 360, or up to 720)
  
  // AC Source voltages
  vA: number;
  vB?: number;
  vC?: number;
  vAB?: number;
  vBC?: number;
  vCA?: number;
  
  // Output waveforms
  vOut: number; // Load voltage with component voltage drops
  vOutIdeal: number; // Ideal load voltage without drop
  iOut: number; // Load current
  
  // AC Input line currents
  iSourceA: number; // Phase A source current
  iSourceB?: number;
  iSourceC?: number;

  // Freewheeling diode current
  iFwd: number;

  // Active conducting devices at this instant
  activeSwitches: string[];
  isCommutating: boolean;
  totalDrop: number; // Sum of forward drops across active devices
  gateTriggered: string[]; // Switches receiving gate pulse
}

export interface HarmonicItem {
  order: number;
  freq: number;
  vMag: number;
  vPhase: number;
  vPercent: number;
  iMag: number;
  iPercent: number;
}

export interface SimulationResult {
  points: SimulationPoint[];
  
  // Scalar performance metrics
  vDcAvg: number;
  vRms: number;
  iDcAvg: number;
  iRms: number;
  pLoad: number; // Active power delivered to load (W)
  sIn: number; // Apparent input power (VA)
  powerFactor: number; // PF = P / S
  displacementFactor: number; // cos(phi_1)
  distortionFactor: number;
  rippleFactor: number; // RF
  formFactor: number; // FF
  crestFactor: number; // CF
  sourceThdCurrent: number; // THD_i in %
  isContinuous: boolean; // Continuous Conduction Mode (CCM) vs Discontinuous (DCM)
  
  // Analytical theoretical values
  idealVdcTheory: number;
  theoreticalFormula: string;
  theoreticalSubtitle: string;
  commutationOverlapDeg: number; // Overlap angle mu in degrees
  overlapVoltageDrop: number; // Delta V due to Ls
  semiconductorLossWatts: number; // Conduction loss in switches
  extinctionAngleDeg?: number; // Beta in degrees for DCM
  conductionAngleDeg?: number; // Gamma in degrees
  efficiency: number; // %
  rectificationRatio: number; // %
  tuf: number; // Transformer Utilization Factor
  
  // FFT Harmonics
  harmonics: HarmonicItem[];
}
