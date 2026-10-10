/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConverterConfig } from '../types/rectifier';

export interface PresetConfig {
  id: string;
  name: string;
  category: '3-Phase' | '1-Phase' | 'Advanced Studies';
  description: string;
  config: ConverterConfig;
  highlights: string[];
}

export const LAB_PRESETS: PresetConfig[] = [
  {
    id: '3ph-semi-conv-rl',
    name: '3Φ Semi-Converter (Half-Controlled) with RL Load',
    category: '3-Phase',
    description:
      'The exact topology shown in the reference: 3 thyristors (T1, T3, T2) and 3 diodes (D5, D6, T4 as SCR) with R=20Ω, L=45mH, 230V RMS, α=45°.',
    highlights: [
      'Free-wheeling action prevents negative voltage',
      'Cost-effective industrial bridge converter',
      'Alpha = 45°, CCM continuous conduction',
    ],
    config: {
      phase: '3-phase',
      topology: 'full-bridge',
      firingAngle: 45,
      hasFreewheelingDiode: false,
      forwardVoltageDrop: 0.9,
      switches: ['thyristor', 'thyristor', 'diode', 'thyristor', 'diode', 'thyristor'],
      sourceRms: 230,
      frequency: 50,
      sourceInductanceLs: 0,
      loadType: 'RL',
      resistance: 20,
      inductance: 45,
      backEmf: 0,
      constantCurrentIdc: 19,
    },
  },
  {
    id: '3ph-fully-controlled-6pulse',
    name: '3Φ Fully Controlled 6-Pulse Converter',
    category: '3-Phase',
    description:
      'Standard industrial 6-SCR converter for high-power DC motor drives. Capable of 2-quadrant operation.',
    highlights: [
      'All 6 switches are thyristors (SCR)',
      '6 pulses per cycle, low ripple factor (RF = 0.04)',
      'High power capability, reversible DC voltage',
    ],
    config: {
      phase: '3-phase',
      topology: 'full-bridge',
      firingAngle: 30,
      hasFreewheelingDiode: false,
      forwardVoltageDrop: 1.1,
      switches: [
        'thyristor',
        'thyristor',
        'thyristor',
        'thyristor',
        'thyristor',
        'thyristor',
      ],
      sourceRms: 400,
      frequency: 50,
      sourceInductanceLs: 0,
      loadType: 'RL',
      resistance: 15,
      inductance: 80,
      backEmf: 0,
      constantCurrentIdc: 25,
    },
  },
  {
    id: '3ph-uncontrolled-diode-bridge',
    name: '3Φ Uncontrolled Diode Bridge Rectifier',
    category: '3-Phase',
    description:
      'Used in almost every variable frequency drive (VFD) front end. Fixed DC link voltage with 6 diodes.',
    highlights: [
      'Fixed alpha = 0° diode rectification',
      'Maximum average DC voltage V_dc = 1.35 * V_LL',
      'Negligible ripple without heavy capacitor filter',
    ],
    config: {
      phase: '3-phase',
      topology: 'full-bridge',
      firingAngle: 0,
      hasFreewheelingDiode: false,
      forwardVoltageDrop: 0.8,
      switches: ['diode', 'diode', 'diode', 'diode', 'diode', 'diode'],
      sourceRms: 400,
      frequency: 50,
      sourceInductanceLs: 0,
      loadType: 'RL',
      resistance: 10,
      inductance: 30,
      backEmf: 0,
      constantCurrentIdc: 35,
    },
  },
  {
    id: '1ph-controlled-bridge-rl',
    name: '1Φ Fully Controlled Bridge Converter (RL Load)',
    category: '1-Phase',
    description:
      'Classic 4-thyristor H-bridge converter. Shows negative excursion of voltage due to load inductance.',
    highlights: [
      'Four thyristors T1, T2, T3, T4',
      'Alpha = 60° firing delay',
      'Inductor stores energy and forces thyristors to stay on past 180°',
    ],
    config: {
      phase: '1-phase',
      topology: 'full-bridge',
      firingAngle: 60,
      hasFreewheelingDiode: false,
      forwardVoltageDrop: 1.0,
      switches: ['thyristor', 'thyristor', 'thyristor', 'thyristor'],
      sourceRms: 230,
      frequency: 50,
      sourceInductanceLs: 0,
      loadType: 'RL',
      resistance: 12,
      inductance: 50,
      backEmf: 0,
      constantCurrentIdc: 12,
    },
  },
  {
    id: '1ph-controlled-fwd',
    name: '1Φ Controlled Bridge with Freewheeling Diode (D_FW)',
    category: '1-Phase',
    description:
      'Demonstrates the effect of adding an external freewheeling diode across the inductive load to clamp voltage to 0V.',
    highlights: [
      'Prevents negative voltage notches',
      'Increases average output voltage V_dc',
      'Reduces reactive power drawn from AC grid',
    ],
    config: {
      phase: '1-phase',
      topology: 'full-bridge',
      firingAngle: 60,
      hasFreewheelingDiode: true,
      forwardVoltageDrop: 0.9,
      switches: ['thyristor', 'thyristor', 'thyristor', 'thyristor'],
      sourceRms: 230,
      frequency: 50,
      sourceInductanceLs: 0,
      loadType: 'RL',
      resistance: 12,
      inductance: 50,
      backEmf: 0,
      constantCurrentIdc: 15,
    },
  },
  {
    id: '1ph-battery-charger-rle',
    name: '1Φ Battery Charger (RLE Load, Discontinuous DCM)',
    category: '1-Phase',
    description:
      'Models charging a 60V battery pack through an R-L series filter. Clearly demonstrates DCM current pulses.',
    highlights: [
      'Back EMF E = 60V opposing the rectified voltage',
      'Conduction starts only when source exceeds E and gate fires',
      'Discontinuous conduction mode (DCM) characteristics',
    ],
    config: {
      phase: '1-phase',
      topology: 'full-bridge',
      firingAngle: 45,
      hasFreewheelingDiode: true,
      forwardVoltageDrop: 0.8,
      switches: ['thyristor', 'thyristor', 'thyristor', 'thyristor'],
      sourceRms: 120,
      frequency: 50,
      sourceInductanceLs: 0,
      loadType: 'RLE',
      resistance: 5,
      inductance: 15,
      backEmf: 60,
      constantCurrentIdc: 8,
    },
  },
  {
    id: 'commutation-overlap-study',
    name: 'Commutation Overlap & Notch Analysis (Ls = 2.5 mH)',
    category: 'Advanced Studies',
    description:
      'Source inductance causes overlap angle μ, deep voltage notches on line voltage, and reduces average DC output.',
    highlights: [
      'Source Inductance Ls = 2.5 mH active',
      'Simultaneous conduction of incoming and outgoing thyristors',
      'Real-time voltage dip calculation and waveform notches',
    ],
    config: {
      phase: '3-phase',
      topology: 'full-bridge',
      firingAngle: 30,
      hasFreewheelingDiode: false,
      forwardVoltageDrop: 1.0,
      switches: [
        'thyristor',
        'thyristor',
        'thyristor',
        'thyristor',
        'thyristor',
        'thyristor',
      ],
      sourceRms: 400,
      frequency: 50,
      sourceInductanceLs: 2.5,
      loadType: 'RL',
      resistance: 10,
      inductance: 60,
      backEmf: 0,
      constantCurrentIdc: 20,
    },
  },
  {
    id: 'inversion-mode-regeneration',
    name: 'Line-Commutated Inverter Mode (α = 120°, E = 180V)',
    category: 'Advanced Studies',
    description:
      'Firing angle α > 90° with a DC source aiding current. Demonstrates electric vehicle regenerative braking returning energy to AC grid.',
    highlights: [
      'Quadrant IV operation: V_dc is negative, current is positive',
      'Power flows from DC load into AC power network',
      'Requires active DC source E > |V_dc| to maintain conduction',
    ],
    config: {
      phase: '3-phase',
      topology: 'full-bridge',
      firingAngle: 120,
      hasFreewheelingDiode: false,
      forwardVoltageDrop: 1.2,
      switches: [
        'thyristor',
        'thyristor',
        'thyristor',
        'thyristor',
        'thyristor',
        'thyristor',
      ],
      sourceRms: 230,
      frequency: 50,
      sourceInductanceLs: 0.5,
      loadType: 'RLE',
      resistance: 8,
      inductance: 50,
      backEmf: 180,
      constantCurrentIdc: 15,
    },
  },
];
