/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  Printer,
  Copy,
  Check,
  BarChart2,
  Table,
  Zap,
} from 'lucide-react';
import { ConverterConfig, SimulationResult } from '../types/rectifier';

interface ExportDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ConverterConfig;
  simulation: SimulationResult;
}

export const ExportDashboardModal: React.FC<ExportDashboardModalProps> = ({
  isOpen,
  onClose,
  config,
  simulation,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'harmonics' | 'losses'>('metrics');

  if (!isOpen) return null;

  // Handle Export CSV
  const handleExportCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent +=
      'Time (s),Angle (deg),Source_VA (V),V_Out (V),V_Out_Ideal (V),I_Out (A),I_Source_A (A),Drop (V),Active_Switches\n';

    simulation.points.forEach((p) => {
      const row = [
        p.t.toFixed(6),
        p.wtDeg.toFixed(2),
        p.vA.toFixed(2),
        p.vOut.toFixed(2),
        p.vOutIdeal.toFixed(2),
        p.iOut.toFixed(3),
        p.iSourceA.toFixed(3),
        p.totalDrop.toFixed(2),
        `"${p.activeSwitches.join(' ')}"`,
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `rectifierlab-sim-${config.phase}-${config.topology}-a${config.firingAngle}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Copy summary to clipboard
  const handleCopySummary = () => {
    const text = `
=== RectifierLab Simulation Report ===
Topology: ${config.phase.toUpperCase()} ${config.topology.toUpperCase()}
Firing Angle: ${config.firingAngle}°
Source: ${config.sourceRms}V RMS, ${config.frequency}Hz
Load: ${config.loadType} (R=${config.resistance}Ω, L=${config.inductance}mH, E=${config.backEmf}V)
Forward Drop VF: ${config.forwardVoltageDrop}V | Ls: ${config.sourceInductanceLs}mH

--- Results ---
Average DC Voltage V_dc: ${simulation.vDcAvg.toFixed(2)} V
RMS Output Voltage V_rms: ${simulation.vRms.toFixed(2)} V
Average DC Current I_dc: ${simulation.iDcAvg.toFixed(2)} A
RMS Load Current I_rms: ${simulation.iRms.toFixed(2)} A
Active Load Power: ${simulation.pLoad.toFixed(1)} W
Apparent Input Power: ${simulation.sIn.toFixed(1)} VA
Power Factor: ${simulation.powerFactor.toFixed(3)}
Displacement Power Factor: ${simulation.displacementFactor.toFixed(3)}
Ripple Factor: ${simulation.rippleFactor.toFixed(3)}
Form Factor: ${simulation.formFactor.toFixed(3)}
Source THD: ${simulation.sourceThdCurrent.toFixed(1)}%
Mode: ${simulation.isContinuous ? 'CCM (Continuous)' : 'DCM (Discontinuous)'}
Ideal Theory V_dc: ${simulation.idealVdcTheory.toFixed(2)} V
Semiconductor Loss: ${simulation.semiconductorLossWatts.toFixed(1)} W
Efficiency: ${simulation.efficiency.toFixed(1)}%
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Printable Lab Report
  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>RectifierLab - Educational Simulation Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
          h1 { color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 8px; }
          h2 { color: #0369a1; margin-top: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 13px; }
          th { background: #f1f5f9; font-weight: 600; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #e0f2fe; color: #0369a1; font-weight: bold; }
          .footer { margin-top: 40px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        </style>
      </head>
      <body>
        <h1>RectifierLab - Power Electronics Simulation Report</h1>
        <p><strong>Generated Date:</strong> ${new Date().toLocaleDateString()} | <strong>Application:</strong> RectifierLab Studio</p>

        <h2>1. Circuit &amp; Component Parameters</h2>
        <table>
          <tr><th>Parameter</th><th>Value</th><th>Parameter</th><th>Value</th></tr>
          <tr><td>Phase Topology</td><td>${config.phase.toUpperCase()} ${config.topology.toUpperCase()}</td><td>Firing Angle (α)</td><td>${config.firingAngle}°</td></tr>
          <tr><td>Source RMS Voltage</td><td>${config.sourceRms} V (${config.frequency} Hz)</td><td>Freewheeling Diode (D_FW)</td><td>${config.hasFreewheelingDiode ? 'Enabled' : 'Disabled'}</td></tr>
          <tr><td>Load Type</td><td>${config.loadType} Load</td><td>Resistance (R)</td><td>${config.resistance} Ω</td></tr>
          <tr><td>Inductance (L)</td><td>${config.inductance} mH</td><td>Back EMF (E)</td><td>${config.backEmf} V</td></tr>
          <tr><td>Component Forward Drop (V_F)</td><td>${config.forwardVoltageDrop} V</td><td>Source Inductance (L_s)</td><td>${config.sourceInductanceLs} mH</td></tr>
        </table>

        <h2>2. Experimental &amp; Analytical Simulation Results</h2>
        <table>
          <tr><th>Performance Metric</th><th>Simulated Value</th><th>Theoretical Ideal</th><th>Engineering Unit</th></tr>
          <tr><td>Average DC Output Voltage (V_dc)</td><td>${simulation.vDcAvg.toFixed(2)}</td><td>${simulation.idealVdcTheory.toFixed(2)}</td><td>Volts (V)</td></tr>
          <tr><td>RMS Output Voltage (V_rms)</td><td>${simulation.vRms.toFixed(2)}</td><td>-</td><td>Volts (V)</td></tr>
          <tr><td>Average DC Output Current (I_dc)</td><td>${simulation.iDcAvg.toFixed(2)}</td><td>-</td><td>Amperes (A)</td></tr>
          <tr><td>RMS Output Current (I_rms)</td><td>${simulation.iRms.toFixed(2)}</td><td>-</td><td>Amperes (A)</td></tr>
          <tr><td>Active Load Output Power (P_load)</td><td>${simulation.pLoad.toFixed(1)}</td><td>-</td><td>Watts (W)</td></tr>
          <tr><td>Apparent Input Power (S_in)</td><td>${simulation.sIn.toFixed(1)}</td><td>-</td><td>VA</td></tr>
          <tr><td>Total Power Factor (PF)</td><td>${simulation.powerFactor.toFixed(3)}</td><td>-</td><td>-</td></tr>
          <tr><td>Displacement Power Factor (cos φ1)</td><td>${simulation.displacementFactor.toFixed(3)}</td><td>-</td><td>-</td></tr>
          <tr><td>Ripple Factor (RF)</td><td>${simulation.rippleFactor.toFixed(3)}</td><td>-</td><td>-</td></tr>
          <tr><td>Form Factor (FF)</td><td>${simulation.formFactor.toFixed(2)}</td><td>-</td><td>-</td></tr>
          <tr><td>AC Source Current THD</td><td>${simulation.sourceThdCurrent.toFixed(1)}%</td><td>-</td><td>%</td></tr>
          <tr><td>Conduction Mode</td><td>${simulation.isContinuous ? 'CCM (Continuous)' : 'DCM (Discontinuous)'}</td><td>-</td><td>-</td></tr>
          <tr><td>Semiconductor Conduction Loss</td><td>${simulation.semiconductorLossWatts.toFixed(1)}</td><td>-</td><td>Watts (W)</td></tr>
          <tr><td>Conversion Efficiency (η)</td><td>${simulation.efficiency.toFixed(1)}%</td><td>-</td><td>%</td></tr>
        </table>

        <h2>3. Observations &amp; Verification</h2>
        <p>The difference between ideal theoretical voltage (${simulation.idealVdcTheory.toFixed(1)} V) and simulated output (${simulation.vDcAvg.toFixed(1)} V) of ${(simulation.idealVdcTheory - simulation.vDcAvg).toFixed(1)} V is accounted for by the forward semiconductor drop across the conducting switches (${(config.forwardVoltageDrop * 2).toFixed(1)} V) and the commutation overlap effect (overlap angle μ = ${simulation.commutationOverlapDeg.toFixed(1)}°).</p>

        <div class="footer">
          Generated automatically by RectifierLab — Power Electronics Educational Studio.
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#070e1c] border border-cyan-950 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 bg-[#0a152d] border-b border-cyan-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Detailed Analytical Dashboard &amp; Educational Study Suite
              </h2>
              <p className="text-xs text-slate-400">
                In-depth numerical metrics, semiconductor losses, harmonic breakdown, and lab export
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

        {/* Action Toolbar */}
        <div className="px-5 py-2.5 bg-[#081226] border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          {/* Sub tabs */}
          <div className="flex items-center gap-1 bg-[#050b17] p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                activeTab === 'metrics'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Summary Metrics
            </button>
            <button
              onClick={() => setActiveTab('harmonics')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                activeTab === 'harmonics'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fourier Harmonics Table
            </button>
            <button
              onClick={() => setActiveTab('losses')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                activeTab === 'losses'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Losses &amp; Efficiency
            </button>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrintReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Print Lab Report</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors font-bold shadow-md shadow-emerald-950"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV (720 pts)</span>
            </button>
          </div>
        </div>

        {/* Dashboard Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'metrics' && (
            <div className="space-y-4">
              {/* Executive Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[#09152b] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Ideal Theoretical V_dc
                  </span>
                  <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                    {simulation.idealVdcTheory.toFixed(1)} V
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Formula: {simulation.theoreticalFormula}
                  </span>
                </div>

                <div className="bg-[#09152b] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Simulated Actual V_dc
                  </span>
                  <span className="text-xl font-bold font-mono text-cyan-400 mt-1 block">
                    {simulation.vDcAvg.toFixed(1)} V
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    Drop ΔV: -{(simulation.idealVdcTheory - simulation.vDcAvg).toFixed(1)} V
                  </span>
                </div>

                <div className="bg-[#09152b] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Conduction Overlap Angle μ
                  </span>
                  <span className="text-xl font-bold font-mono text-purple-400 mt-1 block">
                    {simulation.commutationOverlapDeg.toFixed(1)}°
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Ls = {config.sourceInductanceLs} mH
                  </span>
                </div>

                <div className="bg-[#09152b] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Transformer Utilization TUF
                  </span>
                  <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
                    {simulation.tuf.toFixed(3)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    P_dc / S_in
                  </span>
                </div>
              </div>

              {/* Comprehensive Metrics Table */}
              <div className="bg-[#081226] rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#050b17] text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-bold">Metric Parameter</th>
                      <th className="py-2.5 px-4 font-bold">Simulated Value</th>
                      <th className="py-2.5 px-4 font-bold">Significance / Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    <tr>
                      <td className="py-2 px-4 text-slate-300">Average Output Voltage (V_dc)</td>
                      <td className="py-2 px-4 text-cyan-400 font-bold">{simulation.vDcAvg.toFixed(2)} V</td>
                      <td className="py-2 px-4 text-slate-400 font-sans">Mean DC voltage delivered to load terminals</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 text-slate-300">RMS Output Voltage (V_rms)</td>
                      <td className="py-2 px-4 text-slate-200">{simulation.vRms.toFixed(2)} V</td>
                      <td className="py-2 px-4 text-slate-400 font-sans">Effective heating voltage of the output waveform</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 text-slate-300">Form Factor (FF = V_rms / V_dc)</td>
                      <td className="py-2 px-4 text-slate-200">{simulation.formFactor.toFixed(3)}</td>
                      <td className="py-2 px-4 text-slate-400 font-sans">Ideal value is 1.0 (pure DC). Indicates wave shape flatness</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 text-slate-300">Ripple Factor (RF)</td>
                      <td className="py-2 px-4 text-rose-400 font-bold">{simulation.rippleFactor.toFixed(3)}</td>
                      <td className="py-2 px-4 text-slate-400 font-sans">Ratio of AC ripple component to DC component</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 text-slate-300">Input Power Factor (PF)</td>
                      <td className="py-2 px-4 text-purple-300 font-bold">{simulation.powerFactor.toFixed(3)}</td>
                      <td className="py-2 px-4 text-slate-400 font-sans">Total ratio of active power (W) to apparent power (VA)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 text-slate-300">Displacement Power Factor (cos φ1)</td>
                      <td className="py-2 px-4 text-purple-300">{simulation.displacementFactor.toFixed(3)}</td>
                      <td className="py-2 px-4 text-slate-400 font-sans">Cosine of fundamental current phase displacement</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 text-slate-300">Source Current THD</td>
                      <td className="py-2 px-4 text-cyan-400 font-bold">{simulation.sourceThdCurrent.toFixed(1)}%</td>
                      <td className="py-2 px-4 text-slate-400 font-sans">Total harmonic distortion injected into utility line</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 text-slate-300">Conduction State</td>
                      <td className="py-2 px-4 text-emerald-400 font-bold">
                        {simulation.isContinuous ? 'Continuous Conduction (CCM)' : 'Discontinuous (DCM)'}
                      </td>
                      <td className="py-2 px-4 text-slate-400 font-sans">
                        {simulation.isContinuous
                          ? 'Current never extinguishes to zero throughout cycle'
                          : 'Current falls to zero between firing pulses'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'harmonics' && (
            <div className="bg-[#081226] rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#050b17] text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Order (n)</th>
                    <th className="py-2.5 px-3">Frequency (Hz)</th>
                    <th className="py-2.5 px-3">Voltage Mag (V)</th>
                    <th className="py-2.5 px-3">Voltage %</th>
                    <th className="py-2.5 px-3">Current Mag (A)</th>
                    <th className="py-2.5 px-3">Current % of Fund</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {simulation.harmonics.slice(0, 15).map((h) => (
                    <tr
                      key={h.order}
                      className={h.order === 1 ? 'bg-cyan-950/30 font-bold' : ''}
                    >
                      <td className="py-2 px-3 text-slate-300">
                        {h.order === 1 ? '1 (Fund)' : h.order}
                      </td>
                      <td className="py-2 px-3 text-slate-400">{h.freq} Hz</td>
                      <td className="py-2 px-3 text-slate-200">{h.vMag.toFixed(1)} V</td>
                      <td className="py-2 px-3 text-slate-400">{h.vPercent.toFixed(1)}%</td>
                      <td className="py-2 px-3 text-cyan-300 font-bold">{h.iMag.toFixed(2)} A</td>
                      <td className="py-2 px-3 text-emerald-400">{h.iPercent.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'losses' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-[#09152b] p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Semiconductor Forward Drop Loss
                  </span>
                  <span className="text-2xl font-bold font-mono text-rose-400">
                    {simulation.semiconductorLossWatts.toFixed(1)} W
                  </span>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Heat dissipation across conducting diodes and thyristors based on {config.forwardVoltageDrop}V forward drop per device.
                  </p>
                </div>

                <div className="bg-[#09152b] p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Delivered DC Load Power
                  </span>
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {simulation.pLoad.toFixed(1)} W
                  </span>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Net active energy transferred to the load resistance, inductance, and back EMF.
                  </p>
                </div>

                <div className="bg-[#09152b] p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Converter Efficiency (η)
                  </span>
                  <span className="text-2xl font-bold font-mono text-cyan-400">
                    {simulation.efficiency.toFixed(1)} %
                  </span>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Ratio of active DC load power to total input power supplied by the AC grid.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
