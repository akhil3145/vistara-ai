import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { AlertTriangle, Cpu, Info } from 'lucide-react';

export const HelpPage: React.FC = () => {
  return (
    <PageContainer
      title="Help & Academic Documentation"
      subtitle="Methodology, system limitations, prediction score interpretation, and academic project disclosures."
      badge={
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
          Academic Disclosures
        </span>
      }
    >
      <div className="space-y-6">
        {/* Core Methodology */}
        <div className="p-6 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Cpu className="w-4 h-4 text-teal-500" />
            <span>Detection Methodology & Model Architecture</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Vistara AI is an experimental computer-vision classifier leveraging transfer learning via MobileNetV2 pre-trained on ImageNet. The final classification head is fine-tuned to classify 38 target classes across common crops and foliar conditions from the PlantVillage dataset.
          </p>
        </div>

        {/* Prediction Interpretation */}
        <div className="p-6 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Info className="w-4 h-4 text-sky-500" />
            <span>How to Interpret Model Scores</span>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
            <li>
              <strong>Softmax Score:</strong> Represents relative class likelihood under a closed-set hypothesis; it is <em>not</em> an empirically calibrated probability of biological ground-truth correctness.
            </li>
            <li>
              <strong>Grad-CAM Activation:</strong> Heatmaps highlight spatial pixel gradients that drove internal convolutional activations. They do not constitute botanical causality.
            </li>
            <li>
              <strong>Uncertainty Threshold:</strong> Predictions with confidence scores below 70% are automatically flagged as <em>Needing Review</em>.
            </li>
          </ul>
        </div>

        {/* Diagnostic Boundary */}
        <div className="p-6 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Operational & Diagnostic Limitations</span>
          </div>
          <p className="text-xs text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
            The PlantVillage training set consists predominantly of individual leaves photographed against uniform backgrounds in controlled environments. Performance on field photographs featuring complex backgrounds, direct harsh sunlight, insect chewing, or multi-disease co-infections may exhibit domain shift. Vistara AI must never be used as the sole authority for agricultural interventions or chemical applications.
          </p>
        </div>
      </div>
    </PageContainer>
  );
};
