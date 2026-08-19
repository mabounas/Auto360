"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { nextNumero } from "@/lib/numbering";
import {
  Role,
  StatutOR,
  StatutDevis,
  MotifVisite,
  EquipeAtelier,
  TypeLigneDevis,
  StatutReservationPiece,
  StatutPaiement,
} from "@/app/generated/prisma/client";

async function requireRole(roles: Role[]) {
  const session = await getSession();
  if (!session || !roles.includes(session.role)) throw new Error("Non autorisé");
  return session;
}

// §4.3 — Création de l'OR à la réception du véhicule
export async function creerOrdreReparation(formData: FormData) {
  const session = await requireRole([Role.RECEPTIONNAIRE, Role.CHEF_ATELIER, Role.ADMIN, Role.RESPONSABLE_SAV]);

  const vehiculeId = String(formData.get("vehiculeId"));
  const motifVisite = String(formData.get("motifVisite")) as MotifVisite;
  const siteId = String(formData.get("siteId") || session.siteId || "");
  const etatDesLieuxNotes = String(formData.get("etatDesLieuxNotes") ?? "");
  const rendezVousId = formData.get("rendezVousId") ? String(formData.get("rendezVousId")) : null;
  const sinistre = formData.get("sinistre") === "on";
  const compagnieAssurance = formData.get("compagnieAssurance") ? String(formData.get("compagnieAssurance")) : null;

  const vehicule = await prisma.vehicule.findUnique({ where: { id: vehiculeId } });
  if (!vehicule) throw new Error("Véhicule introuvable");

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) throw new Error("Site introuvable");

  const equipeAtelier =
    motifVisite === MotifVisite.CARROSSERIE
      ? EquipeAtelier.CARROSSERIE
      : motifVisite === MotifVisite.ENTRETIEN_PERIODIQUE
        ? EquipeAtelier.REVISION
        : EquipeAtelier.MECANIQUE_GENERALE;

  const numero = await nextNumero(site.id, site.code, "OR");

  const or = await prisma.ordreReparation.create({
    data: {
      numero,
      clientId: vehicule.clientId,
      vehiculeId,
      siteId: site.id,
      rendezVousId,
      motifVisite,
      equipeAtelier,
      etatDesLieuxNotes,
      statut: motifVisite === MotifVisite.DIAGNOSTIC_PANNE ? StatutOR.DIAGNOSTIC_EN_COURS : StatutOR.ACCUEIL,
      sinistre,
      compagnieAssurance,
      statutExpertise: sinistre ? "EN_ATTENTE" : null,
    },
  });

  revalidatePath("/dashboard/or");
  return or.id;
}

// §4.2bis — Le technicien saisit son rapport de diagnostic et le transmet au pricing
export async function enregistrerDiagnostic(formData: FormData) {
  const session = await requireRole([Role.TECHNICIEN, Role.CHEF_ATELIER, Role.ADMIN]);

  const ordreReparationId = String(formData.get("ordreReparationId"));
  const anomaliesConstatees = String(formData.get("anomaliesConstatees") ?? "");
  const piecesARemplacer = String(formData.get("piecesARemplacer") ?? "");
  const mesures = {
    moteur: String(formData.get("moteur") ?? ""),
    freinage: String(formData.get("freinage") ?? ""),
    direction: String(formData.get("direction") ?? ""),
    niveaux: String(formData.get("niveaux") ?? ""),
    pneumatiques: String(formData.get("pneumatiques") ?? ""),
    electrique: String(formData.get("electrique") ?? ""),
  };

  await prisma.diagnosticRapport.upsert({
    where: { ordreReparationId },
    create: {
      ordreReparationId,
      technicienId: session.userId,
      anomaliesConstatees,
      piecesARemplacer,
      mesures,
      transmisPricingAt: new Date(),
    },
    update: { anomaliesConstatees, piecesARemplacer, mesures, transmisPricingAt: new Date() },
  });

  await prisma.ordreReparation.update({
    where: { id: ordreReparationId },
    data: { statut: StatutOR.DEVIS_EN_ATTENTE },
  });

  revalidatePath(`/dashboard/or/${ordreReparationId}`);
}

