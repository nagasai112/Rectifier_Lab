/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SimulationResult } from '../types/rectifier';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface MetricsCardsProps {
  simulation: SimulationResult;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ simulation }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full select-none">
      {/* 1. Avg DC Voltage */}
      <div className="bg-[#070e1c] rounded-xl border border-cyan-950/70 p-3 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-400">Avg DC Voltage</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/40">
            V_dc
          </span>
        </div>
        <div className="my-1">
          <span className="text-xl lg:text-2xl font-bold font-mono text-white tracking-tight">
            {simulation.vDcAvg.toFixed(1)}
          </span>
          <span className="text-xs text-slate-400 ml-1 font-semibold">V</span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-800/60 pt-1.5 mt-1">
          <span>V_rms =</span>
          <span className="text-slate-300 font-semibold">{simulation.vRms.toFixed(1)} V</span>
        </div>
      </div>

      {/* 2. Avg DC Current */}
      <div className="bg-[#070e1c] rounded-xl border border-cyan-950/70 p-3 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-400">Avg DC Current</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
            I_dc
          </span>
        </div>
        <div className="my-1">
          <span className="text-xl lg:text-2xl font-bold font-mono text-emerald-400 tracking-tight">
            {simulation.iDcAvg.toFixed(2)}
          </span>
          <span className="text-xs text-slate-400 ml-1 font-semibold">A</span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-800/60 pt-1.5 mt-1">
          <span>I_rms =</span>
          <span className="text-slate-300 font-semibold">{simulation.iRms.toFixed(2)} A</span>
        </div>
      </div>

      {/* 3. Output Power */}
      <div className="bg-[#070e1c] rounded-xl border border-cyan-950/70 p-3 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-400">Output Power</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800/40">
            P_load
          </span>
        </div>
        <div className="my-1">
          <span className="text-xl lg:text-2xl font-bold font-mono text-amber-400 tracking-tight">
            {simulation.pLoad.toFixed(1)}
          </span>
          <span className="text-xs text-slate-400 ml-1 font-semibold">W</span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-800/60 pt-1.5 mt-1">
          <span>S_in =</span>
          <span className="text-slate-300 font-semibold">{simulation.sIn.toFixed(0)} VA</span>
        </div>
      </div>

      {/* 4. Power Factor */}
      <div className="bg-[#070e1c] rounded-xl border border-cyan-950/70 p-3 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-400">Power Factor</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-400 border border-purple-800/40">
            PF
          </span>
        </div>
        <div className="my-1">
          <span className="text-xl lg:text-2xl font-bold font-mono text-purple-300 tracking-tight">
            {simulation.powerFactor.toFixed(3)}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-800/60 pt-1.5 mt-1">
          <span>cos(φ1) =</span>
          <span className="text-slate-300 font-semibold">{simulation.displacementFactor.toFixed(3)}</span>
        </div>
      </div>

      {/* 5. Ripple Factor */}
      <div className="bg-[#070e1c] rounded-xl border border-cyan-950/70 p-3 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-400">Ripple Factor</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800/40">
            RF
          </span>
        </div>
        <div className="my-1">
          <span className="text-xl lg:text-2xl font-bold font-mono text-rose-400 tracking-tight">
            {simulation.rippleFactor.toFixed(3)}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-800/60 pt-1.5 mt-1">
          <span>Form Factor FF =</span>
          <span className="text-slate-300 font-semibold">{simulation.formFactor.toFixed(2)}</span>
        </div>
      </div>

      {/* 6. Source THD_i */}
      <div className="bg-[#070e1c] rounded-xl border border-cyan-950/70 p-3 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-400">Source THD_i</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/40">
            THD
          </span>
        </div>
        <div className="my-1">
          <span className="text-xl lg:text-2xl font-bold font-mono text-cyan-400 tracking-tight">
            {simulation.sourceThdCurrent.toFixed(1)}
          </span>
          <span className="text-xs text-slate-400 ml-1 font-semibold">%</span>
        </div>
        <div className="text-[11px] font-medium flex items-center justify-between border-t border-slate-800/60 pt-1.5 mt-1">
          {simulation.isContinuous ? (
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>CCM Continuous</span>
            </span>
          ) : (
            <span className="text-amber-400 flex items-center gap-1 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>DCM Discontinuous</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
