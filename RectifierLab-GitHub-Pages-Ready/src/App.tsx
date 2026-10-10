/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ConverterConfig, SimulationResult } from './types/rectifier';
import { simulateRectifier } from './physics/rectifierSimulation';
import { Header } from './components/Header';
import { CircuitSchematic } from './components/CircuitSchematic';
import { WaveformDisplay } from './components/WaveformDisplay';
import { AnimationBar } from './components/AnimationBar';
import { ControlPanels } from './components/ControlPanels';
import { MetricsCards } from './components/MetricsCards';
import { TheoreticalBanner } from './components/TheoreticalBanner';
import { WaveformAnalysisModal } from './components/WaveformAnalysisModal';
import { PresetsModal } from './components/PresetsModal';
import { TheoryModal } from './components/TheoryModal';
import { ExportDashboardModal } from './components/ExportDashboardModal';
import { LoadParametersModal } from './components/LoadParametersModal';
import { RectifierSelectorBar, RectifierOption } from './components/RectifierSelectorBar';
import { LAB_PRESETS } from './physics/presets';

export default function App() {
  // Theme & Layout state
  const [isDark, setIsDark] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Initial configuration matching the exact reference screenshot (3-Phase Semi-Converter, RL load, R=20, L=45, alpha=45)
  const [config, setConfig] = useState<ConverterConfig>(
    LAB_PRESETS[0].config
  );

  // Animation and scrub angle state
  const [currentAngle, setCurrentAngle] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [simSpeed, setSimSpeed] = useState(0.5);
  const [schematicMode, setSchematicMode] = useState<'general' | 'animated'>('animated');

  // Modals state
  const [isDerivationsOpen, setIsDerivationsOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isTheoryOpen, setIsTheoryOpen] = useState(false);
  const [isExportDashboardOpen, setIsExportDashboardOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);

  // Compute Simulation Result based on config
  const simulation: SimulationResult = useMemo(() => {
    return simulateRectifier(config);
  }, [config]);

  // Current instantaneous simulation point
  const currentPoint = useMemo(() => {
    if (!simulation.points.length) return undefined;
    const norm = ((currentAngle % 360) + 360) % 360;
    const idx = Math.min(
      simulation.points.length - 1,
      Math.max(0, Math.round((norm / 360) * (simulation.points.length - 1)))
    );
    return simulation.points[idx];
  }, [simulation, currentAngle]);

  // Real-time animation loop using requestAnimationFrame
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAnimating) {
      lastTimeRef.current = null;
      return;
    }

    let animationFrameId: number;

    const animate = (time: number) => {
      if (lastTimeRef.current !== null) {
        const delta = time - lastTimeRef.current;
        // At 50 Hz, one cycle (360 deg) is 20 ms.
        // In real-time at 1x speed, 360 deg in 20 ms means 18 deg per ms.
        // For smooth visual comprehension in browser, we scale so 1x = ~2 seconds per cycle (180 deg / sec)
        const degPerSec = 180 * simSpeed;
        const degDelta = (degPerSec * delta) / 1000;
        setCurrentAngle((prev) => (prev + degDelta) % 360);
      }
      lastTimeRef.current = time;
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isAnimating, simSpeed]);

  // Config updater
  const handleUpdateConfig = useCallback((partial: Partial<ConverterConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  // Step controls
  const handleStepBack = () => {
    setCurrentAngle((prev) => (prev - 5 + 360) % 360);
  };

  const handleStepForward = () => {
    setCurrentAngle((prev) => (prev + 5) % 360);
  };

  const handleResetCycle = () => {
    setCurrentAngle(0);
  };

  // Reset to default
  const handleResetAll = () => {
    setConfig(LAB_PRESETS[0].config);
    setCurrentAngle(0);
    setIsAnimating(false);
  };

  const handleSelectOption = (option: RectifierOption) => {
    setConfig((prev) => ({
      ...prev,
      phase: option.phase,
      topology: option.topology,
      switches: option.switches,
      firingAngle: option.defaultAlpha,
      hasFreewheelingDiode: option.hasFwd,
      sourceRms: option.phase === '3-phase' ? 400 : 230,
    }));
    setCurrentAngle(0);
  };

  // Fullscreen toggle
  const handleToggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullScreen(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col font-sans transition-colors ${
        isDark ? 'bg-[#030712] text-slate-100' : 'bg-slate-900 text-slate-100'
      }`}
    >
      {/* 1. STUDIO HEADER */}
      <Header
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        isFullScreen={isFullScreen}
        onToggleFullScreen={handleToggleFullScreen}
        onOpenDerivations={() => setIsDerivationsOpen(true)}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenTheory={() => setIsTheoryOpen(true)}
        onOpenExportDashboard={() => setIsExportDashboardOpen(true)}
        onReset={handleResetAll}
      />

      {/* 2. RECTIFIER TOPOLOGY SELECTOR BAR (ALL AC TO DC RECTIFIERS) */}
      <RectifierSelectorBar
        config={config}
        onSelectOption={handleSelectOption}
        onUpdateConfig={handleUpdateConfig}
      />

      {/* MAIN STUDIO WORKSPACE */}
      <main className="flex-1 p-3 md:p-4 max-w-[1760px] w-full mx-auto flex flex-col gap-4">
        {/* TOP ROW: CIRCUIT SCHEMATIC (LEFT) & OSCILLOSCOPE WAVEFORMS (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch min-h-[480px]">
          {/* Left: Circuit Schematic */}
          <CircuitSchematic
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onSelectOption={handleSelectOption}
            currentPoint={currentPoint}
            isAnimating={isAnimating}
            onToggleAnimation={() => setIsAnimating(!isAnimating)}
            schematicMode={schematicMode}
            onSetSchematicMode={setSchematicMode}
            onOpenLoadModal={() => setIsLoadModalOpen(true)}
          />

          {/* Right: Waveform Display */}
          <WaveformDisplay
            config={config}
            onUpdateConfig={handleUpdateConfig}
            simulation={simulation}
            currentAngle={currentAngle}
            onAngleChange={setCurrentAngle}
          />
        </div>

        {/* MIDDLE BAR: ANIMATION PLAYBACK & SPEED CONTROLS */}
        <AnimationBar
          isAnimating={isAnimating}
          onToggleAnimation={() => setIsAnimating(!isAnimating)}
          onStepBack={handleStepBack}
          onStepForward={handleStepForward}
          onResetCycle={handleResetCycle}
          simSpeed={simSpeed}
          onChangeSpeed={setSimSpeed}
          currentAngle={currentAngle}
        />

        {/* BOTTOM ROW 1: 3-COLUMN CONTROL PANELS */}
        <ControlPanels
          config={config}
          onUpdateConfig={handleUpdateConfig}
        />

        {/* BOTTOM ROW 2: 6 ANALYTICS METRICS CARDS */}
        <MetricsCards simulation={simulation} />

        {/* BOTTOM ROW 3: THEORETICAL ANALYTICAL DERIVATION BANNER */}
        <TheoreticalBanner
          config={config}
          simulation={simulation}
          onOpenDerivations={() => setIsDerivationsOpen(true)}
        />
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-[#050b17] border-t border-cyan-950/60 py-2.5 px-4 text-center text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-slate-400">
          RectifierLab v2.4 • Power Electronics Simulation &amp; Harmonics Analysis Studio
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExportDashboardOpen(true)}
            className="text-cyan-400 hover:text-cyan-300 underline font-medium"
          >
            Export Laboratory CSV Data
          </button>
          <span>•</span>
          <button
            onClick={() => setIsDerivationsOpen(true)}
            className="text-amber-400 hover:text-amber-300 underline font-medium"
          >
            Mathematical Formulas &amp; Derivations
          </button>
        </div>
      </footer>

      {/* MODALS */}
      <WaveformAnalysisModal
        isOpen={isDerivationsOpen}
        onClose={() => setIsDerivationsOpen(false)}
      />

      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={(presetConfig) => {
          setConfig(presetConfig);
          setCurrentAngle(0);
        }}
      />

      <TheoryModal
        isOpen={isTheoryOpen}
        onClose={() => setIsTheoryOpen(false)}
      />

      <ExportDashboardModal
        isOpen={isExportDashboardOpen}
        onClose={() => setIsExportDashboardOpen(false)}
        config={config}
        simulation={simulation}
      />

      <LoadParametersModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        config={config}
        onUpdateConfig={handleUpdateConfig}
      />
    </div>
  );
}
