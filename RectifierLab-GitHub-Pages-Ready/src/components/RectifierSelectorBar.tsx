/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ConverterConfig,
  DeviceType,
  PhaseType,
  ConverterType,
  LoadType,
} from '../types/rectifier';
import {
  Layers,
  Zap,
  Check,
  ChevronDown,
  Sparkles,
  CircuitBoard,
  Cpu,
} from 'lucide-react';

export interface RectifierOption {
  id: string;
  name: string;
  shortName: string;
  category: '1-phase-half' | '1-phase-center' | '1-phase-bridge' | '3-phase-half' | '3-phase-bridge';
  categoryLabel: string;
  phase: PhaseType;
  topology: ConverterType;
  switches: DeviceType[];
  defaultAlpha: number;
  hasFwd: boolean;
  description: string;
  pulseCount: string;
}

export const ALL_RECTIFIER_OPTIONS: RectifierOption[] = [
  // 1-Phase Half-Wave
  {
    id: '1ph-hw-diode',
    name: '1Φ Half-Wave Uncontrolled Diode Rectifier',
    shortName: '1Φ HW Diode',
    category: '1-phase-half',
    categoryLabel: '1Φ Half-Wave',
    phase: '1-phase',
    topology: 'half-wave',
    switches: ['diode'],
    defaultAlpha: 0,
    hasFwd: false,
    description: 'Single diode rectification, 1-pulse, Vdc = Vm / π',
    pulseCount: '1-Pulse',
  },
  {
    id: '1ph-hw-thyristor',
    name: '1Φ Half-Wave Controlled Thyristor Converter',
    shortName: '1Φ HW Thyristor (SCR)',
    category: '1-phase-half',
    categoryLabel: '1Φ Half-Wave',
    phase: '1-phase',
    topology: 'half-wave',
    switches: ['thyristor'],
    defaultAlpha: 45,
    hasFwd: false,
    description: 'Variable firing delay α, Vdc = (Vm / 2π)(1 + cos α)',
    pulseCount: '1-Pulse',
  },
  {
    id: '1ph-hw-fwd',
    name: '1Φ Half-Wave Controlled with Freewheeling Diode (FWD)',
    shortName: '1Φ HW SCR + FWD',
    category: '1-phase-half',
    categoryLabel: '1Φ Half-Wave',
    phase: '1-phase',
    topology: 'half-wave',
    switches: ['thyristor'],
    defaultAlpha: 45,
    hasFwd: true,
    description: 'Freewheeling diode suppresses negative inductive voltage spikes',
    pulseCount: '1-Pulse',
  },

  // 1-Phase Center-Tapped / Mid-Point
  {
    id: '1ph-ct-diode',
    name: '1Φ Full-Wave Center-Tapped Diode Rectifier (2 Diodes)',
    shortName: '1Φ Mid-Point Diode',
    category: '1-phase-center',
    categoryLabel: '1Φ Center-Tapped',
    phase: '1-phase',
    topology: 'center-tapped',
    switches: ['diode', 'diode'],
    defaultAlpha: 0,
    hasFwd: false,
    description: 'Transformer secondary with center-tap neutral return, 2 diodes',
    pulseCount: '2-Pulse',
  },
  {
    id: '1ph-ct-thyristor',
    name: '1Φ Full-Wave Center-Tapped Controlled Converter (2 Thyristors)',
    shortName: '1Φ Mid-Point SCR',
    category: '1-phase-center',
    categoryLabel: '1Φ Center-Tapped',
    phase: '1-phase',
    topology: 'center-tapped',
    switches: ['thyristor', 'thyristor'],
    defaultAlpha: 45,
    hasFwd: false,
    description: 'Two thyristors triggered at α and π + α with transformer neutral return',
    pulseCount: '2-Pulse',
  },

  // 1-Phase Full-Bridge
  {
    id: '1ph-bridge-diode',
    name: '1Φ Full-Bridge Uncontrolled Diode Rectifier (4 Diodes)',
    shortName: '1Φ Bridge Diode (4D)',
    category: '1-phase-bridge',
    categoryLabel: '1Φ Full-Bridge',
    phase: '1-phase',
    topology: 'full-bridge',
    switches: ['diode', 'diode', 'diode', 'diode'],
    defaultAlpha: 0,
    hasFwd: false,
    description: 'Standard 4-diode H-bridge, Vdc = 2Vm / π = 0.9 Vs',
    pulseCount: '2-Pulse',
  },
  {
    id: '1ph-bridge-semi',
    name: '1Φ Semi-Converter (Half-Controlled Bridge: 2 SCRs + 2 Diodes)',
    shortName: '1Φ Semi-Converter',
    category: '1-phase-bridge',
    categoryLabel: '1Φ Full-Bridge',
    phase: '1-phase',
    topology: 'full-bridge',
    switches: ['thyristor', 'diode', 'thyristor', 'diode'],
    defaultAlpha: 45,
    hasFwd: false,
    description: 'Economical bridge with inherent freewheeling, Vdc = (Vm / π)(1 + cos α)',
    pulseCount: '2-Pulse',
  },
  {
    id: '1ph-bridge-full',
    name: '1Φ Fully Controlled Full-Bridge Converter (4 Thyristors)',
    shortName: '1Φ Fully Controlled (4 SCR)',
    category: '1-phase-bridge',
    categoryLabel: '1Φ Full-Bridge',
    phase: '1-phase',
    topology: 'full-bridge',
    switches: ['thyristor', 'thyristor', 'thyristor', 'thyristor'],
    defaultAlpha: 45,
    hasFwd: false,
    description: 'Two-quadrant controlled converter, Vdc = (2Vm / π) cos α',
    pulseCount: '2-Pulse',
  },

  // 3-Phase Half-Wave (3-Pulse)
  {
    id: '3ph-hw-diode',
    name: '3Φ Half-Wave Uncontrolled Diode Rectifier (3 Diodes)',
    shortName: '3Φ 3-Pulse Diode',
    category: '3-phase-half',
    categoryLabel: '3Φ Half-Wave',
    phase: '3-phase',
    topology: 'half-wave',
    switches: ['diode', 'diode', 'diode'],
    defaultAlpha: 0,
    hasFwd: false,
    description: 'Star-connected 3-phase source with neutral return, 3 diodes, Vdc = 0.827 VmL',
    pulseCount: '3-Pulse',
  },
  {
    id: '3ph-hw-thyristor',
    name: '3Φ Half-Wave Controlled Converter (3 Thyristors)',
    shortName: '3Φ 3-Pulse SCR',
    category: '3-phase-half',
    categoryLabel: '3Φ Half-Wave',
    phase: '3-phase',
    topology: 'half-wave',
    switches: ['thyristor', 'thyristor', 'thyristor'],
    defaultAlpha: 30,
    hasFwd: false,
    description: 'Three thyristors fired at 120° intervals, Vdc = (3√3 Vmp / 2π) cos α',
    pulseCount: '3-Pulse',
  },

  // 3-Phase Full-Bridge (6-Pulse)
  {
    id: '3ph-bridge-diode',
    name: '3Φ Full-Bridge Uncontrolled Diode Rectifier (6 Diodes)',
    shortName: '3Φ 6-Pulse Diode (6D)',
    category: '3-phase-bridge',
    categoryLabel: '3Φ Full-Bridge',
    phase: '3-phase',
    topology: 'full-bridge',
    switches: ['diode', 'diode', 'diode', 'diode', 'diode', 'diode'],
    defaultAlpha: 0,
    hasFwd: false,
    description: 'Industrial 6-diode Graetz bridge, Vdc = 3VmL / π = 1.35 VLL',
    pulseCount: '6-Pulse',
  },
  {
    id: '3ph-bridge-semi',
    name: '3Φ Semi-Converter (Half-Controlled: 3 Thyristors + 3 Diodes)',
    shortName: '3Φ Semi-Converter (3T+3D)',
    category: '3-phase-bridge',
    categoryLabel: '3Φ Full-Bridge',
    phase: '3-phase',
    topology: 'full-bridge',
    switches: ['thyristor', 'thyristor', 'diode', 'thyristor', 'diode', 'thyristor'],
    defaultAlpha: 45,
    hasFwd: false,
    description: '3 top thyristors + 3 bottom diodes with intrinsic freewheeling',
    pulseCount: '6-Pulse',
  },
  {
    id: '3ph-bridge-full',
    name: '3Φ Fully Controlled 6-Pulse Converter (6 Thyristors)',
    shortName: '3Φ Fully Controlled (6 SCR)',
    category: '3-phase-bridge',
    categoryLabel: '3Φ Full-Bridge',
    phase: '3-phase',
    topology: 'full-bridge',
    switches: ['thyristor', 'thyristor', 'thyristor', 'thyristor', 'thyristor', 'thyristor'],
    defaultAlpha: 30,
    hasFwd: false,
    description: 'Industrial two-quadrant 6-pulse SCR bridge for DC drives & HVDC',
    pulseCount: '6-Pulse',
  },
];

