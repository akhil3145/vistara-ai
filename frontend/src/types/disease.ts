export type PathogenType =
  | 'Fungus'
  | 'Bacterium'
  | 'Virus'
  | 'Oomycete'
  | 'Mite'
  | 'Healthy';

export interface DiseaseClass {
  id: string;
  crop: string;
  name: string;
  pathogen: string;
  pathogenType: PathogenType;
  symptoms: string;
  note: string;
  healthy: boolean;
}
