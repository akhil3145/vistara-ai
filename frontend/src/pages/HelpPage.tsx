import React from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  ChevronRight,
  Cpu,
  Info,
  Layers,
  Microscope,
  ScanLine,
  ShieldCheck,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';

const SECTIONS = [
  { id: 'scanner', label: 'Using the scanner' },
  { id: 'batch', label: 'Batch analysis' },
  { id: 'scores', label: 'Interpreting scores' },
  { id: 'gradcam', label: 'Grad-CAM heatmaps' },
  { id: 'architecture', label: 'Model architecture' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'disclaimer', label: 'Academic disclaimer' },
];

interface DocSectionProps {
  id: string;
  index: string;
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

const DocSection: React.FC<DocSectionProps> = ({
  id,
  index,
  title,
  description,
  icon: Icon,
  children,
}) => (
  <section
    id={id}
    className="scroll-mt-24 rounded-2xl border border-line bg-panel p-4 shadow-panel sm:p-5"
  >
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/10">
        <Icon className="h-4 w-4 text-accent" />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-faint">
            {index}
          </span>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
        </div>
        <p className="mt-1 text-[10.5px] text-faint">{description}</p>
      </div>
    </div>

    <div className="mt-4 border-t border-line/70 pt-4 text-[11px] leading-relaxed text-muted">
      {children}
    </div>
  </section>
);

const Step: React.FC<{ number: string; title: string; children: React.ReactNode }> = ({
  number,
  title,
  children,
}) => (
  <div className="flex gap-3">
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-line bg-raised/60 font-mono text-[9px] text-accent">
      {number}
    </span>
    <div>
      <p className="text-[11px] font-semibold text-ink">{title}</p>
      <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted">{children}</p>
    </div>
  </div>
);

export const HelpPage: React.FC = () => {
  return (
    <PageContainer
      eyebrow="Documentation · methodology"
      title="Help & Academic Documentation"
      subtitle="How the workspace behaves, how to read model output, and where the scientific boundaries are."
      badge={<span className="chip chip-cyan font-mono">Academic disclosures</span>}
      actions={
        <span className="chip">
          <BookOpen className="h-3 w-3 text-accent" />
          Reference guide
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Contents */}
        <aside className="lg:col-span-3">
          <div className="panel p-4 lg:sticky lg:top-24">
            <p className="eyebrow">On this page</p>
            <nav className="mt-3 space-y-0.5">
              {SECTIONS.map((section, index) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="group flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[11px] text-muted transition-colors hover:bg-raised/50 hover:text-ink"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[9px] text-faint">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {section.label}
                  </span>
                  <ChevronRight className="h-3 w-3 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
                </a>
              ))}
            </nav>

            <div className="mt-4 rounded-xl border border-line bg-base/30 p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-accent" />
                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-faint">
                  Runtime
                </span>
              </div>
              <p className="text-[10px] leading-relaxed text-muted">
                FastAPI backend · MobileNetV2 · 38 PlantVillage classes ·
                SQLite telemetry.
              </p>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="space-y-4 lg:col-span-9">
          <DocSection
            id="scanner"
            index="01"
            title="Using the disease scanner"
            description="Single-image foliar classification with ranked scores."
            icon={ScanLine}
          >
            <div className="space-y-3.5">
              <Step number="1" title="Select an input">
                Drag a JPEG, PNG, or WEBP leaf photograph into the scanner, or
                choose one of the illustrative SVG samples. Uploads are validated
                for format and size before analysis.
              </Step>
              <Step number="2" title="Run inference">
                Press <span className="text-ink">Analyze leaf</span>. Uploaded
                photographs are sent to the FastAPI backend at{' '}
                <code className="text-accent">POST /api/v1/predict</code>.
                Illustrative samples are simulated locally and clearly badged as
                demo data.
              </Step>
              <Step number="3" title="Inspect the output">
                Review the top prediction, ranked top-5 scores, server-measured
                latency, image metadata, and the Grad-CAM panel when the backend
                returns a heatmap.
              </Step>
            </div>
          </DocSection>

          <DocSection
            id="batch"
            index="02"
            title="Running a batch campaign"
            description="Multi-image queueing, uncertainty filters, and CSV export."
            icon={Layers}
          >
            <div className="space-y-3.5">
              <Step number="1" title="Build the queue">
                Add up to 24 images with the batch dropzone. You can also load
                the illustrative sample set to explore the interface without a
                licensed dataset.
              </Step>
              <Step number="2" title="Set the review threshold">
                The threshold flags completed predictions below the chosen score
                as <span className="text-warning">Needs review</span>. Status and
                score-range filters then narrow the visible records.
              </Step>
              <Step number="3" title="Run and export">
                Press <span className="text-ink">Run batch analysis</span>.
                Uploaded files are sent to{' '}
                <code className="text-cyan">POST /api/v1/predict/batch</code>.
                CSV export preserves the active filters and marks demo rows
                explicitly.
              </Step>
            </div>
          </DocSection>

          <DocSection
            id="scores"
            index="03"
            title="Interpreting model scores"
            description="What a softmax output does and does not mean."
            icon={BarChart3}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-base/30 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-accent">
                  Softmax score
                </p>
                <p className="mt-1.5">
                  A relative class likelihood under a closed-set hypothesis. It
                  is <span className="text-ink">not</span> an empirically
                  calibrated probability of biological ground-truth correctness.
                </p>
              </div>
              <div className="rounded-xl border border-line bg-base/30 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-cyan">
                  Review threshold
                </p>
                <p className="mt-1.5">
                  A configurable screening rule, not a clinical cut-off.
                  Predictions below 70% are flagged by default for additional
                  human review.
                </p>
              </div>
            </div>
          </DocSection>

          <DocSection
            id="gradcam"
            index="04"
            title="Grad-CAM heatmaps"
            description="Spatial activation guidance, not botanical causality."
            icon={Microscope}
          >
            <p>
              Grad-CAM highlights image regions whose gradients contributed most
              strongly to the predicted class activation. Heatmaps are useful for
              detecting spurious attention, but they do not prove that a
              biological mechanism is present. When the backend does not return a
              heatmap, the classification result remains available.
            </p>
          </DocSection>

          <DocSection
            id="architecture"
            index="05"
            title="Detection methodology"
            description="Transfer learning and the reported evaluation scope."
            icon={Cpu}
          >
            <p>
              Vistara AI is an experimental computer-vision classifier that uses
              transfer learning from MobileNetV2 pre-trained on ImageNet. The
              classification head is fine-tuned for 38 target classes across
              common crops and foliar conditions from PlantVillage. Metrics on the
              Model Report page are read from the supplied evaluation artifact
              and are not independently recomputed by this interface.
            </p>
          </DocSection>

          <DocSection
            id="limitations"
            index="06"
            title="Operational & diagnostic limitations"
            description="Where domain shift can affect predictions."
            icon={AlertTriangle}
          >
            <div className="rounded-xl border border-warning/20 bg-warning/[0.045] p-3.5">
              <p>
                The PlantVillage training set consists predominantly of single
                leaves photographed against uniform backgrounds in controlled
                environments. Performance on field photographs with complex
                backgrounds, harsh sunlight, insect damage, or multi-disease
                co-infections may degrade due to domain shift. Vistara AI must
                never be used as the sole authority for agricultural
                interventions or chemical applications.
              </p>
            </div>
          </DocSection>

          <DocSection
            id="disclaimer"
            index="07"
            title="Academic disclaimer"
            description="Decision support, not a diagnostic authority."
            icon={ShieldCheck}
          >
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
              <p>
                Vistara AI is an educational and preliminary decision-support
                tool. Predictions, scores, and visual explanations must be
                verified by qualified agricultural professionals before any
                treatment or field intervention. The interface does not persist
                raw uploaded images; only request telemetry is recorded for
                operational monitoring.
              </p>
            </div>
          </DocSection>
        </div>
      </div>
    </PageContainer>
  );
};