// §4.3 — L'équipe pricing complète le devis à partir du diagnostic
export async function ajouterLigneDevis(formData: FormData) {
  await requireRole([Role.PRICING, Role.RESPONSABLE_SAV, Role.ADMIN, Role.RECEPTIONNAIRE]);

  const ordreReparationId = String(formData.get("ordreReparationId"));
  const type = String(formData.get("type")) as TypeLigneDevis;
  const quantite = Number(formData.get("quantite") ?? 1);

  const session = await getSession();

  let devis = await prisma.devis.findUnique({ where: { ordreReparationId } });
  if (!devis) {
    devis = await prisma.devis.create({
      data: { ordreReparationId, creeParId: session!.userId, statut: StatutDevis.BROUILLON },
    });
  }

  let designation = String(formData.get("designation") ?? "");
  let prixUnitaireHT = Number(formData.get("prixUnitaireHT") ?? 0);
  let pieceId: string | null = null;
  let forfaitId: string | null = null;

  if (type === TypeLigneDevis.PIECE && formData.get("pieceId")) {
    pieceId = String(formData.get("pieceId"));
    const piece = await prisma.piece.findUnique({ where: { id: pieceId } });
    if (piece) {
      designation = piece.designation;
      prixUnitaireHT = Number(piece.prixHT);
    }
  }

  if (type === TypeLigneDevis.FORFAIT && formData.get("forfaitId")) {
    forfaitId = String(formData.get("forfaitId"));
    const forfait = await prisma.forfait.findUnique({ where: { id: forfaitId } });
    if (forfait) {
      designation = forfait.nom;
      prixUnitaireHT = Number(forfait.prixFixeHT);
    }
  }

  await prisma.devisLigne.create({
    data: { devisId: devis.id, type, designation, quantite, prixUnitaireHT, pieceId, forfaitId },
  });

  await recalculerTotauxDevis(devis.id);
  revalidatePath(`/dashboard/or/${ordreReparationId}`);
}

export async function supprimerLigneDevis(formData: FormData) {
  await requireRole([Role.PRICING, Role.RESPONSABLE_SAV, Role.ADMIN, Role.RECEPTIONNAIRE]);
  const ligneId = String(formData.get("ligneId"));
  const ordreReparationId = String(formData.get("ordreReparationId"));

  const ligne = await prisma.devisLigne.delete({ where: { id: ligneId } });
  await recalculerTotauxDevis(ligne.devisId);
  revalidatePath(`/dashboard/or/${ordreReparationId}`);
}

async function recalculerTotauxDevis(devisId: string) {
  const lignes = await prisma.devisLigne.findMany({ where: { devisId } });
  let ht = 0;
  let ttc = 0;
  for (const l of lignes) {
    const ligneHT = Number(l.prixUnitaireHT) * l.quantite;
    ht += ligneHT;
    ttc += ligneHT * (1 + Number(l.tauxTva) / 100);
  }
  await prisma.devis.update({
    where: { id: devisId },
    data: { montantHT: ht.toFixed(2), montantTTC: ttc.toFixed(2) },
  });
}

// §4.3 — Publication du devis vers le portail client + réservation automatique des pièces (§4.4)
export async function publierDevis(formData: FormData) {
  await requireRole([Role.PRICING, Role.RESPONSABLE_SAV, Role.ADMIN]);
  const ordreReparationId = String(formData.get("ordreReparationId"));

  const devis = await prisma.devis.findUnique({
    where: { ordreReparationId },
    include: { lignes: true },
  });
  if (!devis) throw new Error("Devis introuvable");

  await prisma.devis.update({
    where: { id: devis.id },
    data: { statut: StatutDevis.PUBLIE, publieAt: new Date() },
  });

  for (const ligne of devis.lignes) {
    if (ligne.pieceId) {
      await prisma.reservationPiece.create({
        data: { ordreReparationId, pieceId: ligne.pieceId, quantite: ligne.quantite },
      });
    }
  }

  revalidatePath(`/dashboard/or/${ordreReparationId}`);
}

// §4.3 — Validation du devis à distance par le client (signature électronique simplifiée)
export async function validerDevisClient(formData: FormData) {
  const session = await requireRole([Role.CLIENT]);
  const ordreReparationId = String(formData.get("ordreReparationId"));
  const accepte = formData.get("accepte") === "true";

  const or = await prisma.ordreReparation.findUnique({
    where: { id: ordreReparationId },
    include: { client: true, devis: true },
  });
  if (!or || or.client.userId !== session.userId) throw new Error("Non autorisé");
  if (!or.devis) throw new Error("Aucun devis à valider");

  await prisma.devis.update({
    where: { id: or.devis.id },
    data: accepte
      ? { statut: StatutDevis.VALIDE, validationClientAt: new Date() }
      : { statut: StatutDevis.REFUSE, refuseAt: new Date() },
  });

  await prisma.ordreReparation.update({
    where: { id: ordreReparationId },
    data: { statut: accepte ? StatutOR.DEVIS_VALIDE : StatutOR.ANNULE },
  });

  revalidatePath(`/dashboard/or/${ordreReparationId}`);
}

