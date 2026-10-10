/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DerivationTopic {
  id: string;
  title: string;
  category: '1-phase' | '3-phase' | 'harmonics' | 'commutation';
  formula: string;
  summary: string;
  integralSteps: string[];
  rmsFormula: string;
  notes: string[];
}

export const DERIVATIONS_LIBRARY: DerivationTopic[] = [
  {
    id: '3ph-semi-converter',
    title: '3-Phase Semi-Converter (Half-Controlled Bridge)',
    category: '3-phase',
    formula: 'V_{dc} = \\frac{3 V_{mL}}{2\\pi} (1 + \\cos\\alpha)',
    summary:
      'Consists of 3 controlled thyristors in the top group and 3 uncontrolled diodes in the bottom group. When a phase voltage reverses, conduction naturally freewheels between the diode of that phase and the conducting thyristor, preventing output voltage from reversing.',
    integralSteps: [
      'Line-to-line voltage waveform repeats every 60° (pi/3 radians) with half-cycle symmetry.',
      'Integration interval for output voltage v_o(wt) with firing angle alpha: [pi/6 + alpha, 5pi/6 + alpha].',
      'Average DC Voltage: V_{dc} = \\frac{3}{\\pi} \\int_{\\pi/6 + \\alpha}^{\\pi/2} v_{ab}(\\omega t) d(\\omega t) + \\dots',
      'Substituting line voltage v_{LL}(wt) = \\sqrt{3} V_{mp} \\sin(wt + \\pi/6):',
      'V_{dc} = \\frac{3}{\\pi} \\int_{\\pi/6 + \\alpha}^{5\\pi/6} V_{mL} \\sin(\\omega t) d(\\omega t)',
      'Evaluating the integral: [-\\cos(\\omega t)]_{\\pi/6+\\alpha}^{5\\pi/6} = 1 + \\cos\\alpha',
      'Final Average DC Equation: V_{dc} = \\frac{3 V_{mL}}{2\\pi} (1 + \\cos\\alpha)',
    ],
    rmsFormula:
      'V_{rms} = V_{mL} \\sqrt{\\frac{3}{2\\pi} \\left( \\frac{2\\pi}{3} + \\frac{\\sqrt{3}}{2} \\cos 2\\alpha \\right)}',
    notes: [
      'Intrinsic Freewheeling: At alpha >= 60°, freewheeling action takes place directly across diode and thyristor pairs without requiring an external freewheeling diode.',
      'One-Quadrant Operation: Output voltage V_dc >= 0 always, preventing regenerative inversion mode.',
      'Input Power Factor is higher than fully controlled converter at low DC voltage outputs.',
    ],
  },
  {
    id: '3ph-full-controlled',
    title: '3-Phase Fully Controlled 6-Pulse Converter',
    category: '3-phase',
    formula: 'V_{dc} = \\frac{3 V_{mL}}{\\pi} \\cos\\alpha = \\frac{3\\sqrt{3} V_{mp}}{\\pi} \\cos\\alpha',
    summary:
      'Employs 6 thyristors (T1-T6) triggered in 60° increments. Allows two-quadrant operation: rectification mode for 0° <= alpha < 90°, and synchronous line inversion mode for 90° < alpha < 180° when loaded with an active DC source/back EMF.',
    integralSteps: [
      'Waveform has 6 pulses per supply period T. Conduction interval is pi/3 (60°).',
      'For firing angle alpha, conduction occurs from pi/3 + alpha to 2pi/3 + alpha.',
      'Average DC Voltage: V_{dc} = \\frac{1}{\\pi/3} \\int_{\\pi/3 + \\alpha}^{2\\pi/3 + \\alpha} V_{mL} \\sin(\\omega t) d(\\omega t)',
      'Integrating: V_{dc} = \\frac{3}{\\pi} \\left[ -V_{mL} \\cos(\\omega t) \\right]_{\\pi/3 + \\alpha}^{2\\pi/3 + \\alpha}',
      'Using trigonometric identities: \\cos(\\pi/3 + \\alpha) - \\cos(2\\pi/3 + \\alpha) = \\sqrt{3} \\sin(\\pi/2) \\cos\\alpha = \\cos\\alpha',
      'Result: V_{dc} = \\frac{3 V_{mL}}{\\pi} \\cos\\alpha',
    ],
    rmsFormula:
      'V_{rms} = V_{mL} \\sqrt{\\frac{1}{2} + \\frac{3\\sqrt{3}}{4\\pi} \\cos(2\\alpha)}',
    notes: [
      'Continuous current requires triggering pulses of duration > 60° or dual-pulse train.',
      'For alpha > 90°, V_dc becomes negative. If an external DC source (battery/motor) drives current in the positive direction, power flows from DC back to the AC grid (Inversion).',
    ],
  },
  {
    id: '1ph-full-bridge',
    title: 'Single-Phase Fully Controlled Full-Bridge Converter',
    category: '1-phase',
    formula: 'V_{dc} = \\frac{2 V_m}{\\pi} \\cos\\alpha',
    summary:
      'Features 4 thyristors (T1, T2 conducting on positive half cycle; T3, T4 on negative half cycle). In continuous conduction mode with inductive load, output voltage follows AC voltage into negative territory until the next thyristor pair is fired.',
    integralSteps: [
      'Output voltage waveform has periodicity of pi radians (180°).',
      'Thyristor pair T1-T2 is triggered at wt = alpha and conducts until wt = pi + alpha.',
      'Average DC Voltage: V_{dc} = \\frac{1}{\\pi} \\int_{\\alpha}^{\\pi + \\alpha} V_m \\sin(\\omega t) d(\\omega t)',
      'V_{dc} = \\frac{V_m}{\\pi} \\left[ -\\cos(\\omega t) \\right]_{\\alpha}^{\\pi + \\alpha}',
      'V_{dc} = \\frac{V_m}{\\pi} [ -\\cos(\\pi + \\alpha) + \\cos\\alpha ] = \\frac{V_m}{\\pi} [ \\cos\\alpha + \\cos\\alpha ]',
      'Final Formula: V_{dc} = \\frac{2 V_m}{\\pi} \\cos\\alpha',
    ],
    rmsFormula: 'V_{rms} = \\frac{V_m}{\\sqrt{2}}',
    notes: [
      'With R load or with Freewheeling Diode: output voltage cannot be negative, leading to V_dc = (Vm/pi)*(1 + cos(alpha)).',
      'Critical inductance determines boundary between continuous conduction mode (CCM) and discontinuous conduction mode (DCM).',
    ],
  },
  {
    id: 'commutation-overlap',
    title: 'Commutation Overlap Effect due to Source Inductance (Ls)',
    category: 'commutation',
    formula: '\\cos(\\alpha + \\mu) = \\cos\\alpha - \\frac{2\\omega L_s I_{dc}}{\\sqrt{2} V_s}, \\quad \\Delta V_{dc} = \\frac{m \\omega L_s}{2\\pi} I_{dc}',
    summary:
      'Because of source inductance Ls (leakage inductance of transformer or transmission line), current cannot transition instantaneously between incoming and outgoing thyristors. During overlap angle mu, both devices conduct simultaneously, creating an AC line short circuit and causing a voltage notch.',
    integralSteps: [
      'During commutation, current in outgoing device decays from Idc to 0 while current in incoming device rises from 0 to Idc.',
      'Governing equation: 2 L_s \\frac{di}{dt} = v_s(t) = \\sqrt{2} V_s \\sin(\\omega t).',
      'Integrating from wt = alpha to wt = alpha + mu:',
      '2 \\omega L_s \\int_0^{I_{dc}} di = \\sqrt{2} V_s \\int_{\\alpha}^{\\alpha + \\mu} \\sin(\\omega t) d(\\omega t)',
      '2 \\omega L_s I_{dc} = \\sqrt{2} V_s [ \\cos\\alpha - \\cos(\\alpha + \\mu) ]',
      'Average DC voltage reduction: \\Delta V_{dc} = \\frac{1}{\\pi} \\int_{\\alpha}^{\\alpha + \\mu} \\frac{v_s}{2} d(\\omega t) = \\frac{\\omega L_s}{\\pi} I_{dc}',
    ],
    rmsFormula: 'V_{dc,actual} = V_{dc,ideal} - \\Delta V_{dc} - 2 V_F',
    notes: [
      'Voltage notches appear on the AC line voltage and can disturb adjacent sensitive equipment.',
      'In 3-phase converters with 6 pulses: Delta V_dc = (3*omega*Ls / pi) * Idc.',
      'Overlap angle mu increases with higher load current Idc and higher source inductance Ls.',
    ],
  },
  {
    id: 'harmonics-fourier',
    title: 'Fourier Harmonic Series & Distortion Analysis',
    category: 'harmonics',
    formula: 'THD_i = \\sqrt{\\left(\\frac{I_{s,rms}}{I_{s1,rms}}\\right)^2 - 1} \\times 100\\%',
    summary:
      'Nonlinear switching generates significant harmonic currents on the AC source line. For a 6-pulse converter, characteristic harmonics appear at orders n = 6k +- 1 (5th, 7th, 11th, 13th...). Triplen harmonics (3rd, 9th, 15th) are canceled in balanced 3-phase systems.',
    integralSteps: [
      'Input line current i_a(wt) is expressed in Fourier series: i_a(t) = I_{dc} + sum_{n=1}^inf [a_n cos(n wt) + b_n sin(n wt)].',
      'For idealized rectangular line current of 6-pulse bridge with pulse width 120°:',
      'Fundamental RMS: I_{s1,rms} = \\frac{\\sqrt{6}}{\\pi} I_{dc} \\approx 0.7797 I_{dc}.',
      'Total RMS: I_{s,rms} = \\sqrt{\\frac{2}{3}} I_{dc} \\approx 0.8165 I_{dc}.',
      'Theoretical THD for ideal 6-pulse converter: THD_i = \\sqrt{ (0.8165/0.7797)^2 - 1 } \\approx 31.08\\%.',
      'Harmonic amplitude decays inversely with order: I_n / I_1 = 1 / n.',
    ],
    rmsFormula: 'PF = \\frac{P}{S} = \\frac{I_{s1,rms}}{I_{s,rms}} \\cos\\phi_1 = (\\text{Distortion Factor}) \\times (\\text{Displacement Factor})',
    notes: [
      '5th harmonic (250 Hz) and 7th harmonic (350 Hz) are the most dominant disturbances in standard 50 Hz power networks.',
      'Tuned LC filters or active power filters (APF) are required to reduce THD below the IEEE 519 standard threshold of 5%.',
    ],
  },
];
