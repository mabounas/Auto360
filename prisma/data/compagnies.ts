import type { CompagnieReseau } from "./types";
import { SITES_AUTOHALL } from "./sites-autohall";
import { SITES_RENAULT } from "./sites-renault";
import { SITES_PEUGEOT } from "./sites-peugeot";

// Auto360 est conçu comme une plateforme multi-compagnies : chaque enseigne (groupe de
// distribution ou réseau de marque) possède ses propres points de service, ses marques
// distribuées et ses équipes. Un même déploiement peut donc servir plusieurs clients,
// et une démonstration commerciale peut se faire directement sur le réseau du prospect.
//
// PASSAGE À UNE ENSEIGNE UNIQUE
// Une fois la solution retenue par un client, il suffit de ne laisser que son enseigne
// dans ce tableau puis de relancer `npm run db:seed` : les sites des enseignes retirées
// sont supprimés par le nettoyage du seed (voir « référentiel réseau fait autorité »),
// et la suppression en cascade emporte leurs rendez-vous, dossiers et stocks. Rien
// d'autre ne change — le cloisonnement par site reste le même, il n'opère alors que
// sur les agences de cette seule enseigne.
export const COMPAGNIES: CompagnieReseau[] = [
  {
    code: "AUTOHALL",
    nom: "Auto Hall",
    description:
      "Groupe de distribution multi-marques : Ford, Nissan, Opel, Fiat, Mitsubishi, Chery et véhicules industriels.",
    couleur: "#003282",
    sites: SITES_AUTOHALL,
  },
  {
    code: "RENAULT",
    nom: "Renault Maroc",
    description: "Réseau de concessions et d'ateliers agréés Renault et Dacia.",
    couleur: "#FFCC33",
    sites: SITES_RENAULT,
  },
  {
    code: "PEUGEOT",
    nom: "Peugeot Maroc",
    description: "Réseau de concessions et d'ateliers agréés Peugeot.",
    couleur: "#0A3A5C",
    sites: SITES_PEUGEOT,
  },
];

export const TOUTES_LES_MARQUES = [
  ...new Set(COMPAGNIES.flatMap((c) => c.sites.flatMap((s) => s.marques))),
].sort();
