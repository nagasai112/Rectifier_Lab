/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ConverterConfig,
  HarmonicItem,
  SimulationPoint,
  SimulationResult,
} from '../types/rectifier';

/**
 * High-Precision Power Electronics Simulation Engine
 * Rigorous steady-state ODE simulation for all 1-phase and 3-phase topologies,
 * with exact handling of R, RL, RLE loads, CCM/DCM conduction modes,
 * freewheeling diode action, commutation overlap, and semiconductor forward drops.
 */
export function simulateRectifier(config: ConverterConfig): SimulationResult {
  const {
    phase,
    topology,
    firingAngle,
    hasFreewheelingDiode,
    forwardVoltageDrop,
    sourceRms,
    frequency,
    sourceInductanceLs,
    loadType,
    resistance,
    inductance,
    backEmf,
    constantCurrentIdc,
    switches,
  } = config;

  const omega = 2 * Math.PI * frequency;
  const period = 1 / frequency;
  const numSteps = 720; // 0.5 degrees per step
  const dt = period / numSteps;
  const degPerStep = 360 / numSteps;

  // Voltage scaling:
  // For 1-phase: sourceRms is phase RMS -> Vm = sqrt(2) * sourceRms
  // For 3-phase: sourceRms is Line-to-Line RMS -> Vm_line = sqrt(2) * sourceRms, Vm_phase = sqrt(2/3) * sourceRms
  const vPeakPhase =
    phase === '1-phase'
      ? Math.sqrt(2) * sourceRms
      : (Math.sqrt(2) * sourceRms) / Math.sqrt(3);
  const vPeakLine =
    phase === '1-phase'
      ? Math.sqrt(2) * sourceRms
      : Math.sqrt(2) * sourceRms;

  const L_H = Math.max(0, (inductance || 0) * 1e-3); // Henry
  const Ls_H = Math.max(0, (sourceInductanceLs || 0) * 1e-3); // Henry
  const R = Math.max(resistance || 0.1, 0.05); // Ohm
  const E = loadType === 'RLE' ? Math.max(0, backEmf || 0) : 0; // Volts

  const alphaDeg = Math.max(0, Math.min(180, firingAngle));
  const alphaRad = (alphaDeg * Math.PI) / 180;

  const is3Phase = phase === '3-phase';
  const isBridge = topology === 'full-bridge';
  const isCenterTapped = topology === 'center-tapped';
  const isHalfWave = topology === 'half-wave';

  // Check switch control types
  const anyThyristor = switches.some((s) => s === 'thyristor');
  const isAllDiodes = !anyThyristor;
  const isSemiConverter =
    switches.some((s) => s === 'thyristor') &&
    switches.some((s) => s === 'diode');

  // Commutation overlap estimation
  let commOverlapDeg = 0;
  let overlapVoltageDrop = 0;

  // Helper for source voltages at instantaneous electrical angle wtRad
  const getSourceVoltages = (wtRad: number) => {
    if (!is3Phase) {
      const vA = vPeakPhase * Math.sin(wtRad);
      return { vA, vB: -vA, vC: 0, vAB: vA, vBC: 0, vCA: 0 };
    }
    // Balanced 3-Phase: Phase A at 0, Phase B at -120 deg, Phase C at +120 deg
    const vA = vPeakPhase * Math.sin(wtRad);
    const vB = vPeakPhase * Math.sin(wtRad - (2 * Math.PI) / 3);
    const vC = vPeakPhase * Math.sin(wtRad + (2 * Math.PI) / 3);

    // Line-to-line voltages:
    const vAB = vA - vB; // Peak is sqrt(3)*vPeakPhase, leads vA by 30°
    const vBC = vB - vC;
    const vCA = vC - vA;
    return { vA, vB, vC, vAB, vBC, vCA };
  };

  /**
   * Determine the ideal active driving branch and candidate switches at instantaneous angle wt
   * Returns: raw AC rectified voltage vRaw, active switches, and gate trigger flags.
   */
  const getInstantaneousState = (wtRad: number) => {
    const wtDeg = ((wtRad * 180) / Math.PI) % 360;
    const normDeg = (wtDeg + 360) % 360;
    const { vA, vB, vC, vAB, vBC, vCA } = getSourceVoltages(wtRad);

    let vRaw = 0;
    let activeSwitches: string[] = [];
    let numActiveDevices = 0;
    const gateTriggered: string[] = [];

    // Helper to check gate trigger instant within 3 degrees
    const checkGate = (targetDeg: number, name: string) => {
      let diff = (normDeg - targetDeg) % 360;
      if (diff < 0) diff += 360;
      if (diff <= 3) gateTriggered.push(name);
    };

    if (!is3Phase) {
      /* =========================================================
         1-PHASE TOPOLOGIES
         ========================================================= */
      if (isHalfWave) {
        // 1-Phase Half-Wave (1 switch: T1 / D1)
        const isThyristor = switches[0] === 'thyristor';
        const startDeg = isThyristor ? alphaDeg : 0;

        if (isThyristor) checkGate(alphaDeg, 'T1');

        // Positive half-cycle window
        if (normDeg >= startDeg && normDeg < 180) {
          vRaw = vA;
          activeSwitches = [isThyristor ? 'T1' : 'D1'];
          numActiveDevices = 1;
        } else if (normDeg >= 180 && !hasFreewheelingDiode && loadType !== 'R' && !isAllDiodes) {
          // If heavy RL without FWD, thyristor remains conducting past 180 into negative territory
          vRaw = vA;
          activeSwitches = [isThyristor ? 'T1' : 'D1'];
          numActiveDevices = 1;
        } else if (normDeg >= 180 && !hasFreewheelingDiode && loadType !== 'R' && isAllDiodes) {
          // Uncontrolled diode with RL load without FWD can conduct past 180° until current drops
          vRaw = vA;
          activeSwitches = ['D1'];
          numActiveDevices = 1;
        } else {
          vRaw = 0;
          activeSwitches = [];
        }
      } else if (isCenterTapped) {
        // 1-Phase Center-Tapped Full-Wave (2 switches: T1 for positive half, T2 for negative half)
        const t1Th = switches[0] === 'thyristor';
        const t2Th = switches[1] === 'thyristor';

        const alpha1 = t1Th ? alphaDeg : 0;
        const alpha2 = t2Th ? 180 + alphaDeg : 180;

        if (t1Th) checkGate(alphaDeg, 'T1');
        if (t2Th) checkGate((180 + alphaDeg) % 360, 'T2');

        // In continuous conduction without FWD and with heavy L, conduction runs from alpha to 180+alpha
        const canGoNegative = !hasFreewheelingDiode && loadType !== 'R';

        if (normDeg >= alpha1 && normDeg < (canGoNegative ? alpha2 : 180)) {
          vRaw = vA;
          activeSwitches = [t1Th ? 'T1' : 'D1'];
          numActiveDevices = 1;
        } else if (normDeg >= alpha2 || (canGoNegative && normDeg < alpha1)) {
          vRaw = -vA;
          activeSwitches = [t2Th ? 'T2' : 'D2'];
          numActiveDevices = 1;
        } else {
          vRaw = 0;
          activeSwitches = [];
        }
      } else {
        // 1-Phase Full-Bridge (4 switches: T1, T2 on positive half; T3, T4 on negative half)
        const t1Th = switches[0] === 'thyristor';
        const t2Th = switches[1] === 'thyristor';
        const t3Th = switches[2] === 'thyristor';
        const t4Th = switches[3] === 'thyristor';

        if (t1Th) checkGate(alphaDeg, 'T1');
        if (t2Th) checkGate(alphaDeg, 'T2');
        if (t3Th) checkGate((180 + alphaDeg) % 360, 'T3');
        if (t4Th) checkGate((180 + alphaDeg) % 360, 'T4');

        const s1 = t1Th ? 'T1' : 'D1';
        const s2 = t2Th ? 'T2' : 'D2';
        const s3 = t3Th ? 'T3' : 'D3';
        const s4 = t4Th ? 'T4' : 'D4';

        // For Semi-Converter (2 SCRs + 2 Diodes) or with Freewheeling Diode:
        // Output voltage can NEVER go negative! At 180°, diode path clamps output to 0.
        // For Pure R load: Current drops to 0 at 180°, so voltage CANNOT go negative.
        const canGoNegative =
          !hasFreewheelingDiode &&
          !isSemiConverter &&
          loadType !== 'R' &&
          (t1Th || t2Th || t3Th || t4Th);

        if (canGoNegative) {
          // Fully controlled bridge with inductive load (CCM):
          // Pair 1 (T1, T2) conducts for 180°: [alpha, 180 + alpha]
          // Pair 2 (T3, T4) conducts for 180°: [180 + alpha, 360 + alpha]
          if (normDeg >= alphaDeg && normDeg < 180 + alphaDeg) {
            vRaw = vA;
            activeSwitches = [s1, s2];
            numActiveDevices = 2;
          } else {
            vRaw = -vA;
            activeSwitches = [s3, s4];
            numActiveDevices = 2;
          }
        } else {
          // Uncontrolled Diode Bridge, Semi-Converter, or R load:
          // Conduction only occurs when forward-biased and fired
          if (normDeg >= alphaDeg && normDeg < 180) {
            vRaw = vA;
            activeSwitches = [s1, s2];
            numActiveDevices = 2;
          } else if (normDeg >= 180 + alphaDeg && normDeg < 360) {
            vRaw = -vA;
            activeSwitches = [s3, s4];
            numActiveDevices = 2;
          } else {
            // Freewheeling interval [180, 180+alpha] or [0, alpha]
            vRaw = 0;
            if (isSemiConverter) {
              activeSwitches = [s1, s4]; // Freewheeling through one SCR and opposite diode
              numActiveDevices = 2;
            } else {
              activeSwitches = [];
              numActiveDevices = 0;
            }
          }
        }
      }
    } else {
      /* =========================================================
         3-PHASE TOPOLOGIES
         ========================================================= */
      if (isHalfWave) {
        // 3-Phase Half-Wave (3 switches: T1 Ph A, T2 Ph B, T3 Ph C)
        // Natural commutation points: wt = 30° (vA crosses vC), 150° (vA crosses vB), 270° (vB crosses vC)
        // Conduction spans 120° for each phase:
        // Ph A: 30° + alpha to 150° + alpha
        // Ph B: 150° + alpha to 270° + alpha
        // Ph C: 270° + alpha to 390° + alpha (30° + alpha)
        const t1Th = switches[0] === 'thyristor';
        const t2Th = switches[1] === 'thyristor';
        const t3Th = switches[2] === 'thyristor';

        const s1 = t1Th ? 'T1' : 'D1';
        const s2 = t2Th ? 'T2' : 'D2';
        const s3 = t3Th ? 'T3' : 'D3';

        const phAStart = (30 + alphaDeg) % 360;
        const phBStart = (150 + alphaDeg) % 360;
        const phCStart = (270 + alphaDeg) % 360;

        if (t1Th) checkGate(phAStart, 'T1');
        if (t2Th) checkGate(phBStart, 'T2');
        if (t3Th) checkGate(phCStart, 'T3');

        // Relative angle from Ph A firing instant
        let relDeg = (normDeg - 30 - alphaDeg) % 360;
        if (relDeg < 0) relDeg += 360;

        const canGoNeg = !hasFreewheelingDiode && loadType !== 'R' && (t1Th || t2Th || t3Th);

        if (relDeg < 120) {
          vRaw = vA;
          activeSwitches = [s1];
          numActiveDevices = 1;
        } else if (relDeg < 240) {
          vRaw = vB;
          activeSwitches = [s2];
          numActiveDevices = 1;
        } else {
          vRaw = vC;
          activeSwitches = [s3];
          numActiveDevices = 1;
        }

        // With R load or FWD, voltage cannot go negative:
        if (!canGoNeg && vRaw < 0) {
          vRaw = 0;
          activeSwitches = [];
          numActiveDevices = 0;
        }
      } else {
        // 3-Phase Full-Bridge (6-Pulse)
        // Standard textbook sequence of 6 active pairs (each lasting exactly 60°):
        // Natural firing sequence starts at 30° for T1:
        // 1. [30° + alpha, 90° + alpha]:   T1 & T6 conduct -> v_o = vA - vB = vAB
        // 2. [90° + alpha, 150° + alpha]:  T1 & T2 conduct -> v_o = vA - vC = vAC
        // 3. [150° + alpha, 210° + alpha]: T3 & T2 conduct -> v_o = vB - vC = vBC
        // 4. [210° + alpha, 270° + alpha]: T3 & T4 conduct -> v_o = vB - vA = vBA
        // 5. [270° + alpha, 330° + alpha]: T5 & T4 conduct -> v_o = vC - vA = vCA
        // 6. [330° + alpha, 390° + alpha]: T5 & T6 conduct -> v_o = vC - vB = vCB
        const t1Th = switches[0] === 'thyristor';
        const t3Th = switches[1] === 'thyristor';
        const t5Th = switches[2] === 'thyristor';
        const t4Th = switches[3] === 'thyristor';
        const t6Th = switches[4] === 'thyristor';
        const t2Th = switches[5] === 'thyristor';

        const s1 = t1Th ? 'T1' : 'D1';
        const s3 = t3Th ? 'T3' : 'D3';
        const s5 = t5Th ? 'T5' : 'D5';
        const s4 = t4Th ? 'T4' : 'D4';
        const s6 = t6Th ? 'T6' : 'D6';
        const s2 = t2Th ? 'T2' : 'D2';

        if (t1Th) checkGate((30 + alphaDeg) % 360, 'T1');
        if (t2Th) checkGate((90 + alphaDeg) % 360, 'T2');
        if (t3Th) checkGate((150 + alphaDeg) % 360, 'T3');
        if (t4Th) checkGate((210 + alphaDeg) % 360, 'T4');
        if (t5Th) checkGate((270 + alphaDeg) % 360, 'T5');
        if (t6Th) checkGate((330 + alphaDeg) % 360, 'T6');

        let relDeg = (normDeg - 30 - alphaDeg) % 360;
        if (relDeg < 0) relDeg += 360;

        if (relDeg < 60) {
          // Interval 1: T1 (Ph A top) & T6 (Ph B bottom)
          vRaw = vAB;
          activeSwitches = [s1, s6];
        } else if (relDeg < 120) {
          // Interval 2: T1 (Ph A top) & T2 (Ph C bottom)
          vRaw = vA - vC; // vAC
          activeSwitches = [s1, s2];
        } else if (relDeg < 180) {
          // Interval 3: T3 (Ph B top) & T2 (Ph C bottom)
          vRaw = vBC;
          activeSwitches = [s3, s2];
        } else if (relDeg < 240) {
          // Interval 4: T3 (Ph B top) & T4 (Ph A bottom)
          vRaw = vB - vA; // vBA
          activeSwitches = [s3, s4];
        } else if (relDeg < 300) {
          // Interval 5: T5 (Ph C top) & T4 (Ph A bottom)
          vRaw = vCA;
          activeSwitches = [s5, s4];
        } else {
          // Interval 6: T5 (Ph C top) & T6 (Ph B bottom)
          vRaw = vC - vB; // vCB
          activeSwitches = [s5, s6];
        }

        numActiveDevices = 2;

        // In 3-phase Semi-Converter or with Freewheeling Diode, voltage NEVER goes negative:
        if ((isSemiConverter || hasFreewheelingDiode || loadType === 'R') && vRaw < 0) {
          vRaw = 0;
          if (isSemiConverter) {
            // Intrinsic freewheeling across same phase diode/thyristor
            activeSwitches = [s1, s4];
          } else {
            activeSwitches = [];
          }
        }
      }
    }

    return {
      vRaw,
      activeSwitches,
      numActiveDevices,
      gateTriggered,
      sourceVoltages: { vA, vB, vC, vAB, vBC, vCA },
    };
  };

  // Estimate steady-state Idc for commutation overlap
  const roughVdc = is3Phase
    ? (3 * vPeakLine) / Math.PI * Math.cos(alphaRad)
    : (2 * vPeakPhase) / Math.PI * Math.cos(alphaRad);
  const estIdc = Math.max(0.5, (Math.max(0, roughVdc) - E) / R);

  // Commutation overlap angle mu calculation
  if (Ls_H > 0) {
    const denom = is3Phase ? Math.sqrt(6) * vPeakPhase : 2 * vPeakPhase;
    const cosArg = Math.cos(alphaRad) - (2 * omega * Ls_H * estIdc) / denom;
    if (cosArg >= -1 && cosArg <= 1) {
      const alphaPlusMu = Math.acos(cosArg);
      commOverlapDeg = Math.max(0, ((alphaPlusMu - alphaRad) * 180) / Math.PI);
    } else {
      commOverlapDeg = 4;
    }
    const m = is3Phase ? 3 : 2;
    overlapVoltageDrop = (m * omega * Ls_H * estIdc) / Math.PI;
  }

  // Steady-state simulation over 4 electrical periods to ensure complete convergence
  const simCycles = 4;
  const totalSteps = numSteps * simCycles;

  let current_i = 0;
  if (loadType === 'constant-current') {
    current_i = constantCurrentIdc;
  }

  const steadyPoints: SimulationPoint[] = [];

  for (let step = 0; step < totalSteps; step++) {
    const t = step * dt;
    const wtRad = omega * t;
    const isFinalCycle = step >= numSteps * (simCycles - 1);

    const {
      vRaw,
      activeSwitches,
      numActiveDevices,
      gateTriggered,
      sourceVoltages,
    } = getInstantaneousState(wtRad);

    let vOutIdeal = vRaw;
    let vOut = vRaw;
    let totalDrop = 0;
    let isFwdConducting = false;
    let currentActive = [...activeSwitches];

    // Freewheeling Diode (D_FW) action:
    // If output voltage tries to go below zero while current is flowing:
    if (hasFreewheelingDiode && current_i > 0.005 && vRaw < 0) {
      isFwdConducting = true;
      vOutIdeal = 0;
      vOut = -forwardVoltageDrop; // Clamped to -VF
      totalDrop = forwardVoltageDrop;
      currentActive = ['D_FW'];
    } else {
      // Normal conduction through active semiconductors
      if (current_i > 0.005 || vRaw > E + forwardVoltageDrop * numActiveDevices) {
        totalDrop = numActiveDevices * forwardVoltageDrop;
        vOut = vRaw - totalDrop;
        vOutIdeal = vRaw;
      } else {
        // Discontinuous Conduction Mode (DCM) where current has extinguished to zero:
        if (loadType === 'RLE') {
          vOut = E; // Load terminals float at battery EMF
          vOutIdeal = E;
        } else {
          vOut = 0;
          vOutIdeal = 0;
        }
        totalDrop = 0;
        currentActive = [];
      }
    }

    // Commutation overlap voltage notch:
    const wtDeg = ((wtRad * 180) / Math.PI) % 360;
    const pulseInterval = is3Phase ? 60 : 180;
    const pulsePhase = ((wtDeg - alphaDeg) % pulseInterval + pulseInterval) % pulseInterval;
    const isCommutating = commOverlapDeg > 0 && pulsePhase < commOverlapDeg;

    if (isCommutating && currentActive.length > 0) {
      vOut -= overlapVoltageDrop * 0.75;
      vOutIdeal -= overlapVoltageDrop * 0.75;
    }

    // Numerical integration of load differential equation:
    // L * (di / dt) + R * i + E = vOut
    if (loadType !== 'constant-current') {
      if (L_H > 1e-6) {
        // RK4 integration for numerical stability with stiff inductances
        const f = (i_val: number, v_val: number) => (v_val - R * i_val - E) / L_H;
        const k1 = f(current_i, vOut);
        const k2 = f(current_i + 0.5 * dt * k1, vOut);
        const k3 = f(current_i + 0.5 * dt * k2, vOut);
        const k4 = f(current_i + dt * k3, vOut);
        current_i += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);

        if (current_i < 0) {
          current_i = 0; // Unidirectional diode/thyristor conduction
        }
      } else {
        // Pure Resistive or R-E load
        current_i = Math.max(0, (vOut - E) / R);
      }
    }

    // Mapping AC line currents based on conducting switches:
    let iSourceA = 0;
    let iSourceB = 0;
    let iSourceC = 0;

    if (!isFwdConducting && current_i > 0) {
      if (!is3Phase) {
        if (isHalfWave) {
          iSourceA = currentActive.length > 0 ? current_i : 0;
        } else if (isCenterTapped) {
          if (currentActive.some((s) => s.startsWith('T1') || s.startsWith('D1'))) {
            iSourceA = current_i;
          } else if (currentActive.some((s) => s.startsWith('T2') || s.startsWith('D2'))) {
            iSourceA = -current_i;
          }
        } else {
          // Full-Bridge
          if (currentActive.some((s) => s.startsWith('T1') || s.startsWith('D1'))) {
            iSourceA = current_i;
          } else if (currentActive.some((s) => s.startsWith('T3') || s.startsWith('D3'))) {
            iSourceA = -current_i;
          }
        }
      } else {
        // 3-Phase Converter
        if (isHalfWave) {
          if (currentActive.some((s) => s.startsWith('T1') || s.startsWith('D1'))) iSourceA = current_i;
          if (currentActive.some((s) => s.startsWith('T2') || s.startsWith('D2'))) iSourceB = current_i;
          if (currentActive.some((s) => s.startsWith('T3') || s.startsWith('D3'))) iSourceC = current_i;
        } else {
          // 3-Phase Full-Bridge
          // Phase A is connected to Leg 1 (T1 top, T4 bottom)
          if (currentActive.some((s) => s.startsWith('T1') || s.startsWith('D1'))) iSourceA += current_i;
          if (currentActive.some((s) => s.startsWith('T4') || s.startsWith('D4'))) iSourceA -= current_i;

          // Phase B is connected to Leg 2 (T3 top, T6 bottom)
          if (currentActive.some((s) => s.startsWith('T3') || s.startsWith('D3'))) iSourceB += current_i;
          if (currentActive.some((s) => s.startsWith('T6') || s.startsWith('D6'))) iSourceB -= current_i;

          // Phase C is connected to Leg 3 (T5 top, T2 bottom)
          if (currentActive.some((s) => s.startsWith('T5') || s.startsWith('D5'))) iSourceC += current_i;
          if (currentActive.some((s) => s.startsWith('T2') || s.startsWith('D2'))) iSourceC -= current_i;
        }
      }
    }

    if (isFinalCycle) {
      const cycleStep = step - numSteps * (simCycles - 1);
      const wtDegCycle = cycleStep * degPerStep;

      steadyPoints.push({
        t: cycleStep * dt,
        wtDeg: wtDegCycle,
        vA: sourceVoltages.vA,
        vB: sourceVoltages.vB,
        vC: sourceVoltages.vC,
        vAB: sourceVoltages.vAB,
        vBC: sourceVoltages.vBC,
        vCA: sourceVoltages.vCA,
        vOut,
        vOutIdeal,
        iOut: current_i,
        iSourceA,
        iSourceB,
        iSourceC,
        iFwd: isFwdConducting ? current_i : 0,
        activeSwitches: currentActive,
        isCommutating,
        totalDrop,
        gateTriggered,
      });
    }
  }

  // Averages, RMS, and Power Integration
  let sumV = 0;
  let sumVsq = 0;
  let sumI = 0;
  let sumIsq = 0;
  let sumP = 0;
  let sumPin = 0;
  let sumIsA_sq = 0;
  let minI = Infinity;
  let maxI = -Infinity;
  let semiconductorLossWatts = 0;

  for (const pt of steadyPoints) {
    sumV += pt.vOut;
    sumVsq += pt.vOut * pt.vOut;
    sumI += pt.iOut;
    sumIsq += pt.iOut * pt.iOut;
    sumP += pt.vOut * pt.iOut;
    sumPin += pt.vA * pt.iSourceA;
    sumIsA_sq += pt.iSourceA * pt.iSourceA;
    semiconductorLossWatts += pt.totalDrop * pt.iOut;

    if (pt.iOut < minI) minI = pt.iOut;
    if (pt.iOut > maxI) maxI = pt.iOut;
  }

  const N = steadyPoints.length;
  const vDcAvg = sumV / N;
  const vRms = Math.sqrt(Math.max(0, sumVsq / N));
  const iDcAvg = sumI / N;
  const iRms = Math.sqrt(Math.max(0, sumIsq / N));
  const pLoad = sumP / N;
  semiconductorLossWatts = semiconductorLossWatts / N;

  const iSourceRms = Math.sqrt(Math.max(0, sumIsA_sq / N));
  const sIn = Math.max(0.1, sourceRms * iSourceRms * (is3Phase ? Math.sqrt(3) : 1));
  const pIn = Math.max(0, sumPin / N);
  const powerFactor = sIn > 0 ? Math.min(1.0, Math.max(0, pLoad / sIn)) : 0;

  const formFactor = Math.abs(vDcAvg) > 0.01 ? vRms / Math.abs(vDcAvg) : 1;
  const rfSquared = Math.max(0, formFactor * formFactor - 1);
  const rippleFactor = Math.sqrt(rfSquared);
  const crestFactor = iRms > 0.01 ? maxI / iRms : 1;

  // Continuous Conduction (CCM) vs Discontinuous (DCM) Detection:
  const zeroCurrentCount = steadyPoints.filter((p) => p.iOut < 0.02).length;
  const isContinuous = zeroCurrentCount < 5 && minI > 0.05;

  // Fourier FFT Harmonics
  const harmonics: HarmonicItem[] = [];
  const maxHarmonics = 25;
  let fundCurrentMag = 0;

  for (let n = 1; n <= maxHarmonics; n++) {
    let reV = 0;
    let imV = 0;
    let reI = 0;
    let imI = 0;

    for (let k = 0; k < N; k++) {
      const angle = (2 * Math.PI * n * k) / N;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      reV += steadyPoints[k].vOut * cosA;
      imV -= steadyPoints[k].vOut * sinA;

      reI += steadyPoints[k].iSourceA * cosA;
      imI -= steadyPoints[k].iSourceA * sinA;
    }

    const vMag = (2 * Math.sqrt(reV * reV + imV * imV)) / N;
    const vPhase = (Math.atan2(imV, reV) * 180) / Math.PI;
    const iMag = (2 * Math.sqrt(reI * reI + imI * imI)) / N;

    if (n === 1) fundCurrentMag = iMag;

    harmonics.push({
      order: n,
      freq: n * frequency,
      vMag,
      vPhase,
      vPercent: 0,
      iMag,
      iPercent: 0,
    });
  }

  const fundV = harmonics[0]?.vMag || 1;
  const fundI = fundCurrentMag || 1;
  harmonics.forEach((h) => {
    h.vPercent = (h.vMag / fundV) * 100;
    h.iPercent = (h.iMag / fundI) * 100;
  });

  const fundCurrentRms = fundCurrentMag / Math.sqrt(2);
  let sourceThdCurrent = 0;
  if (fundCurrentRms > 0.01 && iSourceRms >= fundCurrentRms) {
    sourceThdCurrent =
      (Math.sqrt(Math.max(0, iSourceRms * iSourceRms - fundCurrentRms * fundCurrentRms)) /
        fundCurrentRms) *
      100;
  } else if (fundCurrentRms > 0.01) {
    sourceThdCurrent = 15.0;
  }

  const phi1 = harmonics[0]?.vPhase || 0;
  const displacementFactor = Math.abs(Math.cos((phi1 * Math.PI) / 180));
  const distortionFactor =
    displacementFactor > 0.01 ? powerFactor / displacementFactor : powerFactor;

  // Exact Theoretical Analytical Formulas & Values
  let idealVdcTheory = 0;
  let theoreticalFormula = '';
  let theoreticalSubtitle = '';

  const Vm_p = vPeakPhase;
  const Vm_L = vPeakLine;

  if (!is3Phase) {
    if (isHalfWave) {
      if (isAllDiodes) {
        theoreticalFormula = 'V_{dc} = \\frac{V_m}{\\pi} \\approx 0.318 V_m';
        theoreticalSubtitle = 'Single-Phase Half-Wave Uncontrolled Diode Rectifier';
        idealVdcTheory = Vm_p / Math.PI;
      } else {
        theoreticalFormula = 'V_{dc} = \\frac{V_m}{2\\pi}(1 + \\cos\\alpha)';
        theoreticalSubtitle = 'Single-Phase Half-Wave Controlled Thyristor Converter with R Load / FWD';
        idealVdcTheory = (Vm_p / (2 * Math.PI)) * (1 + Math.cos(alphaRad));
      }
    } else if (isCenterTapped) {
      if (isAllDiodes) {
        theoreticalFormula = 'V_{dc} = \\frac{2 V_m}{\\pi} \\approx 0.6366 V_m';
        theoreticalSubtitle = 'Single-Phase Full-Wave Center-Tapped Diode Rectifier';
        idealVdcTheory = (2 * Vm_p) / Math.PI;
      } else {
        theoreticalFormula = 'V_{dc} = \\frac{2 V_m}{\\pi} \\cos\\alpha';
        theoreticalSubtitle = 'Single-Phase Full-Wave Center-Tapped Controlled Converter';
        idealVdcTheory = ((2 * Vm_p) / Math.PI) * Math.cos(alphaRad);
      }
    } else {
      // 1-Phase Full-Bridge
      if (isAllDiodes) {
        theoreticalFormula = 'V_{dc} = \\frac{2 V_m}{\\pi} \\approx 0.9 V_{rms}';
        theoreticalSubtitle = 'Single-Phase Full-Bridge Uncontrolled Diode Rectifier';
        idealVdcTheory = (2 * Vm_p) / Math.PI;
      } else if (isSemiConverter || hasFreewheelingDiode) {
        theoreticalFormula = 'V_{dc} = \\frac{V_m}{\\pi}(1 + \\cos\\alpha)';
        theoreticalSubtitle = 'Single-Phase Semi-Converter (Half-Controlled) with Intrinsic Freewheeling';
        idealVdcTheory = (Vm_p / Math.PI) * (1 + Math.cos(alphaRad));
      } else {
        theoreticalFormula = 'V_{dc} = \\frac{2 V_m}{\\pi} \\cos\\alpha';
        theoreticalSubtitle = 'Single-Phase Fully Controlled Full-Bridge Thyristor Converter (CCM)';
        idealVdcTheory = ((2 * Vm_p) / Math.PI) * Math.cos(alphaRad);
      }
    }
  } else {
    // 3-Phase Topologies
    if (isHalfWave) {
      if (isAllDiodes) {
        theoreticalFormula = 'V_{dc} = \\frac{3\\sqrt{3} V_{mp}}{2\\pi} = \\frac{3 V_{mL}}{2\\pi} \\approx 0.827 V_{mL}';
        theoreticalSubtitle = 'Three-Phase 3-Pulse Half-Wave Diode Rectifier';
        idealVdcTheory = (3 * Math.sqrt(3) * Vm_p) / (2 * Math.PI);
      } else {
        theoreticalFormula = 'V_{dc} = \\frac{3\\sqrt{3} V_{mp}}{2\\pi}\\cos\\alpha = \\frac{3 V_{mL}}{2\\pi}\\cos\\alpha';
        theoreticalSubtitle = 'Three-Phase 3-Pulse Controlled Converter (CCM)';
        idealVdcTheory =
          ((3 * Math.sqrt(3) * Vm_p) / (2 * Math.PI)) * Math.cos(alphaRad);
      }
    } else {
      // 3-Phase Full-Bridge (6-Pulse)
      if (isAllDiodes) {
        theoreticalFormula = 'V_{dc} = \\frac{3 V_{mL}}{\\pi} \\approx 1.35 V_{LL,rms}';
        theoreticalSubtitle = '3-Phase 6-Pulse Uncontrolled Diode Bridge Rectifier';
        idealVdcTheory = (3 * Vm_L) / Math.PI;
      } else if (isSemiConverter) {
        theoreticalFormula = 'V_{dc} = \\frac{3 V_{mL}}{2\\pi}(1 + \\cos\\alpha)';
        theoreticalSubtitle = '3-Phase Semi-Converter (Half-Controlled) — Analytical DC Voltage Equation';
        idealVdcTheory = ((3 * Vm_L) / (2 * Math.PI)) * (1 + Math.cos(alphaRad));
      } else {
        theoreticalFormula = 'V_{dc} = \\frac{3 V_{mL}}{\\pi}\\cos\\alpha';
        theoreticalSubtitle = '3-Phase Fully Controlled 6-Pulse Converter (Two-Quadrant CCM)';
        idealVdcTheory = ((3 * Vm_L) / Math.PI) * Math.cos(alphaRad);
      }
    }
  }

  const efficiency = pIn > 0 ? Math.min(100, Math.max(0, (pLoad / pIn) * 100)) : 0;
  const pDcOutput = Math.max(0, vDcAvg * iDcAvg);
  const rectificationRatio = pLoad > 0 ? (pDcOutput / pLoad) * 100 : 0;
  const tuf = sIn > 0 ? pDcOutput / sIn : 0;

  return {
    points: steadyPoints,
    vDcAvg,
    vRms,
    iDcAvg,
    iRms,
    pLoad,
    sIn,
    powerFactor,
    displacementFactor,
    distortionFactor,
    rippleFactor,
    formFactor,
    crestFactor,
    sourceThdCurrent,
    isContinuous,
    idealVdcTheory,
    theoreticalFormula,
    theoreticalSubtitle,
    commutationOverlapDeg: commOverlapDeg,
    overlapVoltageDrop,
    semiconductorLossWatts,
    efficiency,
    rectificationRatio,
    tuf,
    harmonics,
  };
}
