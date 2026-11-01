import React from 'react';
import {
  ScanLine,
  Layers,
  Activity,
  BarChart3,
  ArrowRight,
  Database,
  Cpu,
  Server,
  Clock,
  CheckCircle2,
  XCircle,
  Leaf,
  ShieldCheck,
  ChevronRight,
  Microscope,
  BookOpen,
} from 'lucide-react';

import { PageContainer } from '../components/layout/PageContainer';
import { DISEASE_CLASSES } from '../data/diseaseClasses';
import { SAMPLE_GALLERY } from '../data/sampleGallery';
import type { PageId } from '../types/navigation';
import type { HealthResponse } from '../services/healthService';

interface OverviewPageProps {
  onNavigate: (page: PageId) => void;
  health: HealthResponse | null;
}

const formatUptime = (seconds?: number): string => {
  if (seconds === undefined || !Number.isFinite(seconds)) {
    return 'Unavailable';
  }

  const total = Math.floor(seconds);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

type HealthState = 'healthy' | 'unavailable' | 'checking';

const StatePill: React.FC<{ state: HealthState; label: string }> = ({
  state,
  label,
}) => {
  const tone =
    state === 'healthy'
      ? 'border-lime/25 bg-lime/[0.08] text-lime'
      : state === 'unavailable'
        ? 'border-danger/25 bg-danger/[0.08] text-danger'
        : 'border-warning/25 bg-warning/[0.08] text-warning';

  const Icon =
    state === 'healthy' ? CheckCircle2 : state === 'unavailable' ? XCircle : Clock;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${tone}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
};

interface SystemCardProps {
  label: string;
  value: string;
  description: string;
  icon: React.ElementType;
  status: HealthState;
  statusLabel: string;
  accent: string;
  glow: string;
}

const SystemCard: React.FC<SystemCardProps> = ({
  label,
  value,
  description,
  icon: Icon,
  status,
  statusLabel,
  accent,
  glow,
}) => (
  <div className="group relative overflow-hidden rounded-2xl border border-line bg-panel p-4 shadow-panel panel-hover">
    <div
      className={`pointer-events-none absolute -right-6 -top-10 h-24 w-24 rounded-full blur-2xl ${glow}`}
    />
    <div className="relative flex items-center justify-between">
      <span className="text-[11px] font-medium text-muted">{label}</span>
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-raised/70 ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
    </div>

    <div className="relative mt-3">
      <h3 className="truncate text-lg font-semibold tracking-tight text-ink">
        {value}
      </h3>
      <div className="mt-2">
        <StatePill state={status} label={statusLabel} />
      </div>
      <p className="mt-3 border-t border-line/70 pt-2.5 text-[10.5px] leading-relaxed text-faint">
        {description}
      </p>
    </div>
  </div>
);

interface LaunchCardProps {
  title: string;
  description: string;
  meta: string;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  tone: 'teal' | 'cyan';
}

const LaunchCard: React.FC<LaunchCardProps> = ({
  title,
  description,
  meta,
  icon: Icon,
  label,
  onClick,
  tone,
}) => {
  const tile =
    tone === 'teal'
      ? 'border-accent/25 bg-accent/10 text-accent'
      : 'border-cyan/25 bg-cyan/10 text-cyan';
  const glow = tone === 'teal' ? 'bg-accent/[0.07]' : 'bg-cyan/[0.07]';
  const labelTone = tone === 'teal' ? 'text-accent' : 'text-cyan';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-h-[196px] flex-col justify-between overflow-hidden rounded-2xl border border-line bg-panel p-5 text-left shadow-panel panel-hover sm:p-6"
    >
      <div
        className={`pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full blur-3xl transition-all duration-300 group-hover:scale-110 ${glow}`}
      />
      <div className="relative flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${tile}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full border border-line bg-raised/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
          {meta}
        </span>
      </div>

      <div className="relative mt-5">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <p className="mt-2 max-w-md text-[11.5px] leading-relaxed text-muted">
          {description}
        </p>
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-line/70 pt-3.5">
        <span className={`text-[11px] font-semibold ${labelTone}`}>{label}</span>
        <ArrowRight
          className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${labelTone}`}
        />
      </div>
    </button>
  );
};

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigate,
  health,
}) => {
  const backendOk = health?.status === 'ok';
  const databaseOk = health?.database?.status === 'ok';

  const modelOk =
    health?.model?.loaded === true && health?.model?.status === 'loaded';

  const getStatus = (ok: boolean): HealthState => {
    if (!health) return 'checking';
    return ok ? 'healthy' : 'unavailable';
  };

  const allSystemsHealthy = backendOk && databaseOk && modelOk;

  const connectionLabel = !health
    ? 'Checking connection'
    : allSystemsHealthy
      ? 'All systems operational'
      : 'System degraded';

  const cropCount = new Set(DISEASE_CLASSES.map((item) => item.crop)).size;
  const healthyClassCount = DISEASE_CLASSES.filter((item) => item.healthy).length;
  const diseaseClassCount = DISEASE_CLASSES.length - healthyClassCount;

  return (
    <PageContainer
      eyebrow="Agricultural intelligence · command center"
      title="System Overview"
      subtitle="A precision workspace for foliar screening, model evaluation, and operational telemetry."
      badge={
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
            allSystemsHealthy
              ? 'border-lime/25 bg-lime/[0.08] text-lime'
              : 'border-warning/25 bg-warning/[0.08] text-warning'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              allSystemsHealthy ? 'bg-lime' : 'bg-warning animate-pulse-soft'
            }`}
          />
          {connectionLabel}
        </span>
      }
      actions={
        <>
          <button
            type="button"
            onClick={() => onNavigate('scanner')}
            className="btn-primary"
          >
            <ScanLine className="h-4 w-4" />
            Start a leaf scan
          </button>
          <button
            type="button"
            onClick={() => onNavigate('monitoring')}
            className="btn-secondary"
          >
            <Activity className="h-4 w-4" />
            Live monitoring
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-2xl border border-line bg-panel shadow-panel">
          <div className="pointer-events-none absolute inset-0 bg-hero-spot opacity-90" />
          <div className="pointer-events-none absolute inset-0 bg-grid-fade bg-[size:46px_46px] opacity-[0.12] [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

          <div className="relative flex flex-col gap-8 p-5 sm:p-7 lg:flex-row lg:items-center lg:p-8">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.07] px-3 py-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-accent">
                  Plant health intelligence platform
                </span>
              </div>

              <h2 className="text-[28px] font-bold leading-[1.08] tracking-tight text-ink sm:text-[36px] lg:text-[42px]">
                See the leaf.
                <br />
                <span className="bg-gradient-to-r from-accent via-accent to-cyan bg-clip-text text-transparent">
                  Understand the signal.
                </span>
              </h2>

              <p className="mt-4 max-w-xl text-[12.5px] leading-relaxed text-muted sm:text-[13.5px]">
                Screen foliar photographs with MobileNetV2, inspect ranked class
                scores and Grad-CAM activations, run batch campaigns, and track
                model telemetry from one scientific workspace.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('scanner')}
                  className="btn-primary"
                >
                  <ScanLine className="h-4 w-4" />
                  Analyze a leaf
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('batch')}
                  className="btn-secondary"
                >
                  <Layers className="h-4 w-4" />
                  Batch campaign
                </button>
              </div>

              <div className="mt-7 grid max-w-lg grid-cols-3 gap-3 border-t border-line/70 pt-5">
                {[
                  { value: '38', label: 'Target classes' },
                  { value: `${cropCount}`, label: 'Crop species' },
                  { value: 'Grad-CAM', label: 'Explainability' },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="font-mono text-lg font-semibold text-ink">
                      {item.value}
                    </p>
                    <p className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-faint">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar visual */}
            <div className="relative mx-auto hidden w-full max-w-[360px] shrink-0 items-center justify-center lg:flex">
              <div className="relative flex h-[280px] w-[280px] items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-accent/10" />
                <div className="absolute inset-[26px] rounded-full border border-accent/15" />
                <div className="absolute inset-[58px] rounded-full border border-cyan/15" />
                <div className="absolute inset-[92px] rounded-full border border-accent/20 bg-accent/[0.035]" />

                <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-line to-transparent" />
                <span className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-line to-transparent" />

                <span className="absolute right-[24px] top-[74px] h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
                <span className="absolute bottom-[58px] left-[44px] h-1.5 w-1.5 rounded-full bg-lime shadow-[0_0_10px_rgba(132,204,22,0.9)]" />
                <span className="absolute left-[70px] top-[58px] h-1 w-1 rounded-full bg-accent" />

                <div className="relative flex h-[92px] w-[92px] items-center justify-center rounded-full border border-accent/25 bg-gradient-to-br from-accent/20 to-cyan/5 shadow-[0_0_45px_-8px_rgba(32,201,176,0.55)]">
                  <Leaf className="h-11 w-11 text-accent" strokeWidth={1.25} />
                </div>

                <div className="pointer-events-none absolute inset-x-6 top-8 h-10 animate-scan-sweep">
                  <div className="scan-line h-px w-full" />
                </div>

                <div className="absolute -right-2 top-6 rounded-lg border border-line bg-panel/95 px-2.5 py-1.5 shadow-panel backdrop-blur">
                  <p className="font-mono text-[9px] text-faint">INPUT</p>
                  <p className="text-[10px] font-semibold text-ink">224 × 224 · RGB</p>
                </div>

                <div className="absolute -left-4 bottom-8 rounded-lg border border-line bg-panel/95 px-2.5 py-1.5 shadow-panel backdrop-blur">
                  <p className="font-mono text-[9px] text-faint">TOP-1</p>
                  <p className="text-[10px] font-semibold text-accent">softmax score</p>
                </div>

                <div className="absolute -bottom-2 right-6 flex items-center gap-1.5 rounded-full border border-lime/25 bg-lime/[0.08] px-2.5 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-lime">
                    Model ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SYSTEM HEALTH */}
        <section aria-labelledby="system-health-heading">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="eyebrow">Live diagnostics</p>
              <h3
                id="system-health-heading"
                className="mt-1 text-sm font-semibold text-ink"
              >
                System health
              </h3>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] text-faint">
              <Activity className="h-3.5 w-3.5 text-accent" />
              Health API · polling every 15s
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SystemCard
              label="Backend API"
              value={backendOk ? 'Connected' : health ? 'Degraded' : 'Checking'}
              description={`FastAPI service · Uptime ${formatUptime(health?.uptimeSeconds)}`}
              icon={Server}
              status={getStatus(backendOk)}
              statusLabel={
                backendOk
                  ? 'Responding'
                  : health
                    ? 'Unavailable'
                    : 'Awaiting health check'
              }
              accent="text-accent"
              glow="bg-accent/[0.09]"
            />

            <SystemCard
              label="AI Model Engine"
              value="MobileNetV2"
              description="224 × 224 RGB input · 38 classification classes"
              icon={Cpu}
              status={getStatus(modelOk)}
              statusLabel={
                modelOk
                  ? health?.model?.version ?? 'Model loaded'
                  : health
                    ? 'Model unavailable'
                    : 'Checking model'
              }
              accent="text-cyan"
              glow="bg-cyan/[0.09]"
            />

            <SystemCard
              label="Telemetry Storage"
              value="SQLite"
              description={
                databaseOk
                  ? `Database connected · Schema v${health?.database?.schemaVersion ?? '—'}`
                  : 'Database health information unavailable'
              }
              icon={Database}
              status={getStatus(databaseOk)}
              statusLabel={
                databaseOk
                  ? 'Database connected'
                  : health
                    ? 'Database unavailable'
                    : 'Checking database'
              }
              accent="text-lime"
              glow="bg-lime/[0.09]"
            />

            <SystemCard
              label="Explainable AI"
              value="Grad-CAM"
              description="Activation heatmaps returned alongside live predictions."
              icon={Microscope}
              status="healthy"
              statusLabel="Pipeline integrated"
              accent="text-accent"
              glow="bg-accent/[0.08]"
            />
          </div>
        </section>

        {/* COVERAGE & CAPABILITIES */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/[0.13] via-panel to-panel p-5 shadow-panel">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/[0.12] blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-grid-fade bg-[size:34px_34px] opacity-[0.12]" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                  Classification coverage
                </p>
                <h3 className="mt-3 font-mono text-5xl font-semibold leading-none tracking-tight text-ink">
                  38
                </h3>
                <p className="mt-2 text-[11px] text-muted">
                  supported target classes
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent/25 bg-accent/10">
                <BarChart3 className="h-5 w-5 text-accent" />
              </div>
            </div>

            <div className="relative mt-6 space-y-2.5 border-t border-accent/15 pt-4">
              {[
                { label: 'Dataset', value: 'PlantVillage' },
                { label: 'Crop species', value: `${cropCount}` },
                { label: 'Disease classes', value: `${diseaseClassCount}` },
                { label: 'Healthy classes', value: `${healthyClassCount}` },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between text-[11px]"
                >
                  <span className="text-muted">{item.label}</span>
                  <span className="font-mono font-medium text-ink">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-5 shadow-panel lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Model capabilities</p>
                <h3 className="mt-1 text-sm font-semibold text-ink">
                  Inference pipeline configuration
                </h3>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan/20 bg-cyan/10">
                <Cpu className="h-4 w-4 text-cyan" />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { label: 'Architecture', value: 'MobileNetV2' },
                { label: 'Input', value: 'RGB' },
                { label: 'Resolution', value: '224 × 224' },
                { label: 'Output', value: '38 classes' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-line bg-base/35 px-3 py-2.5"
                >
                  <p className="text-[9px] uppercase tracking-[0.1em] text-faint">
                    {item.label}
                  </p>
                  <p className="mt-1 break-words font-mono text-[11px] font-semibold text-ink">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                {
                  icon: ScanLine,
                  title: 'Single-leaf scoring',
                  text: 'Ranked top-5 class scores with measured latency.',
                },
                {
                  icon: Microscope,
                  title: 'Grad-CAM overlays',
                  text: 'Feature activation maps for visual inspection.',
                },
                {
                  icon: Layers,
                  title: 'Batch campaigns',
                  text: 'Queue up to 24 images with review thresholds.',
                },
                {
                  icon: Activity,
                  title: 'Operational telemetry',
                  text: 'Latency, confidence and drift signals in SQLite.',
                },
              ].map((capability) => (
                <div
                  key={capability.title}
                  className="flex items-start gap-2.5 rounded-xl border border-line/70 bg-raised/25 p-3"
                >
                  <capability.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  <div>
                    <p className="text-[11px] font-semibold text-ink">
                      {capability.title}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-faint">
                      {capability.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('report')}
              className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent transition-colors hover:text-cyan"
            >
              View the evaluation report
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>

        {/* ANALYSIS WORKSPACE */}
        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="eyebrow">Analysis workspace</p>
              <h3 className="mt-1 text-sm font-semibold text-ink">
                Choose an analysis workflow
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('library')}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted transition-colors hover:text-accent"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Browse disease library
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LaunchCard
              title="Single-Leaf Disease Scanner"
              description="Upload or select a foliar image, inspect top-5 model scores, image metadata, and Grad-CAM explanations."
              meta="Screen A"
              icon={ScanLine}
              label="Open image scanner"
              onClick={() => onNavigate('scanner')}
              tone="teal"
            />

            <LaunchCard
              title="Batch Image Analysis"
              description="Queue multiple images, apply confidence filters, review per-item outcomes, and export the campaign as CSV."
              meta="Screen B"
              icon={Layers}
              label="Open batch analysis"
              onClick={() => onNavigate('batch')}
              tone="cyan"
            />
          </div>
        </section>

        {/* OPERATIONAL SNAPSHOT */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-line bg-panel p-5 shadow-panel lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="eyebrow">Reference footprint</p>
                <h3 className="mt-1 text-sm font-semibold text-ink">
                  Workspace content
                </h3>
              </div>
              <BookOpen className="h-4 w-4 text-lime" />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  value: `${DISEASE_CLASSES.length}`,
                  label: 'Library entries',
                  tone: 'text-ink',
                },
                {
                  value: `${cropCount}`,
                  label: 'Supported crops',
                  tone: 'text-accent',
                },
                {
                  value: `${SAMPLE_GALLERY.length}`,
                  label: 'Demo assets',
                  tone: 'text-cyan',
                },
                {
                  value: '2',
                  label: 'Analysis modes',
                  tone: 'text-lime',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-line bg-base/30 p-3"
                >
                  <p className={`font-mono text-xl font-semibold ${item.tone}`}>
                    {item.value}
                  </p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-faint">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('library')}
                className="btn-secondary"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Disease library
              </button>
              <button
                type="button"
                onClick={() => onNavigate('help')}
                className="btn-secondary"
              >
                Documentation
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('monitoring')}
            className="group relative overflow-hidden rounded-2xl border border-line bg-panel p-5 text-left shadow-panel panel-hover"
          >
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-cyan/[0.08] blur-2xl" />
            <div className="relative flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan/25 bg-cyan/10">
                <Activity className="h-4 w-4 text-cyan" />
              </div>
              <ArrowRight className="h-4 w-4 text-faint transition-transform group-hover:translate-x-1 group-hover:text-cyan" />
            </div>
            <h3 className="relative mt-4 text-sm font-semibold text-ink">
              Operational telemetry
            </h3>
            <p className="relative mt-1.5 text-[11px] leading-relaxed text-muted">
              Request volume, latency percentiles, confidence trends, class
              distribution and drift readiness.
            </p>
            <div className="relative mt-4 flex items-center gap-2 border-t border-line/70 pt-3">
              <span className="chip chip-cyan">
                <span className="h-1 w-1 rounded-full bg-cyan" />
                Live metrics
              </span>
              <span className="chip">SQLite</span>
            </div>
          </button>
        </section>

        {/* DISCLAIMER */}
        <div className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/[0.045] p-4 sm:p-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-warning/20 bg-warning/10">
            <ShieldCheck className="h-4 w-4 text-warning" />
          </div>

          <div className="min-w-0">
            <h3 className="text-xs font-semibold text-warning">
              Academic diagnostic demarcation
            </h3>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
              Vistara AI is an experimental decision-support system trained on
              laboratory-controlled foliar photographs. Heatmaps indicate
              influential feature zones rather than causal phytopathology.
              Outputs must be verified by agricultural professionals prior to any
              field intervention.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
