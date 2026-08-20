import type { SessionPayload } from "./auth";

// Cloisonnement des données par périmètre du collaborateur.
//
// Trois niveaux, du plus étroit au plus large :
//   1. rattaché à un site      → ne voit que les dossiers de ce point de service
//   2. rattaché à une enseigne → voit tous les sites de son enseigne
//   3. ni l'un ni l'autre      → administrateur global, voit toutes les enseignes
//
// Toutes les requêtes du back-office passent par ces helpers plutôt que de
// reconstruire le filtre : un oubli laisserait fuiter les dossiers d'un autre
// site ou d'une enseigne concurrente.

export type PorteeSite =
  | Record<string, never>
  | { id: string }
  | { compagnieId: string };

/** Filtre à appliquer à une requête `prisma.site`. */
export function porteeSites(session: SessionPayload): PorteeSite {
  if (session.siteId) return { id: session.siteId };
  if (session.compagnieId) return { compagnieId: session.compagnieId };
  return {};
}

/**
 * Filtre à appliquer à un modèle portant directement une colonne `siteId`
 * (ordre de réparation, rendez-vous, stock…).
 */
export function porteeParSiteId(
  session: SessionPayload
): Record<string, never> | { siteId: string } | { site: { compagnieId: string } } {
  if (session.siteId) return { siteId: session.siteId };
  if (session.compagnieId) return { site: { compagnieId: session.compagnieId } };
  return {};
}

/**
 * Même filtre, mais pour un modèle qui n'atteint le site qu'à travers une
 * relation (`facture -> ordreReparation -> site`, par exemple).
 */
export function porteeParRelation(session: SessionPayload, relation: string) {
  if (session.siteId) return { [relation]: { siteId: session.siteId } };
  if (session.compagnieId) {
    return { [relation]: { site: { compagnieId: session.compagnieId } } };
  }
  return {};
}

/** Vrai si le collaborateur voit plusieurs sites (enseigne entière ou tout le parc). */
export function voitPlusieursSites(session: SessionPayload) {
  return !session.siteId;
}

/** Vrai si le collaborateur voit plusieurs enseignes. */
export function voitToutesLesEnseignes(session: SessionPayload) {
  return !session.siteId && !session.compagnieId;
}

export function libellePortee(session: SessionPayload, nomCompagnie?: string | null) {
  if (session.siteId) return "Vue de votre site";
  if (session.compagnieId) return `Vue consolidée — ${nomCompagnie ?? "votre enseigne"}`;
  return "Vue consolidée — toutes enseignes";
}
