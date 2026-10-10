/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, BookOpen, CheckCircle, Info, Zap } from 'lucide-react';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#070e1c] border border-cyan-950 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 bg-[#0a152d] border-b border-cyan-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Power Electronics Theory &amp; Converter Principles
              </h2>
              <p className="text-xs text-slate-400">
                Fundamental principles of rectification, thyristor gating, freewheeling action, and harmonics
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
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <section className="bg-[#09152b] p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-cyan-300 mb-2 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>1. Rectification Mechanisms &amp; Quadrants of Operation</span>
            </h3>
            <p className="mb-2">
              Controlled converters use Silicon Controlled Rectifiers (SCR / Thyristors) to adjust the DC output voltage by varying the gate firing angle <span className="text-amber-400 font-mono">α</span>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div className="bg-[#050c18] p-3 rounded border border-slate-800">
                <span className="font-bold text-white block mb-1">Quadrant I (Rectification)</span>
                <p className="text-slate-400 text-[11px]">
                  0° &lt; α &lt; 90°: Average DC voltage <span className="font-mono text-emerald-400">V_dc &gt; 0</span> and current <span className="font-mono text-emerald-400">I_dc &gt; 0</span>. Power flows from the AC utility grid to the DC load.
                </p>
              </div>
              <div className="bg-[#050c18] p-3 rounded border border-slate-800">
                <span className="font-bold text-white block mb-1">Quadrant IV (Inversion)</span>
                <p className="text-slate-400 text-[11px]">
                  90° &lt; α &lt; 180°: With inductive load and an aiding DC EMF, <span className="font-mono text-rose-400">V_dc &lt; 0</span> while <span className="font-mono text-emerald-400">I_dc &gt; 0</span>. Active power is returned from DC back into the AC grid (e.g. regenerative braking).
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-[#09152b] p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-emerald-300 mb-2 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-400" />
              <span>2. Freewheeling Diode (D_FW) &amp; Semi-Converters</span>
            </h3>
            <p className="mb-2">
              When supplying highly inductive loads (like DC motors or electromagnets), stored magnetic energy in inductor <span className="font-mono text-amber-300">L</span> tends to maintain current even when the AC supply voltage swings negative.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-300">
              <li>
                <strong className="text-white">Without FWD:</strong> The thyristor remains forward-biased and conducts negative voltage chunks, reducing net average DC voltage and worsening input power factor.
              </li>
              <li>
                <strong className="text-white">With FWD:</strong> As soon as output voltage tends negative, the freewheeling diode turns on, clamping the load voltage to approx <span className="font-mono text-cyan-300">-V_F ≈ -0.8V</span>, circulating inductor current through the diode, relieving the thyristors and AC source.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-[#09152b] p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-amber-300 mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-amber-400" />
              <span>3. Commutation Overlap &amp; Source Inductance (Ls)</span>
            </h3>
            <p className="mb-2">
              In practical networks, supply transformers and feed lines possess finite leakage inductance <span className="font-mono text-amber-300">Ls</span>. Current cannot jump instantaneously from the outgoing thyristor to incoming thyristor.
            </p>
            <div className="bg-[#050c18] p-3 rounded font-mono text-[11px] text-cyan-300 border border-slate-800">
              Overlap Angle μ: cos(α + μ) = cos(α) - (2·ω·Ls·Idc) / (√2·Vs)
              <br />
              DC Voltage Notch Loss: ΔV_dc = (m·ω·Ls / 2π) · Idc
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-[#09152b] p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-purple-300 mb-2">
              4. Power Quality &amp; Harmonics (IEEE 519 Standard)
            </h3>
            <p>
              Non-sinusoidal AC line currents inject characteristic harmonics (<span className="font-mono text-cyan-300">n = 6k ± 1</span> for 6-pulse bridges: 5th, 7th, 11th, 13th). Total Harmonic Distortion (THD) is reduced through multi-pulse topologies (12-pulse or 24-pulse with phase-shifting transformers) or active power filters (APF).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
