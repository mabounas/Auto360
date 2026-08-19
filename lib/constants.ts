export const SERVICE_TYPES: {
  code: string;
  nom: string;
  description: string;
}[] = [
  {
    code: "DIAGNOSTIC",
    nom: "Diagnostic panne",
    description: "Diagnostic électronique multi-points avant toute intervention.",
  },
  {
    code: "ENTRETIEN_REVISION",
    nom: "Entretien / révision",
    description: "Vidange, filtres, révisions périodiques constructeur.",
  },
  {
    code: "MECANIQUE_ELECTRICITE",
    nom: "Mécanique / électricité",
    description: "Freins, embrayage, distribution, système électrique.",
  },
  {
    code: "CLIMATISATION_CONFORT",
    nom: "Climatisation & confort",
    description: "Recharge clim, contrôle d'étanchéité, équipements de confort.",
  },
  {
    code: "PNEUMATIQUE",
    nom: "Pneumatique",
    description: "Montage, équilibrage et remplacement de pneus.",
  },
  {
    code: "CARROSSERIE_ESTHETIQUE",
    nom: "Carrosserie / esthétique",
    description: "Chocs, débosselage, peinture, dossiers sinistre assurance.",
  },
  {
    code: "CONTROLE_TECHNIQUE",
    nom: "Contrôle technique",
    description: "Préparation et accompagnement au contrôle technique.",
  },
  {
    code: "PIECES_RECHANGE",
    nom: "Pièces de rechange",
    description: "Pièces d'origine et compatibles, disponibles au centre.",
  },
];

export const VILLES_COUVERTES = ["Casablanca", "Rabat", "Marrakech", "Tanger", "Agadir", "Fès"];
