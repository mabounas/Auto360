// Miroir client-safe des enums Prisma : les composants client ne peuvent pas importer
// `@/app/generated/prisma/client` (module Node), mais ont besoin des mêmes valeurs.
// Les chaînes doivent rester identiques à celles du schéma Prisma.

export const Role = {
  CLIENT: "CLIENT",
  CENTRE_APPEL: "CENTRE_APPEL",
  RECEPTIONNAIRE: "RECEPTIONNAIRE",
  TECHNICIEN: "TECHNICIEN",
  CHEF_ATELIER: "CHEF_ATELIER",
  GESTIONNAIRE_PIECES: "GESTIONNAIRE_PIECES",
  PRICING: "PRICING",
  RESPONSABLE_SAV: "RESPONSABLE_SAV",
  DIRECTION_GROUPE: "DIRECTION_GROUPE",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const StatutOR = {
  ACCUEIL: "ACCUEIL",
  DIAGNOSTIC_EN_COURS: "DIAGNOSTIC_EN_COURS",
  DEVIS_EN_ATTENTE: "DEVIS_EN_ATTENTE",
  DEVIS_VALIDE: "DEVIS_VALIDE",
  EN_REPARATION: "EN_REPARATION",
  CONTROLE_QUALITE: "CONTROLE_QUALITE",
  PRET_RESTITUTION: "PRET_RESTITUTION",
  RESTITUE: "RESTITUE",
  CLOTURE: "CLOTURE",
  ANNULE: "ANNULE",
} as const;
export type StatutOR = (typeof StatutOR)[keyof typeof StatutOR];
