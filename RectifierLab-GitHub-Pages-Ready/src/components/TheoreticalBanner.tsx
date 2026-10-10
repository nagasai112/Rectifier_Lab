/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SimulationResult, ConverterConfig } from '../types/rectifier';
import { BookOpen, Sparkles, AlertCircle } from 'lucide-react';

interface TheoreticalBannerProps {
  config: ConverterConfig;
  simulation: SimulationResult;
  onOpenDerivations: () => void;
}

export const TheoreticalBanner: React.FC<TheoreticalBannerProps> = ({
  config,
  simulation,
  onOpenDerivations,
}) => {
  const diffDrop = simulation.idealVdcTheory - simulation.vDcAvg;

  return (
    <div className="w-full bg-[#070e1c] rounded-xl border border-cyan-950/70 p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none">
      {/* Left: Description & Title */}
      <div className="flex items-start gap-3 flex-1">
        <div className="p-2 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/40 mt-0.5">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-slate-100">
              {simulation.theoreticalSubtitle}
            </h4>
            <button
              onClick={onOpenDerivations}
              className="text-[11px] text-amber-400 hover:text-amber-300 underline font-semibold flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>View Derivation</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Analytical equations reflect lossless idealized switching, compared
            with numerical ODE integration accounting for component forward drops &amp; commutation overlap.
          </p>
        </div>
      </div>

      {/* Right: Theoretical Formula & Ideal vs Actual Values */}
      <div className="flex items-center gap-4 flex-wrap bg-[#050b18] px-4 py-2.5 rounded-lg border border-slate-800/80">
        {/* Theoretical Formula */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Theoretical Formula
          </span>
          <div className="text-xs font-mono font-bold text-cyan-300 bg-[#09152e] px-2.5 py-1 rounded border border-cyan-900/50">
            {simulation.theoreticalFormula}
          </div>
        </div>

        {/* Ideal Theoretical V_dc */}
        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Ideal Theoretical V_DC
          </span>
          <span className="text-lg font-bold font-mono text-emerald-400">
            {simulation.idealVdcTheory.toFixed(1)}{' '}
            <span className="text-xs text-slate-400 font-normal">V</span>
          </span>
        </div>

        {/* Real-time drop delta */}
        <div className="hidden lg:block pl-3 border-l border-slate-800 text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Drop &amp; Overlap ΔV
          </span>
          <span className="text-sm font-bold font-mono text-amber-400">
            -{diffDrop.toFixed(1)}{' '}
            <span className="text-xs text-slate-400 font-normal">V</span>
          </span>
        </div>
      </div>
    </div>
  );
};
