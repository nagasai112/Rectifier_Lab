/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Zap,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  BookOpen,
  Sparkles,
  FileText,
  RotateCcw,
  BarChart2,
} from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  onOpenDerivations: () => void;
  onOpenPresets: () => void;
  onOpenTheory: () => void;
  onOpenExportDashboard: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDark,
  onToggleTheme,
  isFullScreen,
  onToggleFullScreen,
  onOpenDerivations,
  onOpenPresets,
  onOpenTheory,
  onOpenExportDashboard,
  onReset,
}) => {
  return (
    <header className="w-full bg-[#070e1c] border-b border-cyan-950/60 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-slate-100 select-none shadow-md">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#071328] rounded-[10px] flex items-center justify-center text-cyan-400">
              <Zap className="w-5 h-5 fill-cyan-400 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1 font-mono">
              Rectifier<span className="text-cyan-400">Lab</span>
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-700/40">
              Power Electronics Studio
            </span>
          </div>
        </div>
        <div className="hidden lg:block h-4 w-px bg-slate-700/60" />
        <span className="hidden lg:inline text-xs text-slate-400 font-medium">
          Interactive Single-Phase &amp; Three-Phase Diode/Thyristor Bridge Converter Simulation
        </span>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex items-center flex-wrap gap-2 text-xs">
        {/* Light/Dark Toggle */}
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e1b30] hover:bg-[#152744] text-slate-300 hover:text-white border border-slate-700/60 transition-colors shadow-sm"
          title="Toggle Theme"
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        {/* Full Screen */}
        <button
          onClick={onToggleFullScreen}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e1b30] hover:bg-[#152744] text-slate-300 hover:text-white border border-slate-700/60 transition-colors shadow-sm"
          title="Toggle Fullscreen"
        >
          {isFullScreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Exit Fullscreen</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full Screen Studio</span>
            </>
          )}
        </button>

        {/* Waveform Analysis & Derivations (Highlighted Gold/Yellow button) */}
        <button
          onClick={onOpenDerivations}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/50 transition-colors font-medium shadow-sm shadow-amber-950/40"
        >
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>Waveform Analysis &amp; Derivations</span>
        </button>

        {/* Analytical Study & Export Dashboard */}
        <button
          onClick={onOpenExportDashboard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 hover:text-teal-200 border border-teal-500/40 transition-colors font-medium shadow-sm"
          title="Analytical Dashboard & Study Report"
        >
          <BarChart2 className="w-3.5 h-3.5 text-teal-400" />
          <span>Study Dashboard</span>
        </button>

        {/* Presets */}
        <button
          onClick={onOpenPresets}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e1b30] hover:bg-[#152744] text-slate-300 hover:text-white border border-slate-700/60 transition-colors shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Presets</span>
        </button>

        {/* Theory */}
        <button
          onClick={onOpenTheory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e1b30] hover:bg-[#152744] text-slate-300 hover:text-white border border-slate-700/60 transition-colors shadow-sm"
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
          <span>Theory</span>
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="p-1.5 rounded-lg bg-[#0e1b30] hover:bg-[#152744] text-slate-300 hover:text-rose-400 border border-slate-700/60 transition-colors shadow-sm"
          title="Reset to Default Parameters"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
