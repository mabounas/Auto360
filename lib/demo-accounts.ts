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

// Comptes groupés par périmètre : c'est ce qui rend le cloisonnement visible en
// démonstration — deux agences d'une même enseigne ne voient pas les mêmes dossiers.
export const COMPTES_DEMO: { groupe: string; comptes: CompteDemo[] }[] = [
  {
    groupe: "Client",
    comptes: [
      {
        email: "client@auto360.ma",
        libelle: "Youssef Mansouri",
        role: "Client",
        perimetre: "Ses véhicules, RDV, devis et factures",
      },
    ],
  },
  {
    groupe: "Agence Auto Hall Lalla Yacout",
    comptes: [
      {
        email: "sav.casa@auto360.ma",
        libelle: "Karim Amrani",
        role: "Responsable SAV",
        perimetre: "Pilotage de cette agence uniquement",
      },
      {
        email: "accueil.casa@auto360.ma",
        libelle: "Nadia El Fassi",
        role: "Réceptionnaire",
        perimetre: "Accueil véhicule, ouverture des OR",
      },
      {
        email: "chefatelier.casa@auto360.ma",
        libelle: "Hicham Tazi",
        role: "Chef d'atelier",
        perimetre: "Planning, positions, contrôle qualité",
      },
      {
        email: "technicien.casa@auto360.ma",
        libelle: "Omar Benjelloun",
        role: "Technicien",
        perimetre: "Diagnostic et interventions",
      },
      {
        email: "pricing.casa@auto360.ma",
        libelle: "Sara Ouazzani",
        role: "Pricing / chiffrage",
        perimetre: "Devis à établir après diagnostic",
      },
      {
        email: "pieces.casa@auto360.ma",
        libelle: "Rania Chraibi",
        role: "Gestionnaire pièces",
        perimetre: "Stock et réservations",
      },
    ],
  },
  {
    groupe: "Agence Auto Hall Siège",
    comptes: [
      {
        email: "sav.siege@auto360.ma",
        libelle: "Nabil Alaoui",
        role: "Responsable SAV",
        perimetre: "Ne voit pas les dossiers de Lalla Yacout",
      },
      {
        email: "accueil.siege@auto360.ma",
        libelle: "Imane Bouzidi",
        role: "Réceptionnaire",
        perimetre: "Accueil de cette agence uniquement",
      },
    ],
  },
  {
    groupe: "Agence Renault Casablanca",
    comptes: [
      {
        email: "sav.renault@auto360.ma",
        libelle: "Anas Cherkaoui",
        role: "Responsable SAV",
        perimetre: "Enseigne concurrente, données séparées",
      },
    ],
  },
  {
    groupe: "Direction d'enseigne",
    comptes: [
      {
        email: "direction@auto360.ma",
        libelle: "Yassine Bennani",
        role: "Direction Auto Hall",
        perimetre: "Les 41 sites Auto Hall, pas Renault ni Peugeot",
      },
      {
        email: "admin.autohall@auto360.ma",
        libelle: "Leila Sekkat",
        role: "Admin Auto Hall",
        perimetre: "Paramétrage de toute l'enseigne Auto Hall",
      },
      {
        email: "direction.renault@auto360.ma",
        libelle: "Mehdi Berrada",
        role: "Direction Renault",
        perimetre: "Les 14 sites Renault uniquement",
      },
      {
        email: "centreappel@auto360.ma",
        libelle: "Salma Idrissi",
        role: "Centre d'appel Auto Hall",
        perimetre: "RDV téléphoniques sur le réseau Auto Hall",
      },
    ],
  },
  {
    groupe: "Administration globale",
    comptes: [
      {
        email: "admin@auto360.ma",
        libelle: "Administrateur",
        role: "Admin global",
        perimetre: "Toutes les enseignes et tous les sites",
      },
    ],
  },
];
