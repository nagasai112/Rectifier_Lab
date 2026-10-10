/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, BookOpen, Layers, Check, Calculator } from 'lucide-react';
import { DERIVATIONS_LIBRARY, DerivationTopic } from '../physics/derivations';

interface WaveformAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WaveformAnalysisModal: React.FC<WaveformAnalysisModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<DerivationTopic>(
    DERIVATIONS_LIBRARY[0]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#070e1c] border border-cyan-950 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 bg-[#0a152d] border-b border-cyan-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Waveform Analysis &amp; Analytical Derivations
              </h2>
              <p className="text-xs text-slate-400">
                Rigorous mathematical integration, boundary conditions, and calculus derivations for power converters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Topic Navigation Sidebar */}
          <div className="w-full md:w-72 bg-[#050b17] border-b md:border-b-0 md:border-r border-slate-800 p-3 overflow-y-auto space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 block mb-1">
              Select Topology / Topic
            </span>
            {DERIVATIONS_LIBRARY.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedTopic(item)}
                className={`w-full text-left p-2.5 rounded-xl transition-all text-xs font-medium flex flex-col gap-1 ${
                  selectedTopic.id === item.id
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-[#0c1936]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{item.title}</span>
                  <span
                    className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded ${
                      selectedTopic.id === item.id
                        ? 'bg-cyan-800 text-cyan-200'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.category}
                  </span>
                </div>
                <span className="text-[10px] opacity-80 font-mono truncate">
                  {item.formula}
                </span>
              </button>
            ))}
          </div>

          {/* Derivation Detail Content */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {selectedTopic.category}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {selectedTopic.title}
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-2">
                {selectedTopic.summary}
              </p>
            </div>

            {/* Main Analytical Formulas Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#09152b] p-3.5 rounded-xl border border-cyan-900/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Average DC Voltage (V_dc)
                </span>
                <div className="text-sm font-mono font-bold text-emerald-400 bg-[#050e1f] p-2.5 rounded border border-emerald-900/40">
                  {selectedTopic.formula}
                </div>
              </div>

              <div className="bg-[#09152b] p-3.5 rounded-xl border border-cyan-900/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  RMS Output Voltage (V_rms)
                </span>
                <div className="text-xs font-mono font-bold text-cyan-300 bg-[#050e1f] p-2.5 rounded border border-cyan-900/40 break-all">
                  {selectedTopic.rmsFormula}
                </div>
              </div>
            </div>

            {/* Step-by-Step Calculus Integration */}
            <div className="bg-[#081226] p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Step-by-Step Mathematical Derivation</span>
              </h4>

              <div className="space-y-2.5 text-xs text-slate-300">
                {selectedTopic.integralSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="bg-[#040915] p-2 rounded-lg border border-slate-800/80 flex-1 font-mono text-slate-200">
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Engineering Notes */}
            <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-xl text-xs">
              <h4 className="font-bold text-amber-300 mb-2 flex items-center gap-1.5">
                <span>Key Operational Remarks &amp; Circuit Behaviors</span>
              </h4>
              <ul className="list-disc pl-4 space-y-1.5 text-amber-200/80">
                {selectedTopic.notes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
