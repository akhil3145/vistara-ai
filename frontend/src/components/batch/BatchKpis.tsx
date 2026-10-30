import React from 'react';
import { BarChart3, Layers, ShieldAlert, Target } from 'lucide-react';
import { StatCard } from '../ui/StatCard';
import type { BatchItem } from '../../types/batch';

interface BatchKpisProps {
  items: BatchItem[];
  threshold: number;
}

export const BatchKpis: React.FC<BatchKpisProps> = ({ items, threshold }) => {
  const completed = items.filter(
    (item) => item.status === 'complete' && item.prediction,
  );
  const scores = completed.map((item) => item.prediction!.top.score);
  const meanConfidence =
    scores.length > 0
      ? (scores.reduce((total, score) => total + score, 0) / scores.length) * 100
      : null;
  const reviewCount = completed.filter(
    (item) => item.prediction!.top.score * 100 < threshold,
  ).length;

  const frequency = new Map<string, number>();
  completed.forEach((item) => {
    const label = item.prediction!.top.label;
    frequency.set(label, (frequency.get(label) ?? 0) + 1);
  });
  const mode = Array.from(frequency.entries()).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Processed"
        value={`${completed.length}`}
        hint={`of ${items.length} queued item${items.length === 1 ? '' : 's'}`}
        icon={Layers}
        tone="sky"
      />
      <StatCard
        label="Mean Top-1 Score"
        value={meanConfidence === null ? '—' : `${meanConfidence.toFixed(1)}%`}
        hint="Mean of simulated top-1 scores"
        icon={Target}
        tone="teal"
      />
      <StatCard
        label="Needing Review"
        value={`${reviewCount}`}
        hint={`Below the ${threshold}% review threshold`}
        icon={ShieldAlert}
        tone="amber"
      />
      <StatCard
        label="Most Frequent Class"
        value={mode ? mode[0] : '—'}
        hint={mode ? `${mode[1]} occurrence${mode[1] === 1 ? '' : 's'}` : 'No completed rows'}
        icon={BarChart3}
        tone="purple"
      />
    </div>
  );
};