export async function changerStatutOR(formData: FormData) {
  await requireRole([Role.TECHNICIEN, Role.CHEF_ATELIER, Role.RECEPTIONNAIRE, Role.RESPONSABLE_SAV, Role.ADMIN]);
  const ordreReparationId = String(formData.get("ordreReparationId"));
  const statut = String(formData.get("statut")) as StatutOR;

  await prisma.ordreReparation.update({ where: { id: ordreReparationId }, data: { statut } });
  revalidatePath(`/dashboard/or/${ordreReparationId}`);
}

// §4.11 — Le technicien saisit temps passé et observations
export async function ajouterLigneIntervention(formData: FormData) {
  const session = await requireRole([Role.TECHNICIEN, Role.CHEF_ATELIER, Role.ADMIN]);
  const ordreReparationId = String(formData.get("ordreReparationId"));

  await prisma.ligneIntervention.create({
    data: {
      ordreReparationId,
      technicienId: session.userId,
      description: String(formData.get("description")),
      tempsPasseMin: Number(formData.get("tempsPasseMin") ?? 0),
    },
  });

  revalidatePath(`/dashboard/or/${ordreReparationId}`);
}

// §4.4 — Contrôle qualité systématique avant restitution
export async function enregistrerControleQualite(formData: FormData) {
  await requireRole([Role.CHEF_ATELIER, Role.TECHNICIEN, Role.RESPONSABLE_SAV, Role.ADMIN]);
  const ordreReparationId = String(formData.get("ordreReparationId"));
  const ok = formData.get("controleQualiteOk") === "true";

  await prisma.ordreReparation.update({
    where: { id: ordreReparationId },
    data: {
      controleQualiteOk: ok,
      controleQualiteNote: String(formData.get("controleQualiteNote") ?? ""),
      statut: ok ? StatutOR.PRET_RESTITUTION : StatutOR.EN_REPARATION,
    },
  });

  revalidatePath(`/dashboard/or/${ordreReparationId}`);
}

// §4.5 — Clôture de l'OR + génération automatique de la facture, décrément du stock,
// et déclenchement de l'enquête de satisfaction (§4.7)
export async function cloturerEtFacturer(formData: FormData) {
  await requireRole([Role.RECEPTIONNAIRE, Role.RESPONSABLE_SAV, Role.ADMIN]);
  const ordreReparationId = String(formData.get("ordreReparationId"));

  const or = await prisma.ordreReparation.findUnique({
    where: { id: ordreReparationId },
    include: { devis: true, site: true, reservationsPieces: true },
  });
  if (!or) throw new Error("OR introuvable");
  if (!or.devis || or.devis.statut !== StatutDevis.VALIDE) {
    throw new Error("Le devis doit être validé par le client avant facturation");
  }

  const numero = await nextNumero(or.siteId, or.site.code, "FACTURE");

  await prisma.facture.create({
    data: {
      numero,
      ordreReparationId,
      clientId: or.clientId,
      montantHT: or.devis.montantHT,
      montantTTC: or.devis.montantTTC,
      statutPaiement: StatutPaiement.EN_ATTENTE,
    },
  });

  // Décrément du stock pour les pièces effectivement posées
  for (const resa of or.reservationsPieces) {
    if (resa.statut !== StatutReservationPiece.RESERVEE) continue;
    await prisma.reservationPiece.update({
      where: { id: resa.id },
      data: { statut: StatutReservationPiece.UTILISEE },
    });
    await prisma.stockPiece.updateMany({
      where: { pieceId: resa.pieceId, siteId: or.siteId },
      data: { quantiteDisponible: { decrement: resa.quantite } },
    });
  }

  await prisma.ordreReparation.update({
    where: { id: ordreReparationId },
    data: { statut: StatutOR.CLOTURE, clotureAt: new Date() },
  });

  // Enquête de satisfaction déclenchée automatiquement à la restitution
  await prisma.enqueteSatisfaction.upsert({
    where: { ordreReparationId },
    create: { ordreReparationId, clientId: or.clientId },
    update: {},
  });

  revalidatePath(`/dashboard/or/${ordreReparationId}`);
  revalidatePath("/dashboard/factures");
}
