/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Sliders, Check } from 'lucide-react';
import { ConverterConfig, LoadType } from '../types/rectifier';

interface LoadParametersModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ConverterConfig;
  onUpdateConfig: (partial: Partial<ConverterConfig>) => void;
}

export const LoadParametersModal: React.FC<LoadParametersModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#070e1c] border border-cyan-950 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100">
        <div className="p-4 bg-[#0a152d] border-b border-cyan-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">
              Configure Load Circuit
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Load Type Selector */}
          <div>
            <span className="text-slate-400 font-medium block mb-1.5">
              Select Load Type:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {(['R', 'RL', 'RLE', 'constant-current'] as LoadType[]).map((lt) => (
                <button
                  key={lt}
                  onClick={() => onUpdateConfig({ loadType: lt })}
                  className={`py-2 px-1 rounded-lg font-bold text-center transition-all ${
                    config.loadType === lt
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-[#09152b] text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {lt === 'constant-current' ? 'Idc' : lt}
                </button>
              ))}
            </div>
          </div>

          {/* R Slider */}
          {config.loadType !== 'constant-current' && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Resistance (R):</span>
                <span className="font-mono text-cyan-400 font-bold">{config.resistance} Ω</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={config.resistance}
                onChange={(e) => onUpdateConfig({ resistance: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>
          )}

          {/* L Slider */}
          {(config.loadType === 'RL' || config.loadType === 'RLE') && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Inductance (L):</span>
                <span className="font-mono text-amber-400 font-bold">{config.inductance} mH</span>
              </div>
              <input
                type="range"
                min="1"
                max="200"
                value={config.inductance}
                onChange={(e) => onUpdateConfig({ inductance: parseFloat(e.target.value) })}
                className="w-full accent-amber-400"
              />
            </div>
          )}

          {/* Back EMF */}
          {config.loadType === 'RLE' && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Back EMF (E):</span>
                <span className="font-mono text-emerald-400 font-bold">{config.backEmf} V</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={config.backEmf}
                onChange={(e) => onUpdateConfig({ backEmf: parseFloat(e.target.value) })}
                className="w-full accent-emerald-400"
              />
            </div>
          )}

          {/* Constant Current */}
          {config.loadType === 'constant-current' && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">DC Current (Idc):</span>
                <span className="font-mono text-amber-400 font-bold">{config.constantCurrentIdc} A</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={config.constantCurrentIdc}
                onChange={(e) => onUpdateConfig({ constantCurrentIdc: parseFloat(e.target.value) })}
                className="w-full accent-amber-400"
              />
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs mt-3 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply Parameters</span>
          </button>
        </div>
      </div>
    </div>
  );
};
