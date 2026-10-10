/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Gauge,
} from 'lucide-react';

interface AnimationBarProps {
  isAnimating: boolean;
  onToggleAnimation: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onResetCycle: () => void;
  simSpeed: number;
  onChangeSpeed: (speed: number) => void;
  currentAngle: number;
}

export const AnimationBar: React.FC<AnimationBarProps> = ({
  isAnimating,
  onToggleAnimation,
  onStepBack,
  onStepForward,
  onResetCycle,
  simSpeed,
  onChangeSpeed,
  currentAngle,
}) => {
  const speedPills = [0.1, 0.2, 0.5, 1.0, 2.0];

  return (
    <div className="w-full bg-[#070e1c] rounded-xl border border-cyan-950/70 p-3 shadow-lg flex flex-wrap items-center justify-between gap-4 select-none">
      {/* Left: Playback & Step Controls */}
      <div className="flex items-center gap-2">
        {/* Play/Pause Button */}
        <button
          onClick={onToggleAnimation}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm tracking-wide transition-all shadow-md ${
            isAnimating
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
          }`}
        >
          {isAnimating ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Run Real-Time</span>
            </>
          )}
        </button>

        {/* Step Back 5° */}
        <button
          onClick={onStepBack}
          className="p-2 rounded-lg bg-[#0c1830] hover:bg-[#14264b] text-slate-300 hover:text-white border border-slate-700/60 transition-colors shadow-sm"
          title="Step Back 5°"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {/* Step Forward 5° */}
        <button
          onClick={onStepForward}
          className="p-2 rounded-lg bg-[#0c1830] hover:bg-[#14264b] text-slate-300 hover:text-white border border-slate-700/60 transition-colors shadow-sm"
          title="Step Forward 5°"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Reset to 0° */}
        <button
          onClick={onResetCycle}
          className="p-2 rounded-lg bg-[#0c1830] hover:bg-[#14264b] text-slate-300 hover:text-white border border-slate-700/60 transition-colors shadow-sm"
          title="Reset to 0° (Start of Cycle)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Center: Live Angle and Electrical Time Readout */}
      <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#09152b] border border-cyan-950 text-xs">
        <span className="text-slate-400">Phase Angle:</span>
        <span className="font-mono text-cyan-300 font-bold">
          {(((currentAngle % 360) + 360) % 360).toFixed(1)}°
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">Electrical Time:</span>
        <span className="font-mono text-emerald-300 font-bold">
          {(((((currentAngle % 360) + 360) % 360) / 360) * 20).toFixed(2)} ms
        </span>
      </div>

      {/* Right: Simulation Speed Controls */}
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <span>Speed:</span>
        </div>

        <input
          type="range"
          min="0.1"
          max="2.0"
          step="0.1"
          value={simSpeed}
          onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
          className="w-24 accent-cyan-400 cursor-pointer"
        />

        {/* Speed Pills */}
        <div className="flex items-center gap-1 bg-[#09152b] p-0.5 rounded-lg border border-slate-800">
          {speedPills.map((s) => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                Math.abs(simSpeed - s) < 0.05
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
