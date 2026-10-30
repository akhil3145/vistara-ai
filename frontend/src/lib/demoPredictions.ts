import { DISEASE_CLASSES, getDiseaseDisplayName } from '../data/diseaseClasses';
import type { DiseaseClass } from '../types/disease';
import type { ClassScore, DemoPrediction } from '../types/prediction';

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const mulberry32 = (seed: number): (() => number) => {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffle = <T,>(items: T[], random: () => number): T[] => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

const pickClasses = (
  random: () => number,
  preferredClassId?: string,
): DiseaseClass[] => {
  const preferred = preferredClassId
    ? DISEASE_CLASSES.find((disease) => disease.id === preferredClassId)
    : undefined;
  const remainder = shuffle(
    DISEASE_CLASSES.filter((disease) => disease.id !== preferred?.id),
    random,
  );
  const selected = preferred ? [preferred, ...remainder] : remainder;
  return selected.slice(0, 5);
};

const roundScore = (value: number): number => Math.round(value * 10000) / 10000;

export const generateDemoPrediction = (
  seed: string,
  preferredClassId?: string,
): DemoPrediction => {
  const random = mulberry32(hashString(seed));
  const selectedClasses = pickClasses(random, preferredClassId);
  const topScore = preferredClassId
    ? 0.72 + random() * 0.24
    : 0.51 + random() * 0.38;
  const remaining = 1 - topScore;
  const weights = [
    0.5 + random() * 0.3,
    0.3 + random() * 0.25,
    0.15 + random() * 0.2,
    0.08 + random() * 0.14,
  ];
  const weightTotal = weights.reduce((total, weight) => total + weight, 0);
  const scores = [
    topScore,
    ...weights.map((weight) => (weight / weightTotal) * remaining),
  ].map(roundScore);

  const classes: ClassScore[] = selectedClasses.map((disease, index) => ({
    classId: disease.id,
    crop: disease.crop,
    label: getDiseaseDisplayName(disease),
    score: scores[index],
  }));

  return {
    classes,
    top: classes[0],
    latencyMs: Math.round(160 + random() * 340),
    modelVersion: 'demo-v0-untrained',
    isDemo: true,
    seed,
  };
};
