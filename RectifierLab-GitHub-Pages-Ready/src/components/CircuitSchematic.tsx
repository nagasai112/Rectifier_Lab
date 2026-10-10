/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  ConverterConfig,
  DeviceType,
  SimulationPoint,
} from '../types/rectifier';
import {
  Download,
  Activity,
  Layers,
  Zap,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import {
  ALL_RECTIFIER_OPTIONS,
  RectifierOption,
} from './RectifierSelectorBar';

interface CircuitSchematicProps {
  config: ConverterConfig;
  onUpdateConfig: (partial: Partial<ConverterConfig>) => void;
  onSelectOption?: (option: RectifierOption) => void;
  currentPoint?: SimulationPoint;
  isAnimating: boolean;
  onToggleAnimation: () => void;
  schematicMode: 'general' | 'animated';
  onSetSchematicMode: (mode: 'general' | 'animated') => void;
  onOpenLoadModal: () => void;
}

export const CircuitSchematic: React.FC<CircuitSchematicProps> = ({
  config,
  onUpdateConfig,
  onSelectOption,
  currentPoint,
  isAnimating,
  onToggleAnimation,
  schematicMode,
  onSetSchematicMode,
  onOpenLoadModal,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const is3Phase = config.phase === '3-phase';
  const isBridge = config.topology === 'full-bridge';
  const isHalfWave = config.topology === 'half-wave';
  const isCenterTapped = config.topology === 'center-tapped';

  const activeSwitches =
    schematicMode === 'animated' && currentPoint
      ? currentPoint.activeSwitches
      : [];

  // Toggle switch type when user clicks a switch
  const handleToggleSwitch = (index: number) => {
    const currentType = config.switches[index] || 'thyristor';
    const nextType: DeviceType = currentType === 'thyristor' ? 'diode' : 'thyristor';
    const nextSwitches = [...config.switches];
    nextSwitches[index] = nextType;
    onUpdateConfig({ switches: nextSwitches });
  };

  const handleToggleLs = () => {
    if (config.sourceInductanceLs > 0) {
      onUpdateConfig({ sourceInductanceLs: 0 });
    } else {
      onUpdateConfig({ sourceInductanceLs: 2.0 });
    }
  };

  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rectifier-schematic-${config.phase}-${config.topology}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Switch naming helpers
  const getSwitchLabel = (index: number, defaultName: string) => {
    const dev = config.switches[index] || 'thyristor';
    const prefix = dev === 'thyristor' ? 'T' : 'D';
    const num = defaultName.replace(/[^\d]/g, '');
    return `${prefix}${num}`;
  };

  const isSwitchActive = (label: string) => {
    return activeSwitches.some(
      (s) =>
        s === label ||
        s.replace(/[^\d]/g, '') === label.replace(/[^\d]/g, '')
    );
  };

  // Real-time instantaneous values
  const instVo = currentPoint ? currentPoint.vOut.toFixed(1) : '0.0';
  const instIo = currentPoint ? currentPoint.iOut.toFixed(1) : '0.0';

  const topologyTitle = is3Phase
    ? isBridge
      ? '3-PHASE FULL-BRIDGE'
      : '3-PHASE HALF-WAVE (3-PULSE)'
    : isBridge
    ? '1-PHASE FULL-BRIDGE'
    : isCenterTapped
    ? '1-PHASE CENTER-TAPPED'
    : '1-PHASE HALF-WAVE';

  return (
    <div className="flex flex-col h-full bg-[#070e1c] rounded-xl border border-cyan-950/70 shadow-xl overflow-hidden">
      {/* Top Controls Bar */}
      <div className="p-3 bg-[#0a1428] border-b border-cyan-950/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/90 text-cyan-400 border border-cyan-800/40">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 relative">
              <span className="font-semibold text-slate-100 text-sm">
                Circuit Schematic Diagram
              </span>

              {/* Topology badge that doubles as a quick switcher! */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-950/90 text-emerald-400 border border-emerald-700/50 hover:bg-emerald-900/80 transition-colors flex items-center gap-1"
                >
                  <span>{topologyTitle}</span>
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-1 w-64 bg-[#070f20] border border-cyan-800 rounded-xl shadow-2xl p-1.5 z-40 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1 border-b border-slate-800">
                        Switch Topology
                      </div>
                      {ALL_RECTIFIER_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            if (onSelectOption) onSelectOption(opt);
                            else {
                              onUpdateConfig({
                                phase: opt.phase,
                                topology: opt.topology,
                                switches: opt.switches,
                                firingAngle: opt.defaultAlpha,
                                hasFreewheelingDiode: opt.hasFwd,
                              });
                            }
                            setDropdownOpen(false);
                          }}
                          className="w-full text-left px-2 py-1.5 rounded text-[11px] text-slate-300 hover:text-white hover:bg-cyan-950/80 flex items-center justify-between"
                        >
                          <span>{opt.name}</span>
                          <span className="text-[9px] font-mono text-cyan-400">{opt.pulseCount}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Switches point upwards to + rail. Click switch to toggle{' '}
              <span className="text-cyan-300 font-medium">Diode (D)</span> ↔{' '}
              <span className="text-amber-300 font-medium">Thyristor (T)</span>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode switch */}
          <div className="flex items-center bg-[#070f20] p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => onSetSchematicMode('general')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                schematicMode === 'general'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              General Schematic
            </button>
            <button
              onClick={() => onSetSchematicMode('animated')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                schematicMode === 'animated'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>Animated Flow</span>
            </button>
          </div>

          {/* Toggle Ls */}
          <button
            onClick={handleToggleLs}
            className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors flex items-center gap-1 ${
              config.sourceInductanceLs > 0
                ? 'bg-indigo-950/90 text-indigo-300 border-indigo-700'
                : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <span>
              {config.sourceInductanceLs > 0
                ? `Ls = ${config.sourceInductanceLs} mH`
                : '+ Add Ls'}
            </span>
          </button>

          {/* Export SVG */}
          <button
            onClick={handleExportSvg}
            className="p-1.5 rounded-md bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800 transition-colors"
            title="Export Schematic as SVG"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative flex-1 bg-[#050b17] overflow-hidden min-h-[360px] flex items-center justify-center p-2">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Real-time voltage drop notification badge */}
        {schematicMode === 'animated' && currentPoint && (
          <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-[#0a152d]/90 border border-cyan-800/60 backdrop-blur text-[11px] text-slate-300 shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>
              Active Drop:{' '}
              <strong className="text-emerald-400 font-mono">
                {currentPoint.totalDrop.toFixed(1)} V
              </strong>
            </span>
            <span className="text-slate-500">|</span>
            <span>
              Instantaneous Drop Loss:{' '}
              <strong className="text-amber-400 font-mono">
                {(currentPoint.totalDrop * currentPoint.iOut).toFixed(1)} W
              </strong>
            </span>
          </div>
        )}

        {/* SVG Schematic */}
        <svg
          ref={svgRef}
          viewBox="0 0 860 480"
          className="w-full h-full max-h-[460px] select-none"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
        >
          <defs>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. TOPOLOGY: 3-PHASE FULL BRIDGE (6 SWITCHES) */}
          {is3Phase && isBridge && (
            <g id="three-phase-bridge">
              {/* Star-connected source on the left */}
              <circle cx="70" cy="240" r="4" fill="#94a3b8" />
              <text x="50" y="244" fill="#94a3b8" fontSize="12" fontWeight="bold">N</text>
              <text x="40" y="258" fill="#64748b" fontSize="9">STAR</text>

              {/* Source A */}
              <path d="M 70 240 L 100 170" stroke="#ef4444" strokeWidth="2" />
              <circle cx="100" cy="170" r="14" fill="#1e1b4b" stroke="#ef4444" strokeWidth="2" />
              <path d="M 94 170 Q 97 165 100 170 T 106 170" fill="none" stroke="#ef4444" strokeWidth="1.5" />
              <text x="96" y="174" fill="#ffffff" fontSize="11" fontWeight="bold">A</text>
              <text x="90" y="148" fill="#94a3b8" fontSize="9">{config.frequency} Hz</text>

              {/* Source B */}
              <path d="M 70 240 L 100 240" stroke="#f59e0b" strokeWidth="2" />
              <circle cx="100" cy="240" r="14" fill="#1e1b4b" stroke="#f59e0b" strokeWidth="2" />
              <path d="M 94 240 Q 97 235 100 240 T 106 240" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
              <text x="96" y="244" fill="#ffffff" fontSize="11" fontWeight="bold">B</text>
              <text x="90" y="218" fill="#94a3b8" fontSize="9">{config.frequency} Hz</text>

              {/* Source C */}
              <path d="M 70 240 L 100 310" stroke="#3b82f6" strokeWidth="2" />
              <circle cx="100" cy="310" r="14" fill="#1e1b4b" stroke="#3b82f6" strokeWidth="2" />
              <path d="M 94 310 Q 97 305 100 310 T 106 310" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
              <text x="96" y="314" fill="#ffffff" fontSize="11" fontWeight="bold">C</text>
              <text x="90" y="288" fill="#94a3b8" fontSize="9">{config.frequency} Hz</text>

              <text x="40" y="355" fill="#64748b" fontSize="10" fontWeight="bold">Star-Connected 3-Phase Source</text>
              <text x="45" y="370" fill="#475569" fontSize="9">Y-Configuration (Star Point N)</text>

              {/* Ls blocks */}
              <g className="cursor-pointer" onClick={handleToggleLs}>
                <title>Click to toggle source inductance</title>
                <path d="M 114 170 L 175 170" stroke="#ef4444" strokeWidth="2" />
                <rect x="120" y="161" width="50" height="18" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                <text x="125" y="174" fill={config.sourceInductanceLs > 0 ? '#38bdf8' : '#64748b'} fontSize="9">
                  {config.sourceInductanceLs > 0 ? `Ls=${config.sourceInductanceLs}mH` : 'Ls Bypassed'}
                </text>

                <path d="M 114 240 L 225 240" stroke="#f59e0b" strokeWidth="2" />
                <rect x="120" y="231" width="50" height="18" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                <text x="125" y="244" fill={config.sourceInductanceLs > 0 ? '#38bdf8' : '#64748b'} fontSize="9">
                  {config.sourceInductanceLs > 0 ? `Ls=${config.sourceInductanceLs}mH` : 'Ls Bypassed'}
                </text>

                <path d="M 114 310 L 275 310" stroke="#3b82f6" strokeWidth="2" />
                <rect x="120" y="301" width="50" height="18" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                <text x="125" y="314" fill={config.sourceInductanceLs > 0 ? '#38bdf8' : '#64748b'} fontSize="9">
                  {config.sourceInductanceLs > 0 ? `Ls=${config.sourceInductanceLs}mH` : 'Ls Bypassed'}
                </text>
              </g>

              {/* Rails */}
              <path d="M 195 90 L 590 90" stroke="#94a3b8" strokeWidth="2" />
              <circle cx="590" cy="90" r="3.5" fill="#38bdf8" />
              <text x="598" y="94" fill="#38bdf8" fontSize="12" fontWeight="bold">+ Vo</text>

              <path d="M 195 390 L 590 390" stroke="#94a3b8" strokeWidth="2" />
              <circle cx="590" cy="390" r="3.5" fill="#38bdf8" />
              <text x="598" y="394" fill="#38bdf8" fontSize="12" fontWeight="bold">- Vo (GND)</text>

              {/* Legs */}
              <path d="M 175 170 L 195 170 L 195 130 M 195 170 L 195 350" stroke="#ef4444" strokeWidth="2" />
              <circle cx="195" cy="170" r="4" fill="#ef4444" />

              <path d="M 225 240 L 280 240 L 280 130 M 280 240 L 280 350" stroke="#f59e0b" strokeWidth="2" />
              <circle cx="280" cy="240" r="4" fill="#f59e0b" />

              <path d="M 275 310 L 365 310 L 365 130 M 365 310 L 365 350" stroke="#3b82f6" strokeWidth="2" />
              <circle cx="365" cy="310" r="4" fill="#3b82f6" />

              <path d="M 195 90 L 195 95 M 280 90 L 280 95 M 365 90 L 365 95" stroke="#94a3b8" strokeWidth="2" />
              <path d="M 195 385 L 195 390 M 280 385 L 280 390 M 365 385 L 365 390" stroke="#94a3b8" strokeWidth="2" />

              {/* 6 Switches */}
              <SwitchSymbol x={195} y={112} label={getSwitchLabel(0, 'T1')} phaseText="Ph A" deviceType={config.switches[0] || 'thyristor'} isActive={isSwitchActive(getSwitchLabel(0, 'T1'))} onClick={() => handleToggleSwitch(0)} forwardDrop={config.forwardVoltageDrop} />
              <SwitchSymbol x={280} y={112} label={getSwitchLabel(1, 'T3')} phaseText="Ph B" deviceType={config.switches[1] || 'thyristor'} isActive={isSwitchActive(getSwitchLabel(1, 'T3'))} onClick={() => handleToggleSwitch(1)} forwardDrop={config.forwardVoltageDrop} />
              <SwitchSymbol x={365} y={112} label={getSwitchLabel(2, 'D5')} phaseText="Ph C" deviceType={config.switches[2] || 'diode'} isActive={isSwitchActive(getSwitchLabel(2, 'D5'))} onClick={() => handleToggleSwitch(2)} forwardDrop={config.forwardVoltageDrop} />

              <SwitchSymbol x={195} y={368} label={getSwitchLabel(3, 'T4')} phaseText="Ph A" deviceType={config.switches[3] || 'thyristor'} isActive={isSwitchActive(getSwitchLabel(3, 'T4'))} onClick={() => handleToggleSwitch(3)} forwardDrop={config.forwardVoltageDrop} />
              <SwitchSymbol x={280} y={368} label={getSwitchLabel(4, 'D6')} phaseText="Ph B" deviceType={config.switches[4] || 'diode'} isActive={isSwitchActive(getSwitchLabel(4, 'D6'))} onClick={() => handleToggleSwitch(4)} forwardDrop={config.forwardVoltageDrop} />
              <SwitchSymbol x={365} y={368} label={getSwitchLabel(5, 'T2')} phaseText="Ph C" deviceType={config.switches[5] || 'thyristor'} isActive={isSwitchActive(getSwitchLabel(5, 'T2'))} onClick={() => handleToggleSwitch(5)} forwardDrop={config.forwardVoltageDrop} />

              {/* FWD Branch */}
              <FreewheelingBranch hasFwd={config.hasFreewheelingDiode} onToggle={() => onUpdateConfig({ hasFreewheelingDiode: !config.hasFreewheelingDiode })} isActive={currentPoint?.activeSwitches.includes('D_FW') || false} x={465} />

              {/* Load Box */}
              <LoadBox x={540} y={150} config={config} onClickChange={onOpenLoadModal} instVo={instVo} instIo={instIo} />
            </g>
          )}

          {/* 2. TOPOLOGY: 3-PHASE HALF-WAVE (3-PULSE, 3 SWITCHES, NEUTRAL RETURN) */}
          {is3Phase && isHalfWave && (
            <g id="three-phase-halfwave">
              {/* Star-connected source on the left with Neutral wire */}
              <circle cx="70" cy="240" r="4" fill="#38bdf8" />
              <text x="50" y="244" fill="#38bdf8" fontSize="12" fontWeight="bold">N</text>
              <text x="40" y="258" fill="#64748b" fontSize="9">NEUTRAL</text>

              {/* Source A */}
              <path d="M 70 240 L 100 150" stroke="#ef4444" strokeWidth="2" />
              <circle cx="100" cy="150" r="14" fill="#1e1b4b" stroke="#ef4444" strokeWidth="2" />
              <text x="96" y="154" fill="#ffffff" fontSize="11" fontWeight="bold">A</text>

              {/* Source B */}
              <path d="M 70 240 L 100 240" stroke="#f59e0b" strokeWidth="2" />
              <circle cx="100" cy="240" r="14" fill="#1e1b4b" stroke="#f59e0b" strokeWidth="2" />
              <text x="96" y="244" fill="#ffffff" fontSize="11" fontWeight="bold">B</text>

              {/* Source C */}
              <path d="M 70 240 L 100 330" stroke="#3b82f6" strokeWidth="2" />
              <circle cx="100" cy="330" r="14" fill="#1e1b4b" stroke="#3b82f6" strokeWidth="2" />
              <text x="96" y="334" fill="#ffffff" fontSize="11" fontWeight="bold">C</text>

              <text x="35" y="380" fill="#64748b" fontSize="10" fontWeight="bold">3-Pulse Half-Wave Star</text>
              <text x="45" y="395" fill="#475569" fontSize="9">Neutral Return Line</text>

              {/* Positive DC Bus on Top */}
              <path d="M 200 90 L 590 90" stroke="#94a3b8" strokeWidth="2" />
              <circle cx="590" cy="90" r="3.5" fill="#38bdf8" />
              <text x="598" y="94" fill="#38bdf8" fontSize="12" fontWeight="bold">+ Vo</text>

              {/* Neutral Return Bus on Bottom (connected to star point N) */}
              <path d="M 70 240 L 70 410 L 590 410" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 3" />
              <circle cx="590" cy="410" r="3.5" fill="#38bdf8" />
              <text x="598" y="414" fill="#38bdf8" fontSize="12" fontWeight="bold">- Vo (N)</text>

              {/* Switch 1: Phase A */}
              <path d="M 114 150 L 200 150 L 200 130" stroke="#ef4444" strokeWidth="2" />
              <path d="M 200 90 L 200 95" stroke="#94a3b8" strokeWidth="2" />
              <SwitchSymbol x={200} y={112} label={getSwitchLabel(0, 'T1')} phaseText="Ph A" deviceType={config.switches[0] || 'thyristor'} isActive={isSwitchActive(getSwitchLabel(0, 'T1'))} onClick={() => handleToggleSwitch(0)} forwardDrop={config.forwardVoltageDrop} />

              {/* Switch 2: Phase B */}
              <path d="M 114 240 L 290 240 L 290 130" stroke="#f59e0b" strokeWidth="2" />
              <path d="M 290 90 L 290 95" stroke="#94a3b8" strokeWidth="2" />
              <SwitchSymbol x={290} y={112} label={getSwitchLabel(1, 'T2')} phaseText="Ph B" deviceType={config.switches[1] || 'thyristor'} isActive={isSwitchActive(getSwitchLabel(1, 'T2'))} onClick={() => handleToggleSwitch(1)} forwardDrop={config.forwardVoltageDrop} />

              {/* Switch 3: Phase C */}
              <path d="M 114 330 L 380 330 L 380 130" stroke="#3b82f6" strokeWidth="2" />
              <path d="M 380 90 L 380 95" stroke="#94a3b8" strokeWidth="2" />
              <SwitchSymbol x={380} y={112} label={getSwitchLabel(2, 'T3')} phaseText="Ph C" deviceType={config.switches[2] || 'thyristor'} isActive={isSwitchActive(getSwitchLabel(2, 'T3'))} onClick={() => handleToggleSwitch(2)} forwardDrop={config.forwardVoltageDrop} />

              {/* FWD Branch */}
              <FreewheelingBranch hasFwd={config.hasFreewheelingDiode} onToggle={() => onUpdateConfig({ hasFreewheelingDiode: !config.hasFreewheelingDiode })} isActive={currentPoint?.activeSwitches.includes('D_FW') || false} x={465} yTop={90} yBottom={410} />

              {/* Load Box */}
              <LoadBox x={540} y={150} config={config} onClickChange={onOpenLoadModal} instVo={instVo} instIo={instIo} />
            </g>
          )}

          {/* 3. TOPOLOGY: 1-PHASE FULL-BRIDGE (H-BRIDGE 4 SWITCHES) */}
          {!is3Phase && isBridge && (
            <g id="single-phase-bridge">
              {/* AC Source */}
              <circle cx="90" cy="240" r="18" fill="#1e1b4b" stroke="#38bdf8" strokeWidth="2.5" />
              <path d="M 82 240 Q 86 233 90 240 T 98 240" fill="none" stroke="#38bdf8" strokeWidth="2" />
              <text x="75" y="272" fill="#94a3b8" fontSize="10">{config.sourceRms}V RMS</text>
              <text x="78" y="285" fill="#64748b" fontSize="9">{config.frequency} Hz</text>

              {/* Source Inductance Ls */}
              <g className="cursor-pointer" onClick={handleToggleLs}>
                <title>Click to toggle source inductance</title>
                <path d="M 108 240 L 160 240" stroke="#38bdf8" strokeWidth="2" />
                <rect x="115" y="231" width="50" height="18" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                <text x="120" y="244" fill={config.sourceInductanceLs > 0 ? '#38bdf8' : '#64748b'} fontSize="9">
                  {config.sourceInductanceLs > 0 ? `Ls=${config.sourceInductanceLs}mH` : 'Ls Bypassed'}
                </text>
              </g>

              {/* Top and Bottom DC rails */}
              <path d="M 220 90 L 590 90" stroke="#94a3b8" strokeWidth="2" />
              <circle cx="590" cy="90" r="3.5" fill="#38bdf8" />
              <text x="598" y="94" fill="#38bdf8" fontSize="12" fontWeight="bold">+ Vo</text>

              <path d="M 220 390 L 590 390" stroke="#94a3b8" strokeWidth="2" />
              <circle cx="590" cy="390" r="3.5" fill="#38bdf8" />
              <text x="598" y="394" fill="#38bdf8" fontSize="12" fontWeight="bold">- Vo (GND)</text>

              {/* Leg 1: (T1 top, T4 bottom) */}
              <path d="M 90 222 L 90 170 L 220 170" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="220" cy="170" r="4" fill="#38bdf8" />
              <path d="M 220 170 L 220 130 M 220 170 L 220 350" stroke="#38bdf8" strokeWidth="2" />
              <path d="M 220 90 L 220 95 M 220 385 L 220 390" stroke="#94a3b8" strokeWidth="2" />

              <SwitchSymbol x={220} y={112} label={getSwitchLabel(0, 'T1')} phaseText="Leg A" deviceType={config.switches[0] || 'thyristor'} isActive={isSwitchActive(getSwitchLabel(0, 'T1'))} onClick={() => handleToggleSwitch(0)} forwardDrop={config.forwardVoltageDrop} />
              <SwitchSymbol x={220} y={368} label={getSwitchLabel(3, 'T4')} phaseText="Leg A" deviceType={config.switches[3] || 'thyristor'} isActive={isSwitchActive(getSwitchLabel(3, 'T4'))} onClick={() => handleToggleSwitch(3)} forwardDrop={config.forwardVoltageDrop} />

              {/* Leg 2: (T3 top, T2 bottom) */}
              <path d="M 160 240 L 330 240" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="330" cy="240" r="4" fill="#38bdf8" />
              <path d="M 330 240 L 330 130 M 330 240 L 330 350" stroke="#38bdf8" strokeWidth="2" />
              <path d="M 330 90 L 330 95 M 330 385 L 330 390" stroke="#94a3b8" strokeWidth="2" />

              <SwitchSymbol x={330} y={112} label={getSwitchLabel(2, 'T3')} phaseText="Leg B" deviceType={config.switches[2] || 'thyristor'} isActive={isSwitchActive(getSwitchLabel(2, 'T3'))} onClick={() => handleToggleSwitch(2)} forwardDrop={config.forwardVoltageDrop} />
              <SwitchSymbol x={330} y={368} label={getSwitchLabel(1, 'T2')} phaseText="Leg B" deviceType={config.switches[1] || 'thyristor'} isActive={isSwitchActive(getSwitchLabel(1, 'T2'))} onClick={() => handleToggleSwitch(1)} forwardDrop={config.forwardVoltageDrop} />

              {/* FWD Branch */}
              <FreewheelingBranch hasFwd={config.hasFreewheelingDiode} onToggle={() => onUpdateConfig({ hasFreewheelingDiode: !config.hasFreewheelingDiode })} isActive={currentPoint?.activeSwitches.includes('D_FW') || false} x={440} />

              {/* Load Box */}
              <LoadBox x={530} y={150} config={config} onClickChange={onOpenLoadModal} instVo={instVo} instIo={instIo} />
            </g>
          )}

          {/* 4. TOPOLOGY: 1-PHASE CENTER-TAPPED (MID-POINT 2 SWITCHES) */}
          {!is3Phase && isCenterTapped && (
            <g id="center-tapped-transformer">
              {/* Transformer Primary */}
              <rect x="70" y="180" width="20" height="120" rx="3" fill="#1e1b4b" stroke="#38bdf8" strokeWidth="1.5" />
              <path d="M 50 200 L 70 200 M 50 280 L 70 280" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="45" cy="240" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
              <text x="38" y="244" fill="#ffffff" fontSize="10">AC</text>

              {/* Transformer Core Plates */}
              <line x1="98" y1="170" x2="98" y2="310" stroke="#64748b" strokeWidth="2" />
              <line x1="102" y1="170" x2="102" y2="310" stroke="#64748b" strokeWidth="2" />

              {/* Transformer Secondary with Center Tap N */}
              <rect x="110" y="160" width="20" height="160" rx="3" fill="#1e1b4b" stroke="#38bdf8" strokeWidth="1.5" />

              {/* Secondary Upper Tap -> T1 */}
              <path d="M 130 180 L 240 180 L 240 130" stroke="#38bdf8" strokeWidth="2" />
              {/* Secondary Lower Tap -> T2 */}
              <path d="M 130 300 L 240 300 L 240 350" stroke="#38bdf8" strokeWidth="2" />

              {/* Center Tap Neutral N -> - Vo (GND) */}
              <path d="M 130 240 L 590 240" stroke="#38bdf8" strokeWidth="2" strokeDasharray="5 3" />
              <circle cx="130" cy="240" r="3.5" fill="#38bdf8" />
              <text x="140" y="235" fill="#38bdf8" fontSize="11" fontWeight="bold">Center Tap N</text>
              <circle cx="590" cy="240" r="3.5" fill="#38bdf8" />
              <text x="598" y="244" fill="#38bdf8" fontSize="12" fontWeight="bold">- Vo (N GND)</text>

              {/* Positive Rail joining T1 and T2 cathodes */}
              <path d="M 240 90 L 590 90" stroke="#94a3b8" strokeWidth="2" />
              <circle cx="590" cy="90" r="3.5" fill="#38bdf8" />
              <text x="598" y="94" fill="#38bdf8" fontSize="12" fontWeight="bold">+ Vo</text>

              <path d="M 240 90 L 240 95 M 340 90 L 340 95" stroke="#94a3b8" strokeWidth="2" />
              <path d="M 240 90 L 340 90" stroke="#94a3b8" strokeWidth="2" />

              {/* Upper Switch T1 / D1 */}
              <SwitchSymbol x={240} y={112} label={getSwitchLabel(0, 'T1')} phaseText="+ Half" deviceType={config.switches[0] || 'thyristor'} isActive={isSwitchActive(getSwitchLabel(0, 'T1'))} onClick={() => handleToggleSwitch(0)} forwardDrop={config.forwardVoltageDrop} />

              {/* Lower Switch T2 / D2 */}
              <path d="M 240 350 L 340 350 L 340 130" stroke="#38bdf8" strokeWidth="2" />
              <SwitchSymbol x={340} y={112} label={getSwitchLabel(1, 'T2')} phaseText="- Half" deviceType={config.switches[1] || 'thyristor'} isActive={isSwitchActive(getSwitchLabel(1, 'T2'))} onClick={() => handleToggleSwitch(1)} forwardDrop={config.forwardVoltageDrop} />

              {/* FWD Branch */}
              <FreewheelingBranch hasFwd={config.hasFreewheelingDiode} onToggle={() => onUpdateConfig({ hasFreewheelingDiode: !config.hasFreewheelingDiode })} isActive={currentPoint?.activeSwitches.includes('D_FW') || false} x={450} yTop={90} yBottom={240} />

              {/* Load Box */}
              <LoadBox x={530} y={100} config={config} onClickChange={onOpenLoadModal} instVo={instVo} instIo={instIo} />
            </g>
          )}

          {/* 5. TOPOLOGY: 1-PHASE HALF-WAVE (1 SWITCH) */}
          {!is3Phase && isHalfWave && (
            <g id="single-phase-halfwave">
              {/* AC Source */}
              <circle cx="100" cy="240" r="20" fill="#1e1b4b" stroke="#38bdf8" strokeWidth="2.5" />
              <path d="M 90 240 Q 95 230 100 240 T 110 240" fill="none" stroke="#38bdf8" strokeWidth="2" />
              <text x="80" y="278" fill="#94a3b8" fontSize="10">{config.sourceRms}V RMS</text>
              <text x="85" y="292" fill="#64748b" fontSize="9">{config.frequency} Hz</text>

              {/* Positive wire to switch */}
              <path d="M 100 220 L 100 110 L 260 110" stroke="#38bdf8" strokeWidth="2" />

              {/* Return wire */}
              <path d="M 100 260 L 100 390 L 590 390" stroke="#94a3b8" strokeWidth="2" />
              <circle cx="590" cy="390" r="3.5" fill="#38bdf8" />
              <text x="598" y="394" fill="#38bdf8" fontSize="12" fontWeight="bold">- Vo (GND)</text>

              {/* Switch T1 / D1 */}
              <SwitchSymbol x={260} y={112} label={getSwitchLabel(0, 'T1')} phaseText="Phase A" deviceType={config.switches[0] || 'thyristor'} isActive={isSwitchActive(getSwitchLabel(0, 'T1'))} onClick={() => handleToggleSwitch(0)} forwardDrop={config.forwardVoltageDrop} />

              {/* Positive DC output rail */}
              <path d="M 260 90 L 590 90" stroke="#94a3b8" strokeWidth="2" />
              <circle cx="590" cy="90" r="3.5" fill="#38bdf8" />
              <text x="598" y="94" fill="#38bdf8" fontSize="12" fontWeight="bold">+ Vo</text>

              {/* FWD Branch */}
              <FreewheelingBranch hasFwd={config.hasFreewheelingDiode} onToggle={() => onUpdateConfig({ hasFreewheelingDiode: !config.hasFreewheelingDiode })} isActive={currentPoint?.activeSwitches.includes('D_FW') || false} x={430} />

              {/* Load Box */}
              <LoadBox x={530} y={150} config={config} onClickChange={onOpenLoadModal} instVo={instVo} instIo={instIo} />
            </g>
          )}
        </svg>
      </div>

      {/* Schematic Bottom Status Bar */}
      <div className="p-2.5 bg-[#0a1428] border-t border-cyan-950/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-400">
            {schematicMode === 'general' ? (
              <>
                <strong className="text-slate-200">General Schematic Mode:</strong>{' '}
                Clean diagram without live highlights. Start animation to view
                real-time current flow &amp; device conduction.
              </>
            ) : (
              <>
                <strong className="text-amber-300">Animated Conduction Flow:</strong>{' '}
                Active switches illuminated with instantaneous forward drop{' '}
                <span className="text-emerald-400 font-mono font-bold">
                  {currentPoint ? `${currentPoint.totalDrop.toFixed(1)}V` : ''}
                </span>
                .
              </>
            )}
          </span>
        </div>

        <button
          onClick={() => {
            if (schematicMode === 'general') {
              onSetSchematicMode('animated');
            }
            onToggleAnimation();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all shadow-md ${
            isAnimating
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
          }`}
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>{isAnimating ? 'Pause Animation' : 'Start Animating'}</span>
        </button>
      </div>
    </div>
  );
};

/**
 * Reusable Freewheeling Diode Branch Component
 */
const FreewheelingBranch: React.FC<{
  hasFwd: boolean;
  onToggle: () => void;
  isActive: boolean;
  x: number;
  yTop?: number;
  yBottom?: number;
}> = ({ hasFwd, onToggle, isActive, x, yTop = 90, yBottom = 390 }) => {
  return (
    <g className="cursor-pointer" onClick={onToggle}>
      <title>Click to connect / disconnect Freewheeling Diode</title>
      <path
        d={`M ${x} ${yTop} L ${x} ${yBottom}`}
        stroke={hasFwd ? '#94a3b8' : '#334155'}
        strokeDasharray={hasFwd ? 'none' : '4 4'}
        strokeWidth="1.5"
      />
      <rect
        x={x - 25}
        y={(yTop + yBottom) / 2 - 25}
        width="50"
        height="50"
        rx="6"
        fill="#091326"
        stroke={hasFwd ? '#38bdf8' : '#334155'}
        strokeWidth={hasFwd ? '1.5' : '1'}
        opacity={hasFwd ? 1 : 0.6}
      />
      <path
        d={`M ${x - 12} ${(yTop + yBottom) / 2 + 6} L ${x + 12} ${
          (yTop + yBottom) / 2 + 6
        } L ${x} ${(yTop + yBottom) / 2 - 12} Z`}
        fill={isActive ? '#00f5a0' : hasFwd ? '#38bdf8' : '#475569'}
      />
      <path
        d={`M ${x - 12} ${(yTop + yBottom) / 2 - 12} L ${x + 12} ${
          (yTop + yBottom) / 2 - 12
        }`}
        stroke={isActive ? '#00f5a0' : hasFwd ? '#38bdf8' : '#475569'}
        strokeWidth="2"
      />
      <text
        x={x}
        y={(yTop + yBottom) / 2 - 30}
        textAnchor="middle"
        fill={hasFwd ? '#38bdf8' : '#64748b'}
        fontSize="10"
        fontWeight="bold"
      >
        D_FW
      </text>
      <text
        x={x}
        y={(yTop + yBottom) / 2 + 38}
        textAnchor="middle"
        fill={hasFwd ? '#10b981' : '#475569'}
        fontSize="8"
        fontWeight="bold"
      >
        {hasFwd ? 'CONNECTED' : 'DISCONNECTED'}
      </text>
    </g>
  );
};

/**
 * Reusable Switch Symbol SVG Subcomponent (Diode or Thyristor)
 */
interface SwitchSymbolProps {
  x: number;
  y: number;
  label: string;
  phaseText: string;
  deviceType: DeviceType;
  isActive: boolean;
  onClick: () => void;
  forwardDrop: number;
}

const SwitchSymbol: React.FC<SwitchSymbolProps> = ({
  x,
  y,
  label,
  phaseText,
  deviceType,
  isActive,
  onClick,
  forwardDrop,
}) => {
  const isThyristor = deviceType === 'thyristor';

  return (
    <g
      className="cursor-pointer group"
      onClick={onClick}
      transform={`translate(${x - 30}, ${y - 30})`}
    >
      <rect
        x="0"
        y="0"
        width="60"
        height="60"
        rx="8"
        fill={isActive ? '#062d2d' : '#0a162d'}
        stroke={
          isActive
            ? '#00f5a0'
            : isThyristor
            ? '#38bdf8'
            : '#94a3b8'
        }
        strokeWidth={isActive ? '2.5' : '1.5'}
        className="transition-all duration-150 group-hover:stroke-amber-400"
        filter={isActive ? 'url(#glow-cyan)' : 'none'}
      />

      <text
        x="30"
        y="12"
        textAnchor="middle"
        fill={isActive ? '#00f5a0' : '#ffffff'}
        fontSize="11"
        fontWeight="bold"
      >
        {label}
      </text>
      <text
        x="30"
        y="21"
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="8"
      >
        {phaseText}
      </text>

      <path
        d="M 18 42 L 42 42 L 30 25 Z"
        fill={isActive ? '#00f5a0' : isThyristor ? '#38bdf8' : '#94a3b8'}
      />
      <path
        d="M 18 25 L 42 25"
        stroke={isActive ? '#00f5a0' : isThyristor ? '#38bdf8' : '#94a3b8'}
        strokeWidth="2"
      />

      {isThyristor && (
        <g>
          <path
            d="M 22 36 L 10 44"
            stroke={isActive ? '#f59e0b' : '#38bdf8'}
            strokeWidth="1.5"
          />
          <circle cx="10" cy="44" r="2" fill={isActive ? '#f59e0b' : '#38bdf8'} />
          <text x="3" y="44" fill="#94a3b8" fontSize="8" fontWeight="bold">
            G
          </text>
        </g>
      )}

      <text
        x="30"
        y="54"
        textAnchor="middle"
        fill={isActive ? '#00f5a0' : '#64748b'}
        fontSize="8"
        fontWeight="bold"
      >
        {isThyristor ? 'SCR' : 'DIODE'}
      </text>

      {isActive && (
        <g transform="translate(0, -12)">
          <rect
            x="8"
            y="-2"
            width="44"
            height="14"
            rx="3"
            fill="#052e16"
            stroke="#10b981"
            strokeWidth="1"
          />
          <text
            x="30"
            y="9"
            textAnchor="middle"
            fill="#34d399"
            fontSize="8"
            fontWeight="bold"
            fontFamily="monospace"
          >
            -{forwardDrop.toFixed(1)}V
          </text>
        </g>
      )}
    </g>
  );
};

/**
 * Reusable Load Box SVG Subcomponent
 */
interface LoadBoxProps {
  x: number;
  y: number;
  config: ConverterConfig;
  onClickChange: () => void;
  instVo: string;
  instIo: string;
}

const LoadBox: React.FC<LoadBoxProps> = ({
  x,
  y,
  config,
  onClickChange,
  instVo,
  instIo,
}) => {
  const isRL = config.loadType === 'RL';
  const isRLE = config.loadType === 'RLE';
  const isR = config.loadType === 'R';
  const isIdc = config.loadType === 'constant-current';

  return (
    <g
      className="cursor-pointer group"
      onClick={onClickChange}
      transform={`translate(${x}, ${y})`}
    >
      <rect
        x="0"
        y="0"
        width="110"
        height="180"
        rx="10"
        fill="#071224"
        stroke="#38bdf8"
        strokeWidth="1.5"
        className="transition-all duration-150 group-hover:stroke-amber-400"
      />

      <g transform="translate(15, 8)">
        <rect x="0" y="0" width="80" height="14" rx="4" fill="#0f213d" />
        <text
          x="40"
          y="10"
          textAnchor="middle"
          fill="#38bdf8"
          fontSize="7.5"
          fontWeight="bold"
        >
          ↻ Click to Change
        </text>
      </g>

      <text
        x="55"
        y="38"
        textAnchor="middle"
        fill="#00f5a0"
        fontSize="12"
        fontWeight="bold"
      >
        {isR && 'R Load'}
        {isRL && 'RL Load'}
        {isRLE && 'RLE Load'}
        {isIdc && 'Idc Source'}
      </text>

      {(isR || isRL || isRLE) && (
        <g transform="translate(30, 48)">
          <path
            d="M 5 8 L 15 2 L 25 14 L 35 2 L 45 14 L 50 8"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
          />
          <text
            x="25"
            y="24"
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize="9"
            fontWeight="bold"
          >
            R = {config.resistance} Ω
          </text>
        </g>
      )}

      {(isRL || isRLE) && (
        <g transform="translate(30, 80)">
          <path
            d="M 5 10 Q 15 0 25 10 Q 35 0 45 10"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
          />
          <text
            x="25"
            y="24"
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize="9"
            fontWeight="bold"
          >
            L = {config.inductance} mH
          </text>
        </g>
      )}

      {isRLE && (
        <g transform="translate(30, 114)">
          <path d="M 15 6 L 35 6" stroke="#10b981" strokeWidth="2.5" />
          <path d="M 20 12 L 30 12" stroke="#10b981" strokeWidth="1.5" />
          <text
            x="25"
            y="24"
            textAnchor="middle"
            fill="#10b981"
            fontSize="9"
            fontWeight="bold"
          >
            E = {config.backEmf} V
          </text>
        </g>
      )}

      {isIdc && (
        <g transform="translate(35, 75)">
          <circle cx="20" cy="15" r="14" fill="none" stroke="#f59e0b" strokeWidth="2" />
          <path d="M 20 8 L 20 22 M 16 17 L 20 22 L 24 17" stroke="#f59e0b" strokeWidth="2" />
          <text x="20" y="44" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold">
            {config.constantCurrentIdc} A
          </text>
        </g>
      )}

      <g transform="translate(10, 148)">
        <rect x="0" y="0" width="90" height="22" rx="4" fill="#040b17" stroke="#1e293b" />
        <text
          x="45"
          y="14"
          textAnchor="middle"
          fill="#38bdf8"
          fontSize="9"
          fontFamily="monospace"
        >
          {instVo}V / {instIo}A
        </text>
      </g>
    </g>
  );
};
