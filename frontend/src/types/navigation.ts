export type PageId =
  | 'overview'
  | 'scanner'
  | 'batch'
  | 'monitoring'
  | 'report'
  | 'library'
  | 'help';

export interface NavItemConfig {
  id: PageId;
  label: string;
  shortDescription: string;
  badge?: string;
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    shortDescription: 'System status & quick diagnostics',
  },
  {
    id: 'scanner',
    label: 'Disease Scanner',
    shortDescription: 'Single-image leaf analysis & Grad-CAM',
  },
  {
    id: 'batch',
    label: 'Batch Analysis',
    shortDescription: 'Queue multi-image classification',
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    shortDescription: 'Operational telemetry & drift signals',
  },
  {
    id: 'report',
    label: 'Model Report',
    shortDescription: 'Offline test metrics & confusion matrix',
  },
  {
    id: 'library',
    label: 'Disease Library',
    shortDescription: 'Reference symptoms for supported classes',
  },
  {
    id: 'help',
    label: 'Help / About',
    shortDescription: 'Methodology, limitations & disclaimers',
  },
];

