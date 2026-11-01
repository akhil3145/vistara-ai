
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
  Sprout,
  Leaf,
  ShieldCheck,
  ChevronRight,
  Microscope,
} from 'lucide-react';

import { PageContainer } from '../components/layout/PageContainer';
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

const StatusLabel: React.FC<{
  status: HealthState;
  label: string;
}> = ({ status, label }) => {
  const styles = {
    healthy: 'text-emerald-400',
    unavailable: 'text-rose-400',
    checking: 'text-amber-400',
  };

  const Icon =
    status === 'healthy'
      ? CheckCircle2
      : status === 'unavailable'
        ? XCircle
        : Clock;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${styles[status]}`}>
      <Icon className="h-3.5 w-3.5" />
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
}

const SystemCard: React.FC<SystemCardProps> = ({
  label,
  value,
  description,
  icon: Icon,
  status,
  statusLabel,
  accent,
}) => (
  <div className="group relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-500/30 hover:shadow-lg sm:p-5">
    <div className={`absolute right-0 top-0 h-20 w-20 rounded-full opacity-[0.07] blur-2xl ${accent}`} />

    <div className="relative flex items-center justify-between">
      <span className="text-xs font-medium text-[var(--text-muted)]">
        {label}
      </span>

      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <Icon className="h-[17px] w-[17px] text-teal-400" />
      </div>
    </div>

    <div className="relative mt-4">
      <h3 className="truncate text-xl font-bold tracking-tight text-[var(--text-primary)]">
        {value}
      </h3>

      <div className="mt-2">
        <StatusLabel status={status} label={statusLabel} />
      </div>

      <p className="mt-3 border-t border-[var(--border-subtle)] pt-3 text-[11px] leading-relaxed text-[var(--text-muted)]">
        {description}
      </p>
    </div>
  </div>
);

interface LaunchCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant: 'teal' | 'blue';
}

const LaunchCard: React.FC<LaunchCardProps> = ({
  title,
  description,
  icon: Icon,
  label,
  onClick,
  variant,
}) => {
  const accent =
    variant === 'teal'
      ? 'text-teal-300 bg-teal-400/10 border-teal-400/20'
      : 'text-sky-300 bg-sky-400/10 border-sky-400/20';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-h-[205px] flex-col justify-between overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-teal-400/30 hover:shadow-xl sm:p-6"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-teal-400/[0.04] blur-2xl transition-all group-hover:bg-teal-400/[0.09]" />

      <div className="relative">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>

        <h3 className="mt-5 text-base font-semibold text-[var(--text-primary)]">
          {title}
        </h3>

        <p className="mt-2 max-w-md text-xs leading-relaxed text-[var(--text-muted)]">
          {description}
        </p>
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
        <span className="text-xs font-semibold text-teal-400">
          {label}
        </span>

        <ArrowRight className="h-4 w-4 text-teal-400 transition-transform group-hover:translate-x-1" />
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
    health?.model?.loaded === true &&
    health?.model?.status === 'loaded';

  const getStatus = (ok: boolean): HealthState => {
    if (!health) return 'checking';
    return ok ? 'healthy' : 'unavailable';
  };

  const connectionLabel = !health
    ? 'Checking connection'
    : backendOk
      ? 'System operational'
      : 'System degraded';

  const allSystemsHealthy =
    backendOk && databaseOk && modelOk;

  return (
    <PageContainer
      title="System Overview"
      subtitle="Plant health intelligence, model operations and system status."
      badge={
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
            allSystemsHealthy
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
              : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${allSystemsHealthy ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          {connectionLabel}
        </span>
      }
    >
      <div className="space-y-6">

        {/* HERO SECTION */}
        <section className="relative overflow-hidden rounded-2xl border border-teal-400/20 bg-gradient-to-br from-[#102d3b] via-[#10283a] to-[#102035] p-5 sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-teal-300/[0.08]" />
          <div className="pointer-events-none absolute -right-4 -top-12 h-52 w-52 rounded-full border border-teal-300/[0.08]" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-teal-400/[0.08] blur-3xl" />

          <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/[0.08] px-3 py-1.5">
                <Sprout className="h-3.5 w-3.5 text-teal-300" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-teal-200">
                  Agricultural Intelligence Platform
                </span>
              </div>

              <h2 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-[34px]">
                Plant Health
                <span className="block text-teal-300">
                  Intelligence Center
                </span>
              </h2>

              <p className="mt-3 max-w-xl text-xs leading-relaxed text-slate-300 sm:text-sm">
                Analyze foliar images, identify visual disease patterns,
                inspect model predictions and monitor your AI-powered
                plant screening system.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('scanner')}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-400 px-4 py-2.5 text-xs font-semibold text-[#08252a] transition-all hover:bg-teal-300"
                >
                  <ScanLine className="h-4 w-4" />
                  Start leaf scan
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('monitoring')}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.05] px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-white/10"
                >
                  <Activity className="h-4 w-4" />
                  System monitoring
                </button>
              </div>
            </div>

            <div className="relative hidden min-w-[180px] flex-col items-center justify-center rounded-2xl border border-teal-300/15 bg-white/[0.035] p-6 lg:flex">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-teal-300/20 bg-teal-300/[0.08]">
                <Leaf className="h-10 w-10 text-teal-300" strokeWidth={1.4} />
              </div>

              <p className="mt-4 text-sm font-semibold text-white">
                Vistara AI
              </p>

              <p className="mt-1 text-[10px] tracking-widest text-teal-300">
                MOBILENETV2 · 38 CLASSES
              </p>
            </div>
          </div>
        </section>

        {/* SECTION HEADING */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              System health
            </h3>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              Live status of connected services and AI components
            </p>
          </div>

          <span className="hidden items-center gap-1.5 text-[10px] text-[var(--text-muted)] sm:flex">
            <Activity className="h-3.5 w-3.5 text-teal-400" />
            Health API
          </span>
        </div>

        {/* SYSTEM CARDS */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SystemCard
            label="Backend API"
            value={backendOk ? 'Connected' : health ? 'Degraded' : 'Checking'}
            description={`FastAPI service · Uptime: ${formatUptime(health?.uptimeSeconds)}`}
            icon={Server}
            status={getStatus(backendOk)}
            statusLabel={backendOk ? 'Responding' : health ? 'Unavailable' : 'Waiting for health check'}
            accent="bg-teal-400"
          />

          <SystemCard
            label="AI Model Engine"
            value="MobileNetV2"
            description="224 × 224 RGB input · 38 classification classes"
            icon={Cpu}
            status={getStatus(modelOk)}
            statusLabel={modelOk ? 'Model loaded' : health ? 'Model unavailable' : 'Checking model'}
            accent="bg-sky-400"
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
            statusLabel={databaseOk ? 'Database connected' : health ? 'Database unavailable' : 'Checking database'}
            accent="bg-purple-400"
          />

          <SystemCard
            label="Explainable AI"
            value="Grad-CAM"
            description="Visual feature-importance heatmap integration"
            icon={Microscope}
            status="healthy"
            statusLabel="Integration implemented"
            accent="bg-emerald-400"
          />
        </section>

        {/* MODEL OVERVIEW */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="relative overflow-hidden rounded-xl border border-teal-400/20 bg-gradient-to-br from-[#10343b] to-[#10283a] p-5 lg:col-span-1">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-teal-300/[0.08] blur-2xl" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-teal-200/80">
                  Classification coverage
                </p>
                <h3 className="mt-2 text-4xl font-bold tracking-tight text-white">
                  38
                </h3>
                <p className="mt-1 text-xs text-teal-200/70">
                  Supported target classes
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-teal-300/20 bg-teal-300/10">
                <BarChart3 className="h-6 w-6 text-teal-300" />
              </div>
            </div>

            <div className="relative mt-5 border-t border-teal-300/15 pt-4">
              <div className="flex items-center justify-between text-[10px] text-teal-100/70">
                <span>Dataset</span>
                <span className="font-semibold text-teal-200">
                  PlantVillage
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Model configuration
                </h3>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  Current inference architecture
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-400/10">
                <Cpu className="h-4 w-4 text-sky-400" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Architecture', value: 'MobileNetV2' },
                { label: 'Input format', value: 'RGB' },
                { label: 'Image size', value: '224 × 224' },
                { label: 'Output classes', value: '38' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3">
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {item.label}
                  </p>
                  <p className="mt-2 break-words text-xs font-semibold text-[var(--text-primary)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('report')}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 transition-colors hover:text-teal-300"
            >
              View evaluation report
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>

        {/* QUICK LAUNCH */}
        <section>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Analysis workspace
            </h3>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              Choose an analysis workflow to get started
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LaunchCard
              title="Single-Leaf Disease Scanner"
              description="Upload a leaf photograph or select a sample image. Inspect top-5 model predictions and Grad-CAM visual explanations."
              icon={ScanLine}
              label="Open image scanner"
              onClick={() => onNavigate('scanner')}
              variant="teal"
            />

            <LaunchCard
              title="Batch Image Analysis"
              description="Process multiple foliar images, inspect individual predictions and aggregate results, and export the analysis to CSV."
              icon={Layers}
              label="Open batch analysis"
              onClick={() => onNavigate('batch')}
              variant="blue"
            />
          </div>
        </section>

        {/* MONITORING SHORTCUT */}
        <button
          type="button"
          onClick={() => onNavigate('monitoring')}
          className="group flex w-full items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 text-left transition-all hover:border-teal-400/30 hover:bg-[var(--bg-card)] sm:p-5"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-400/10">
              <Activity className="h-5 w-5 text-sky-400" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                Monitoring & telemetry
              </p>
              <p className="mt-1 truncate text-[11px] text-[var(--text-muted)]">
                Explore request counts, inference latency, confidence trends and recent events.
              </p>
            </div>
          </div>

          <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-teal-400" />
        </button>

        {/* ACADEMIC DISCLAIMER */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.045] p-4 sm:p-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-400/20 bg-amber-400/10">
            <ShieldCheck className="h-4 w-4 text-amber-400" />
          </div>

          <div className="min-w-0">
            <h3 className="text-xs font-semibold text-amber-300">
              Academic Diagnostic Demarcation
            </h3>

            <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--text-secondary)]">
              Vistara AI is an experimental decision-support system trained on
              laboratory-controlled foliar photographs. Heatmaps indicate
              influential feature zones rather than causal phytopathology.
              Outputs must be verified by agricultural professionals prior to
              any field interventions.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
