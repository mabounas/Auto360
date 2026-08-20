// Comptes de démonstration proposés en un clic sur la page de connexion.
//
// Ce raccourci n'existe que pour les présentations commerciales : il expose des
// identifiants en clair et doit rester réservé à un environnement de démonstration.
// Il se désactive en passant NEXT_PUBLIC_DEMO_LOGIN à "false" (voir .env.example) ;
// à retirer avant toute mise en service réelle.

export const DEMO_LOGIN_ACTIF = process.env.NEXT_PUBLIC_DEMO_LOGIN !== "false";

export const MOT_DE_PASSE_DEMO = "Passw0rd!";

export type CompteDemo = {
  email: string;
  libelle: string;
  role: string;
  perimetre: string;
};

export const COMPTES_DEMO: { groupe: string; comptes: CompteDemo[] }[] = [
  {
    groupe: "Côté client",
    comptes: [
      {
        email: "client@auto360.ma",
        libelle: "Youssef Mansouri",
        role: "Client",
        perimetre: "Prise de RDV, devis, factures, avis",
      },
    ],
  },
  {
    groupe: "Accueil & relation client",
    comptes: [
      {
        email: "centreappel@auto360.ma",
        libelle: "Salma Idrissi",
        role: "Centre d'appel",
        perimetre: "RDV téléphoniques, tous sites",
      },
      {
        email: "accueil.casa@auto360.ma",
        libelle: "Nadia El Fassi",
        role: "Réceptionnaire",
        perimetre: "Accueil véhicule, ouverture des OR — Casablanca",
      },
    ],
  },
  {
    groupe: "Atelier",
    comptes: [
      {
        email: "technicien.casa@auto360.ma",
        libelle: "Omar Benjelloun",
        role: "Technicien",
        perimetre: "Diagnostic, interventions — Casablanca",
      },
      {
        email: "chefatelier.casa@auto360.ma",
        libelle: "Hicham Tazi",
        role: "Chef d'atelier",
        perimetre: "Planning, contrôle qualité — Casablanca",
      },
      {
        email: "pricing.casa@auto360.ma",
        libelle: "Sara Ouazzani",
        role: "Pricing / chiffrage",
        perimetre: "Devis à établir — Casablanca",
      },
      {
        email: "pieces.casa@auto360.ma",
        libelle: "Rania Chraibi",
        role: "Gestionnaire pièces",
        perimetre: "Stock et réservations — Casablanca",
      },
    ],
  },
  {
    groupe: "Pilotage",
    comptes: [
      {
        email: "sav.casa@auto360.ma",
        libelle: "Karim Amrani",
        role: "Responsable SAV",
        perimetre: "KPIs et pilotage — Casablanca",
      },
      {
        email: "direction@auto360.ma",
        libelle: "Yassine Bennani",
        role: "Direction groupe",
        perimetre: "Vision consolidée multi-sites",
      },
      {
        email: "admin@auto360.ma",
        libelle: "Administrateur",
        role: "Administrateur",
        perimetre: "Paramétrage complet",
      },
    ],
  },
];
