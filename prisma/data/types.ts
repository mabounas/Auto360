export type SiteReseau = {
  code: string;
  nom: string;
  ville: string;
  adresse: string;
  telephone: string | null;
  latitude: number;
  longitude: number;
  marques: string[];
};

export type CompagnieReseau = {
  code: string;
  nom: string;
  description: string;
  couleur: string;
  sites: SiteReseau[];
};
