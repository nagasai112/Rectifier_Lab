/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ConverterConfig,
  SimulationPoint,
  SimulationResult,
  WaveformViewMode,
} from '../types/rectifier';
import {
  Download,
  Maximize2,
  ZoomIn,
  Grid,
  Zap,
  Sliders,
  BarChart3,
  Waves,
  Eye,
  EyeOff,
} from 'lucide-react';

interface WaveformDisplayProps {
  config: ConverterConfig;
  onUpdateConfig: (partial: Partial<ConverterConfig>) => void;
  simulation: SimulationResult;
  currentAngle: number;
  onAngleChange: (angle: number) => void;
}

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  config,
  onUpdateConfig,
  simulation,
  currentAngle,
  onAngleChange,
}) => {
  const [viewMode, setViewMode] = useState<WaveformViewMode>('superimposed');
  const [showLineVoltages, setShowLineVoltages] = useState(true);
  const [showPhaseVoltages, setShowPhaseVoltages] = useState(false);
  const [showLineCurrent, setShowLineCurrent] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showVavg, setShowVavg] = useState(true);
  const [showDropHighlight, setShowDropHighlight] = useState(true);
  const [zoomFactor, setZoomFactor] = useState<1 | 2 | 4>(1);
  const [numCycles, setNumCycles] = useState<1 | 2>(1);

  // Oscilloscope channel states
  const [ch1VoltsDiv, setCh1VoltsDiv] = useState(100); // 100 V/div
  const [ch2AmpsDiv, setCh2AmpsDiv] = useState(5); // 5 A/div
  const [timeDivMs, setTimeDivMs] = useState(2); // 2 ms/div

  const svgRef = useRef<SVGSVGElement | null>(null);

  const is3Phase = config.phase === '3-phase';
  const points = simulation.points;
  const numPoints = points.length;

  if (numPoints === 0) return null;

  // Find instantaneous index based on currentAngle
  const normAngle = ((currentAngle % 360) + 360) % 360;
  const currentIndex = Math.min(
    numPoints - 1,
    Math.max(0, Math.round((normAngle / 360) * (numPoints - 1)))
  );
  const currentPt = points[currentIndex] || points[0];

  // Quick preset angles
  const quickAngles = [0, 30, 45, 60, 90, 120, 150];

  // Chart layout dimensions
  const width = 860;
  const heightTop = 230; // Voltage plot
  const heightBottom = 160; // Current plot
  const timelineHeight = 34; // Active pair timeline
  const padding = { top: 25, bottom: 25, left: 65, right: 35 };

  const plotWidth = width - padding.left - padding.right;

  // Dynamic max voltage and current scaling based on simulated peak
  const peakV = is3Phase ? Math.sqrt(2) * config.sourceRms : Math.sqrt(2) * config.sourceRms;
  const maxV = Math.max(250, Math.ceil((peakV * 1.15) / 50) * 50);

  let peakI = 5;
  for (const p of points) {
    if (Math.abs(p.iOut) > peakI) peakI = Math.abs(p.iOut);
    if (Math.abs(p.iSourceA) > peakI) peakI = Math.abs(p.iSourceA);
  }
  const maxI = Math.max(10, Math.ceil((peakI * 1.25) / 5) * 5);

  const yScaleV = (v: number) => {
    const clamped = Math.max(-maxV, Math.min(maxV, v));
    const zeroY = padding.top + (heightTop - padding.top - padding.bottom) / 2;
    const spanY = (heightTop - padding.top - padding.bottom) / 2;
    return zeroY - (clamped / maxV) * spanY;
  };

  const yScaleI = (iVal: number) => {
    const clamped = Math.max(-maxI, Math.min(maxI, iVal));
    const zeroY = padding.top + (heightBottom - padding.top - padding.bottom) / 2;
    const spanY = (heightBottom - padding.top - padding.bottom) / 2;
    return zeroY - (clamped / maxI) * spanY;
  };

  const xScale = (deg: number) => {
    const totalDeg = 360 * numCycles;
    return padding.left + (deg / totalDeg) * plotWidth;
  };

  // Helper to generate SVG path string from points array
  const createPath = (
    pts: SimulationPoint[],
    getY: (p: SimulationPoint) => number
  ) => {
    if (!pts.length) return '';
    let d = '';
    for (let c = 0; c < numCycles; c++) {
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const deg = p.wtDeg + c * 360;
        const x = xScale(deg);
        const y = getY(p);
        if (c === 0 && i === 0) {
          d += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
        } else {
          d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
      }
    }
    return d;
  };

  // Paths
  const pathVo = createPath(points, (p) => yScaleV(p.vOut));
  const pathVoIdeal = createPath(points, (p) => yScaleV(p.vOutIdeal));
  const pathIo = createPath(points, (p) => yScaleI(p.iOut));
  const pathIsA = createPath(points, (p) => yScaleI(p.iSourceA));

  // Reference lines for 3-phase or 1-phase
  const pathVAB = is3Phase ? createPath(points, (p) => yScaleV(p.vAB || 0)) : '';
  const pathVBC = is3Phase ? createPath(points, (p) => yScaleV(p.vBC || 0)) : '';
  const pathVCA = is3Phase ? createPath(points, (p) => yScaleV(p.vCA || 0)) : '';

  const pathVA = createPath(points, (p) => yScaleV(p.vA));
  const pathVB = is3Phase ? createPath(points, (p) => yScaleV(p.vB || 0)) : '';
  const pathVC = is3Phase ? createPath(points, (p) => yScaleV(p.vC || 0)) : '';

  // Conduction active device timeline intervals
  const conductionIntervals: {
    startDeg: number;
    endDeg: number;
    devices: string;
    color: string;
  }[] = [];

  const palette = [
    '#312e81',
    '#1e293b',
    '#4338ca',
    '#0f766e',
    '#14532d',
    '#701a75',
    '#3b0764',
  ];

  if (points.length > 0) {
    let currentDevices = points[0].activeSwitches.join(' ') || 'NONE';
    let startDeg = 0;
    let colorIdx = 0;

    for (let i = 1; i < points.length; i++) {
      const devStr = points[i].activeSwitches.join(' ') || 'NONE';
      if (devStr !== currentDevices) {
        conductionIntervals.push({
          startDeg,
          endDeg: points[i].wtDeg,
          devices: currentDevices,
          color: palette[colorIdx % palette.length],
        });
        currentDevices = devStr;
        startDeg = points[i].wtDeg;
        colorIdx++;
      }
    }
    conductionIntervals.push({
      startDeg,
      endDeg: 360,
      devices: currentDevices,
      color: palette[colorIdx % palette.length],
    });
  }

  // Handle export SVG
  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rectifier-waveforms-${config.phase}-${config.topology}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#070e1c] rounded-xl border border-cyan-950/70 shadow-xl overflow-hidden">
      {/* Top Controls Toolbar matching Screenshot 1 */}
      <div className="p-3 bg-[#0a1428] border-b border-cyan-950/60 flex flex-col gap-2.5 text-xs">
        {/* Row 1: View Modes & Alpha quick controls */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* View Modes */}
          <div className="flex items-center bg-[#070f20] p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('superimposed')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'superimposed'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span>Superimposed</span>
            </button>
            <button
              onClick={() => setViewMode('oscilloscope')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'oscilloscope'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Oscilloscope Channels</span>
            </button>
            <button
              onClick={() => setViewMode('harmonics')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'harmonics'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Harmonics (FFT)</span>
            </button>
          </div>

          {/* Firing Angle α Quick Controls (with +/- and quick degree pills) */}
          <div className="flex items-center gap-2 bg-[#070f20] px-2.5 py-1 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>α:</span>
            </div>
            <button
              onClick={() =>
                onUpdateConfig({ firingAngle: Math.max(0, config.firingAngle - 5) })
              }
              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
            >
              -
            </button>
            <input
              type="range"
              min="0"
              max="180"
              step="1"
              value={config.firingAngle}
              onChange={(e) =>
                onUpdateConfig({ firingAngle: parseFloat(e.target.value) })
              }
              className="w-20 accent-amber-500 cursor-pointer"
            />
            <button
              onClick={() =>
                onUpdateConfig({ firingAngle: Math.min(180, config.firingAngle + 5) })
              }
              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
            >
              +
            </button>
            <span className="min-w-8 text-center px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
              {config.firingAngle}°
            </span>

            {/* Quick Degree Pills */}
            <div className="hidden sm:flex items-center gap-1 ml-1">
              {quickAngles.map((deg) => (
                <button
                  key={deg}
                  onClick={() => onUpdateConfig({ firingAngle: deg })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    config.firingAngle === deg
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Channel switches & display options */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {is3Phase && (
              <button
                onClick={() => setShowLineVoltages(!showLineVoltages)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
                  showLineVoltages
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700'
                    : 'bg-slate-900/60 text-slate-500 border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Line (V_LL)</span>
              </button>
            )}

            <button
              onClick={() => setShowPhaseVoltages(!showPhaseVoltages)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
                showPhaseVoltages
                  ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                  : 'bg-slate-900/60 text-slate-500 border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Phase (V_ph)</span>
            </button>

            <button
              onClick={() => setShowLineCurrent(!showLineCurrent)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
                showLineCurrent
                  ? 'bg-purple-950/80 text-purple-300 border-purple-700'
                  : 'bg-slate-900/60 text-slate-500 border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>i_a (Line A)</span>
            </button>

            {/* Show Drop Highlight Toggle */}
            <button
              onClick={() => setShowDropHighlight(!showDropHighlight)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
                showDropHighlight
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                  : 'bg-slate-900/60 text-slate-500 border-slate-800'
              }`}
              title="Visualize Voltage Drop across semiconductors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Drop Highlight</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Zoom Controls */}
            <div className="flex items-center bg-[#070f20] px-1.5 py-0.5 rounded-lg border border-slate-800 text-[10px]">
              <ZoomIn className="w-3 h-3 text-slate-400 mr-1" />
              <button
                onClick={() => setZoomFactor(1)}
                className={`px-1.5 py-0.5 rounded ${
                  zoomFactor === 1 ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
                }`}
              >
                1x
              </button>
              <button
                onClick={() => setZoomFactor(2)}
                className={`px-1.5 py-0.5 rounded ${
                  zoomFactor === 2 ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
                }`}
              >
                2x
              </button>
              <button
                onClick={() => setZoomFactor(4)}
                className={`px-1.5 py-0.5 rounded ${
                  zoomFactor === 4 ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
                }`}
              >
                4x
              </button>
            </div>

            {/* 1 or 2 Cycles */}
            <button
              onClick={() => setNumCycles(numCycles === 1 ? 2 : 1)}
              className="px-2 py-1 rounded-md bg-[#070f20] border border-slate-800 text-slate-300 hover:text-white text-[11px]"
            >
              {numCycles === 1 ? '1 Cycle (360°)' : '2 Cycles (720°)'}
            </button>

            {/* Grid */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-1.5 rounded-md border transition-colors ${
                showGrid
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title="Toggle Grid Lines"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>

            {/* V_avg */}
            <button
              onClick={() => setShowVavg(!showVavg)}
              className={`px-2 py-1 rounded-md border text-[11px] font-medium transition-colors ${
                showVavg
                  ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title="Toggle Average DC Voltage Line"
            >
              V_avg
            </button>

            {/* Export SVG */}
            <button
              onClick={handleExportSvg}
              className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
              title="Export Waveforms SVG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Waveforms Canvas / SVG Area */}
      <div className="relative flex-1 bg-[#040812] overflow-hidden flex flex-col justify-between">
        {viewMode === 'superimposed' && (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${heightTop + heightBottom + timelineHeight + 20}`}
            className="w-full h-full select-none"
          >
            {/* Defs */}
            <defs>
              <linearGradient id="vo-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00f5a0" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#00f5a0" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="io-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff9e00" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#ff9e00" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* 1. TOP GRAPH: VOLTAGE WAVEFORMS */}
            <g id="voltage-plot">
              {/* Title & Legend */}
              <text
                x={padding.left}
                y={18}
                fill="#ffffff"
                fontSize="12"
                fontWeight="bold"
              >
                {is3Phase
                  ? 'Voltage Waveforms [Line-to-Line Voltages v_LL & v_o]'
                  : 'Voltage Waveforms [Source Voltage v_s(t) & Load Voltage v_o(t)]'}
              </text>
              <text
                x={width - padding.right}
                y={18}
                textAnchor="end"
                fill="#64748b"
                fontSize="11"
                fontWeight="bold"
              >
                [V]
              </text>

              {/* Grid Lines & Labels */}
              {showGrid && (
                <g opacity="0.3">
                  {(() => {
                    const vStep = maxV >= 500 ? 200 : maxV >= 250 ? 100 : 50;
                    const ticks: number[] = [];
                    for (let val = -Math.floor(maxV / vStep) * vStep; val <= maxV; val += vStep) {
                      ticks.push(val);
                    }
                    return ticks;
                  })().map((v) => {
                    const y = yScaleV(v);
                    return (
                      <g key={v}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={width - padding.right}
                          y2={y}
                          stroke={v === 0 ? '#64748b' : '#1e293b'}
                          strokeWidth={v === 0 ? '1.5' : '1'}
                          strokeDasharray={v === 0 ? 'none' : '3 3'}
                        />
                        <text
                          x={padding.left - 8}
                          y={y + 4}
                          textAnchor="end"
                          fill="#64748b"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {v}V
                        </text>
                      </g>
                    );
                  })}

                  {/* Vertical angle lines (0, 90, 180, 270, 360, etc.) */}
                  {[0, 90, 180, 270, 360].map((deg) => {
                    const x = xScale(deg);
                    return (
                      <g key={deg}>
                        <line
                          x1={x}
                          y1={padding.top}
                          x2={x}
                          y2={heightTop - padding.bottom}
                          stroke="#1e293b"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                        <text
                          x={x}
                          y={heightTop - padding.bottom + 14}
                          textAnchor="middle"
                          fill="#64748b"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {deg}°
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Source Reference Voltages (Dotted/Dashed Sinusoids) */}
              {is3Phase && showLineVoltages && (
                <g opacity="0.4" strokeDasharray="4 4" strokeWidth="1.2">
                  <path d={pathVAB} fill="none" stroke="#f59e0b" />
                  <path d={pathVBC} fill="none" stroke="#3b82f6" />
                  <path d={pathVCA} fill="none" stroke="#ec4899" />
                </g>
              )}

              {showPhaseVoltages && (
                <g opacity="0.35" strokeDasharray="2 3" strokeWidth="1">
                  <path d={pathVA} fill="none" stroke="#ef4444" />
                  {is3Phase && <path d={pathVB} fill="none" stroke="#f59e0b" />}
                  {is3Phase && <path d={pathVC} fill="none" stroke="#3b82f6" />}
                </g>
              )}

              {/* Ideal output voltage comparison (optional subtle outline) */}
              {showDropHighlight && config.forwardVoltageDrop > 0 && (
                <path
                  d={pathVoIdeal}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.5"
                />
              )}

              {/* Highlighted Output Voltage v_o(t) */}
              <path
                d={pathVo}
                fill="none"
                stroke="#00f5a0"
                strokeWidth="2.8"
                filter="drop-shadow(0 0 6px rgba(0,245,160,0.5))"
              />

              {/* Average DC Voltage Line V_avg */}
              {showVavg && (
                <g>
                  <line
                    x1={padding.left}
                    y1={yScaleV(simulation.vDcAvg)}
                    x2={width - padding.right}
                    y2={yScaleV(simulation.vDcAvg)}
                    stroke="#a855f7"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                  />
                  <rect
                    x={width - padding.right - 85}
                    y={yScaleV(simulation.vDcAvg) - 10}
                    width="80"
                    height="18"
                    rx="3"
                    fill="#1e1035"
                    stroke="#a855f7"
                    strokeWidth="1"
                  />
                  <text
                    x={width - padding.right - 45}
                    y={yScaleV(simulation.vDcAvg) + 2}
                    textAnchor="middle"
                    fill="#d8b4fe"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    V_avg={simulation.vDcAvg.toFixed(1)}V
                  </text>
                </g>
              )}

              {/* Vertical scrub cursor line */}
              <line
                x1={xScale(normAngle)}
                y1={padding.top}
                x2={xScale(normAngle)}
                y2={heightTop - padding.bottom}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />
              <circle
                cx={xScale(normAngle)}
                cy={yScaleV(currentPt.vOut)}
                r="4"
                fill="#00f5a0"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>

            {/* 2. BOTTOM GRAPH: CURRENT WAVEFORMS */}
            <g
              id="current-plot"
              transform={`translate(0, ${heightTop})`}
            >
              {/* Title & Legend */}
              <text
                x={padding.left}
                y={18}
                fill="#ffffff"
                fontSize="12"
                fontWeight="bold"
              >
                {is3Phase
                  ? 'Current Waveforms [Load i_o(t) & Phase A Line Current i_a(t)]'
                  : 'Current Waveforms [Load Current i_o(t) & Source Current i_s(t)]'}
              </text>
              <text
                x={width - padding.right}
                y={18}
                textAnchor="end"
                fill="#64748b"
                fontSize="11"
                fontWeight="bold"
              >
                [A]
              </text>

              {/* Grid Lines & Labels */}
              {showGrid && (
                <g opacity="0.3">
                  {(() => {
                    const iStep = maxI >= 40 ? 10 : maxI >= 20 ? 5 : 2;
                    const ticks: number[] = [];
                    for (let val = -Math.floor(maxI / iStep) * iStep; val <= maxI; val += iStep) {
                      ticks.push(val);
                    }
                    return ticks;
                  })().map((iVal) => {
                    const y = yScaleI(iVal);
                    return (
                      <g key={iVal}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={width - padding.right}
                          y2={y}
                          stroke={iVal === 0 ? '#64748b' : '#1e293b'}
                          strokeWidth={iVal === 0 ? '1.5' : '1'}
                          strokeDasharray={iVal === 0 ? 'none' : '3 3'}
                        />
                        <text
                          x={padding.left - 8}
                          y={y + 4}
                          textAnchor="end"
                          fill="#64748b"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {iVal}A
                        </text>
                      </g>
                    );
                  })}

                  {/* Vertical angle lines */}
                  {[0, 90, 180, 270, 360].map((deg) => {
                    const x = xScale(deg);
                    return (
                      <line
                        key={deg}
                        x1={x}
                        y1={padding.top}
                        x2={x}
                        y2={heightBottom - padding.bottom}
                        stroke="#1e293b"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                    );
                  })}
                </g>
              )}

              {/* Phase A Line Current i_a(t) (Purple) */}
              {showLineCurrent && (
                <path
                  d={pathIsA}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.2"
                  filter="drop-shadow(0 0 4px rgba(56,189,248,0.5))"
                />
              )}

              {/* Load Current i_o(t) (Golden Amber) */}
              <path
                d={pathIo}
                fill="none"
                stroke="#ffaa00"
                strokeWidth="2.8"
                filter="drop-shadow(0 0 6px rgba(255,170,0,0.5))"
              />

              {/* Firing gate trigger pulses (Yellow marker blocks) */}
              {points
                .filter((p) => p.gateTriggered.length > 0)
                .map((p, idx) => {
                  const x = xScale(p.wtDeg);
                  return (
                    <g key={idx}>
                      <rect
                        x={x - 8}
                        y={heightBottom - padding.bottom - 12}
                        width="16"
                        height="8"
                        rx="1.5"
                        fill="#eab308"
                      />
                    </g>
                  );
                })}

              {/* Vertical scrub cursor line */}
              <line
                x1={xScale(normAngle)}
                y1={padding.top}
                x2={xScale(normAngle)}
                y2={heightBottom - padding.bottom}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />
              <circle
                cx={xScale(normAngle)}
                cy={yScaleI(currentPt.iOut)}
                r="4"
                fill="#ffaa00"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>

            {/* 3. ACTIVE PAIR CONDUCTION TIMELINE RIBBON (Image 1 Bottom) */}
            <g
              id="conduction-timeline"
              transform={`translate(0, ${heightTop + heightBottom + 5})`}
            >
              {/* Active Pair Label */}
              <text
                x={padding.left - 10}
                y={18}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="9"
                fontWeight="bold"
              >
                ACTIVE
              </text>
              <text
                x={padding.left - 10}
                y={28}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="9"
                fontWeight="bold"
              >
                PAIR
              </text>

              {/* Segments */}
              {conductionIntervals.map((interval, idx) => {
                const xStart = xScale(interval.startDeg);
                const xEnd = xScale(interval.endDeg);
                const w = Math.max(1, xEnd - xStart);
                const isCurActive =
                  normAngle >= interval.startDeg && normAngle < interval.endDeg;

                return (
                  <g key={idx}>
                    <rect
                      x={xStart}
                      y={4}
                      width={w}
                      height={24}
                      fill={interval.color}
                      stroke={isCurActive ? '#00f5a0' : '#1e293b'}
                      strokeWidth={isCurActive ? '2' : '0.5'}
                      opacity={isCurActive ? 1 : 0.75}
                    />
                    {w > 26 && (
                      <text
                        x={xStart + w / 2}
                        y={19}
                        textAnchor="middle"
                        fill={isCurActive ? '#ffffff' : '#cbd5e1'}
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {interval.devices}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Live Cursor marker on timeline */}
              <line
                x1={xScale(normAngle)}
                y1={0}
                x2={xScale(normAngle)}
                y2={30}
                stroke="#00f5a0"
                strokeWidth="2.5"
              />
            </g>
          </svg>
        )}

        {/* 2. OSCILLOSCOPE CHANNELS VIEW */}
        {viewMode === 'oscilloscope' && (
          <div className="p-4 flex flex-col h-full justify-between">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-xs">
              <div className="bg-[#09152b] p-3 rounded-lg border border-cyan-800/40">
                <span className="font-bold text-cyan-400 block mb-1">
                  CH 1 (VOLTAGE)
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Scale:</span>
                  <select
                    value={ch1VoltsDiv}
                    onChange={(e) => setCh1VoltsDiv(Number(e.target.value))}
                    className="bg-[#050c18] border border-slate-700 rounded px-2 py-1 text-slate-200"
                  >
                    <option value="50">50 V/div</option>
                    <option value="100">100 V/div</option>
                    <option value="200">200 V/div</option>
                  </select>
                </div>
                <div className="mt-2 text-slate-300">
                  V_pk = <span className="font-mono text-cyan-300">{(simulation.vRms * 1.414).toFixed(1)} V</span>
                </div>
              </div>

              <div className="bg-[#09152b] p-3 rounded-lg border border-amber-800/40">
                <span className="font-bold text-amber-400 block mb-1">
                  CH 2 (CURRENT)
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Scale:</span>
                  <select
                    value={ch2AmpsDiv}
                    onChange={(e) => setCh2AmpsDiv(Number(e.target.value))}
                    className="bg-[#050c18] border border-slate-700 rounded px-2 py-1 text-slate-200"
                  >
                    <option value="2">2 A/div</option>
                    <option value="5">5 A/div</option>
                    <option value="10">10 A/div</option>
                  </select>
                </div>
                <div className="mt-2 text-slate-300">
                  I_pk = <span className="font-mono text-amber-300">{(simulation.iRms * 1.5).toFixed(1)} A</span>
                </div>
              </div>

              <div className="bg-[#09152b] p-3 rounded-lg border border-slate-700/60">
                <span className="font-bold text-slate-300 block mb-1">
                  TIMEBASE &amp; TRIGGER
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Time/div:</span>
                  <span className="font-mono text-slate-200">2.0 ms / div</span>
                </div>
                <div className="mt-2 text-slate-300">
                  Trigger: <span className="text-emerald-400">Line Sync (50 Hz)</span>
                </div>
              </div>
            </div>

            {/* Simulated CRT Screen */}
            <div className="flex-1 bg-[#010906] rounded-xl border-2 border-emerald-900/60 p-4 relative overflow-hidden flex items-center justify-center">
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #00f5a0 1px, transparent 1px), linear-gradient(to bottom, #00f5a0 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
              <svg viewBox="0 0 800 240" className="w-full h-full">
                <path d={pathVo} fill="none" stroke="#00f5a0" strokeWidth="2" />
                <path d={pathIo} fill="none" stroke="#ffaa00" strokeWidth="2" />
              </svg>
            </div>
          </div>
        )}

        {/* 3. HARMONICS (FFT) VIEW */}
        {viewMode === 'harmonics' && (
          <div className="p-4 flex flex-col h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-slate-200">
                Harmonic Spectrum of Input Current i_a(t) [Fourier FFT]
              </span>
              <span className="px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                Source THD_i = {simulation.sourceThdCurrent.toFixed(1)}%
              </span>
            </div>

            {/* Bar chart of harmonics */}
            <div className="h-48 bg-[#061021] rounded-lg p-3 border border-slate-800 flex items-end justify-between gap-1">
              {simulation.harmonics.slice(0, 15).map((h) => {
                const heightPct = Math.min(100, Math.max(3, h.iPercent));
                const isCharacteristic =
                  is3Phase
                    ? [5, 7, 11, 13].includes(h.order)
                    : [3, 5, 7, 9].includes(h.order);

                return (
                  <div
                    key={h.order}
                    className="flex-1 flex flex-col items-center gap-1 group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-[10px] text-white px-2 py-0.5 rounded border border-slate-700 pointer-events-none z-10 whitespace-nowrap">
                      Order {h.order}: {h.iPercent.toFixed(1)}% ({h.freq}Hz)
                    </div>

                    <div
                      className={`w-full rounded-t transition-all ${
                        h.order === 1
                          ? 'bg-emerald-500'
                          : isCharacteristic
                          ? 'bg-cyan-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] text-slate-400 font-mono">
                      n={h.order}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Harmonics table summary */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {simulation.harmonics.slice(0, 4).map((h) => (
                <div
                  key={h.order}
                  className="bg-[#08142b] p-2 rounded border border-slate-800"
                >
                  <span className="text-slate-400 block">
                    {h.order === 1 ? 'Fundamental (50Hz)' : `Harmonic n=${h.order}`}
                  </span>
                  <span className="text-cyan-300 font-mono font-bold">
                    {h.iMag.toFixed(2)} A ({h.iPercent.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Angle wt Scrubber Slider at bottom (Screenshot 1 Bottom) */}
      <div className="p-2.5 bg-[#0a1428] border-t border-cyan-950/60 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 min-w-28 text-cyan-400 font-semibold">
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Angle ωt:</span>
        </div>

        <input
          type="range"
          min="0"
          max="360"
          step="0.5"
          value={normAngle}
          onChange={(e) => onAngleChange(parseFloat(e.target.value))}
          className="flex-1 accent-cyan-400 cursor-pointer"
        />

        <div className="min-w-20 text-right">
          <span className="px-2 py-0.5 rounded bg-cyan-950/90 text-cyan-300 font-mono font-bold border border-cyan-800/60">
            {normAngle.toFixed(1)}°
          </span>
        </div>
      </div>
    </div>
  );
};
