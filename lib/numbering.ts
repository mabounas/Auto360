import { prisma } from "./prisma";

// Génère un numéro séquentiel par site (ex: OR-CASA01-000123), robuste aux accès concurrents
// via un upsert atomique sur SiteCompteur.
export async function nextNumero(siteId: string, siteCode: string, type: "OR" | "FACTURE") {
  const compteur = await prisma.siteCompteur.upsert({
    where: { siteId_type: { siteId, type } },
    create: { siteId, type, valeur: 1 },
    update: { valeur: { increment: 1 } },
  });
  return `${type}-${siteCode}-${String(compteur.valeur).padStart(6, "0")}`;
}