interface RectifierSelectorBarProps {
  config: ConverterConfig;
  onSelectOption: (option: RectifierOption) => void;
  onUpdateConfig: (partial: Partial<ConverterConfig>) => void;
}

export const RectifierSelectorBar: React.FC<RectifierSelectorBarProps> = ({
  config,
  onSelectOption,
  onUpdateConfig,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Active category detection
  const currentCategory =
    config.phase === '1-phase'
      ? config.topology === 'half-wave'
        ? '1-phase-half'
        : config.topology === 'center-tapped'
        ? '1-phase-center'
        : '1-phase-bridge'
      : config.topology === 'half-wave'
      ? '3-phase-half'
      : '3-phase-bridge';

  // Find currently matched option if exact
  const currentOption = ALL_RECTIFIER_OPTIONS.find((opt) => {
    if (opt.phase !== config.phase) return false;
    if (opt.topology !== config.topology) return false;
    // Check switch count and thyristor count match
    const optThCount = opt.switches.filter((s) => s === 'thyristor').length;
    const cfgThCount = config.switches.filter((s) => s === 'thyristor').length;
    return optThCount === cfgThCount && opt.hasFwd === config.hasFreewheelingDiode;
  }) || ALL_RECTIFIER_OPTIONS.find((opt) => opt.phase === config.phase && opt.topology === config.topology) || ALL_RECTIFIER_OPTIONS[0];

  const categories = [
    { id: '1-phase-half', label: '1Φ Half-Wave', phase: '1-phase', topology: 'half-wave' },
    { id: '1-phase-center', label: '1Φ Center-Tapped', phase: '1-phase', topology: 'center-tapped' },
    { id: '1-phase-bridge', label: '1Φ Full-Bridge', phase: '1-phase', topology: 'full-bridge' },
    { id: '3-phase-half', label: '3Φ Half-Wave (3-Pulse)', phase: '3-phase', topology: 'half-wave' },
    { id: '3-phase-bridge', label: '3Φ Full-Bridge (6-Pulse)', phase: '3-phase', topology: 'full-bridge' },
  ] as const;

  const currentCategoryOptions = ALL_RECTIFIER_OPTIONS.filter(
    (o) => o.category === currentCategory
  );

  return (
    <div className="w-full bg-[#081226] border-b border-cyan-950/80 px-4 py-2 select-none">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        {/* Left: Prominent Category Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Rectifier Type:</span>
          </div>

          {categories.map((cat) => {
            const isCatActive = currentCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  const defaultOpt = ALL_RECTIFIER_OPTIONS.find(
                    (o) => o.category === cat.id
                  );
                  if (defaultOpt) onSelectOption(defaultOpt);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isCatActive
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-bold'
                    : 'bg-[#0b1730] text-slate-300 hover:text-white hover:bg-[#112347] border border-slate-800'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Sub-type selector (Diode vs SCR vs Semi) + All Converters Dropdown */}
        <div className="flex items-center gap-2 justify-between lg:justify-end flex-wrap">
          {/* Sub-variants for currently selected category */}
          <div className="flex items-center gap-1 bg-[#050b18] p-1 rounded-lg border border-slate-800/80">
            {currentCategoryOptions.map((opt) => {
              const isSelected = currentOption?.id === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onSelectOption(opt)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                  title={opt.description}
                >
                  <span>{opt.shortName}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Dropdown with ALL 12 rectifiers */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e1f3d] hover:bg-[#142a52] text-cyan-300 text-xs font-semibold border border-cyan-800/50 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>All 12 Rectifier Topologies</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-80 max-h-96 overflow-y-auto bg-[#070e1c] border border-cyan-900/80 rounded-xl shadow-2xl p-2 z-40 space-y-1 text-xs">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/60 mb-1 flex items-center justify-between">
                    <span>Choose Any Rectifier Model</span>
                    <span className="text-cyan-400">12 Available</span>
                  </div>

                  {ALL_RECTIFIER_OPTIONS.map((opt) => {
                    const isSelected = currentOption?.id === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          onSelectOption(opt);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg transition-colors flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-700/60'
                            : 'hover:bg-[#0c1833] text-slate-300'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span>{opt.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {opt.description}
                          </p>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 shrink-0 mt-0.5">
                          {opt.pulseCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
