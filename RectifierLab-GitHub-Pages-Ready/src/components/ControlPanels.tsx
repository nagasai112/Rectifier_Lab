/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ConverterConfig,
  DeviceType,
  LoadType,
  PhaseType,
  ConverterType,
} from '../types/rectifier';
import {
  Cpu,
  Zap,
  Sliders,
  Flame,
  BatteryCharging,
  Layers,
} from 'lucide-react';

interface ControlPanelsProps {
  config: ConverterConfig;
  onUpdateConfig: (partial: Partial<ConverterConfig>) => void;
}

export const ControlPanels: React.FC<ControlPanelsProps> = ({
  config,
  onUpdateConfig,
}) => {
  const is3Phase = config.phase === '3-phase';

  // Quick switch setups
  const handleQuickDeviceSetup = (preset: 'all-diodes' | 'all-thyristors' | 'semi-conv') => {
    const count = is3Phase ? (config.topology === 'full-bridge' ? 6 : 3) : (config.topology === 'full-bridge' ? 4 : 1);
    let nextSwitches: DeviceType[] = [];

    if (preset === 'all-diodes') {
      nextSwitches = Array(count).fill('diode');
      onUpdateConfig({ switches: nextSwitches, firingAngle: 0 });
    } else if (preset === 'all-thyristors') {
      nextSwitches = Array(count).fill('thyristor');
      onUpdateConfig({ switches: nextSwitches });
    } else if (preset === 'semi-conv') {
      // Semi converter: half thyristors, half diodes
      if (is3Phase && config.topology === 'full-bridge') {
        // T1, T3, T5 SCR; T4, T6, T2 (or D5, D6) diodes
        nextSwitches = ['thyristor', 'thyristor', 'diode', 'thyristor', 'diode', 'thyristor'];
      } else if (!is3Phase && config.topology === 'full-bridge') {
        nextSwitches = ['thyristor', 'diode', 'thyristor', 'diode'];
      } else {
        nextSwitches = Array(count).fill('thyristor');
      }
      onUpdateConfig({ switches: nextSwitches });
    }
  };

  const handlePhaseChange = (phase: PhaseType) => {
    const isNext3Ph = phase === '3-phase';
    const count = isNext3Ph ? 6 : 4;
    onUpdateConfig({
      phase,
      switches: Array(count).fill('thyristor'),
      sourceRms: isNext3Ph ? 400 : 230,
    });
  };

  const alphaPresets = [0, 30, 45, 60, 90, 120, 150];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full select-none">
      {/* 1. CONVERTER TOPOLOGY CARD */}
      <div className="bg-[#070e1c] rounded-xl border border-cyan-950/70 p-4 shadow-lg flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Converter Topology
            </h3>
          </div>

          {/* Phase Selector */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => handlePhaseChange('1-phase')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                !is3Phase
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'bg-[#09152b] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Single-Phase (1Φ)
            </button>
            <button
              onClick={() => handlePhaseChange('3-phase')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                is3Phase
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'bg-[#09152b] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Three-Phase (3Φ)
            </button>
          </div>

          {/* Converter Type (Full-Bridge vs Center-Tapped vs Half-Wave) */}
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            <button
              onClick={() => {
                const count = is3Phase ? 6 : 4;
                onUpdateConfig({
                  topology: 'full-bridge',
                  switches: Array(count).fill('thyristor'),
                });
              }}
              className={`py-2 px-1.5 rounded-lg text-xs font-semibold text-center transition-all ${
                config.topology === 'full-bridge'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'bg-[#09152b] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Full-Bridge
            </button>

            {!is3Phase ? (
              <button
                onClick={() => {
                  onUpdateConfig({
                    topology: 'center-tapped',
                    switches: ['thyristor', 'thyristor'],
                  });
                }}
                className={`py-2 px-1.5 rounded-lg text-xs font-semibold text-center transition-all ${
                  config.topology === 'center-tapped'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                    : 'bg-[#09152b] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Center-Tap
              </button>
            ) : (
              <div className="py-2 px-1.5 rounded-lg text-xs font-semibold text-center bg-[#060c18] text-slate-600 border border-slate-900 cursor-not-allowed">
                6-Pulse
              </div>
            )}

            <button
              onClick={() => {
                const count = is3Phase ? 3 : 1;
                onUpdateConfig({
                  topology: 'half-wave',
                  switches: Array(count).fill('thyristor'),
                });
              }}
              className={`py-2 px-1.5 rounded-lg text-xs font-semibold text-center transition-all ${
                config.topology === 'half-wave'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'bg-[#09152b] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Half-Wave
            </button>
          </div>
        </div>

        {/* Quick Device Setup */}
        <div>
          <span className="text-[11px] text-slate-400 font-medium block mb-1.5">
            Quick Device Setup:
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleQuickDeviceSetup('all-diodes')}
              className="py-1 px-2 rounded-md bg-[#09152b] hover:bg-[#122345] text-slate-300 text-[11px] font-medium border border-slate-800 transition-colors"
            >
              All Diodes
            </button>
            <button
              onClick={() => handleQuickDeviceSetup('all-thyristors')}
              className="py-1 px-2 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[11px] font-medium border border-amber-600/40 transition-colors"
            >
              All Thyristors
            </button>
            <button
              onClick={() => handleQuickDeviceSetup('semi-conv')}
              className="py-1 px-2 rounded-md bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 text-[11px] font-medium border border-teal-600/40 transition-colors"
            >
              Semi-Conv
            </button>
          </div>
        </div>
      </div>

      {/* 2. FIRING ANGLE α & FWD CARD */}
      <div className="bg-[#070e1c] rounded-xl border border-cyan-950/70 p-4 shadow-lg flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Firing Angle α &amp; FWD
            </h3>
          </div>

          {/* Firing Angle Slider */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300">Firing Angle (α):</span>
              <span className="text-amber-400 font-mono font-bold text-sm">
                {config.firingAngle}°
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              step="1"
              value={config.firingAngle}
              onChange={(e) =>
                onUpdateConfig({ firingAngle: parseFloat(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Quick Preset Degree Buttons */}
          <div className="flex items-center justify-between gap-1 mb-4 flex-wrap">
            {alphaPresets.map((deg) => (
              <button
                key={deg}
                onClick={() => onUpdateConfig({ firingAngle: deg })}
                className={`flex-1 min-w-8 py-1 rounded text-[11px] font-mono transition-colors ${
                  config.firingAngle === deg
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-[#09152b] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>

        {/* FWD & Forward Drop Sliders */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
          {/* Freewheeling Diode Toggle */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Freewheeling Diode (D_FW):</span>
            <button
              onClick={() =>
                onUpdateConfig({
                  hasFreewheelingDiode: !config.hasFreewheelingDiode,
                })
              }
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                config.hasFreewheelingDiode
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                  : 'bg-[#09152b] text-slate-400 border border-slate-800'
              }`}
            >
              {config.hasFreewheelingDiode ? 'Connected' : 'Disconnected'}
            </button>
          </div>

          {/* Component Forward Drop (Real-time drop slider requested by user!) */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-300 flex items-center gap-1">
                <span>Diode/SCR Forward Drop (V_F):</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                {config.forwardVoltageDrop.toFixed(1)} V
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="3.0"
              step="0.1"
              value={config.forwardVoltageDrop}
              onChange={(e) =>
                onUpdateConfig({
                  forwardVoltageDrop: parseFloat(e.target.value),
                })
              }
              className="w-full accent-emerald-500 cursor-pointer h-1.5"
            />
          </div>
        </div>
      </div>

      {/* 3. LOAD & SOURCE PARAMETERS CARD */}
      <div className="bg-[#070e1c] rounded-xl border border-cyan-950/70 p-4 shadow-lg flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center gap-2 mb-2.5">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Load &amp; Source Parameters
            </h3>
          </div>

          {/* Load Selector Tabs */}
          <div className="grid grid-cols-4 gap-1 mb-3">
            {(['R', 'RL', 'RLE', 'constant-current'] as LoadType[]).map((lt) => (
              <button
                key={lt}
                onClick={() => onUpdateConfig({ loadType: lt })}
                className={`py-1.5 px-1 rounded-md text-[11px] font-semibold transition-all ${
                  config.loadType === lt
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-[#09152b] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {lt === 'constant-current' ? 'Idc' : `${lt} Load`}
              </button>
            ))}
          </div>

          {/* Sliders */}
          <div className="space-y-2 text-xs">
            {/* R Slider */}
            {config.loadType !== 'constant-current' && (
              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="text-slate-400">R (Resistance):</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {config.resistance} Ω
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={config.resistance}
                  onChange={(e) =>
                    onUpdateConfig({ resistance: parseFloat(e.target.value) })
                  }
                  className="w-full accent-emerald-500 cursor-pointer h-1"
                />
              </div>
            )}

            {/* L Slider */}
            {(config.loadType === 'RL' || config.loadType === 'RLE') && (
              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="text-slate-400">L (Inductance):</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {config.inductance} mH
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={config.inductance}
                  onChange={(e) =>
                    onUpdateConfig({ inductance: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-500 cursor-pointer h-1"
                />
              </div>
            )}

            {/* E Slider for RLE */}
            {config.loadType === 'RLE' && (
              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="text-slate-400">E (Back EMF / Battery):</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {config.backEmf} V
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={config.backEmf}
                  onChange={(e) =>
                    onUpdateConfig({ backEmf: parseFloat(e.target.value) })
                  }
                  className="w-full accent-cyan-500 cursor-pointer h-1"
                />
              </div>
            )}

            {/* Constant Current Slider */}
            {config.loadType === 'constant-current' && (
              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="text-slate-400">Constant Current (Idc):</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {config.constantCurrentIdc} A
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={config.constantCurrentIdc}
                  onChange={(e) =>
                    onUpdateConfig({
                      constantCurrentIdc: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-amber-500 cursor-pointer h-1"
                />
              </div>
            )}

            {/* Source RMS */}
            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-slate-400">Source RMS:</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {config.sourceRms} V
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="480"
                step="10"
                value={config.sourceRms}
                onChange={(e) =>
                  onUpdateConfig({ sourceRms: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-500 cursor-pointer h-1"
              />
            </div>
          </div>
        </div>

        {/* Source Inductance Ls Toggle */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-300">Source Inductance (L_s):</span>
          <button
            onClick={() => {
              if (config.sourceInductanceLs > 0) {
                onUpdateConfig({ sourceInductanceLs: 0 });
              } else {
                onUpdateConfig({ sourceInductanceLs: 2.0 });
              }
            }}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
              config.sourceInductanceLs > 0
                ? 'bg-indigo-950 text-indigo-400 border border-indigo-700'
                : 'bg-[#09152b] text-slate-400 border border-slate-800'
            }`}
          >
            {config.sourceInductanceLs > 0
              ? `${config.sourceInductanceLs} mH`
              : 'Bypassed'}
          </button>
        </div>
      </div>
    </div>
  );
};
