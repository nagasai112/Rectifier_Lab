/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Sparkles, ArrowRight, Check } from 'lucide-react';
import { LAB_PRESETS, PresetConfig } from '../physics/presets';
import { ConverterConfig } from '../types/rectifier';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (config: ConverterConfig) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  const categories = ['3-Phase', '1-Phase', 'Advanced Studies'] as const;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#070e1c] border border-cyan-950 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 bg-[#0a152d] border-b border-cyan-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Curated Laboratory Presets
              </h2>
              <p className="text-xs text-slate-400">
                1-click simulations of canonical Power Electronics converter experiments and industrial systems
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6">
          {categories.map((cat) => {
            const presets = LAB_PRESETS.filter((p) => p.category === cat);
            if (!presets.length) return null;

            return (
              <div key={cat}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3">
                  {cat} Experiments
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {presets.map((p) => (
                    <div
                      key={p.id}
                      className="bg-[#09152b] hover:bg-[#0c1c3a] border border-slate-800 hover:border-cyan-600/60 p-4 rounded-xl transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="font-bold text-slate-100 text-sm group-hover:text-cyan-300 transition-colors">
                            {p.name}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                          {p.description}
                        </p>

                        <div className="space-y-1 mb-3">
                          {p.highlights.map((h, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1.5 text-[11px] text-slate-300"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onSelectPreset(p.config);
                          onClose();
                        }}
                        className="w-full mt-2 py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <span>Load This Setup</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
