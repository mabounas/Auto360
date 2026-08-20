"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { nextNumero } from "@/lib/numbering";
import { oneOf } from "@/lib/utils";
import {
  Role,
  StatutOR,
  StatutRdv,
  MotifVisite,
  EquipeAtelier,
  CodeService,
} from "@/app/generated/prisma/client";

// Le service réservé détermine le motif de visite et l'équipe atelier destinataire :
// le conseiller n'a pas à ressaisir ce que le client a déjà choisi en réservant.
const ORIENTATION: Record<CodeService, { motif: MotifVisite; equipe: EquipeAtelier }> = {
  DIAGNOSTIC: { motif: MotifVisite.DIAGNOSTIC_PANNE, equipe: EquipeAtelier.MECANIQUE_GENERALE },
  MECANIQUE_ELECTRICITE: { motif: MotifVisite.DIAGNOSTIC_PANNE, equipe: EquipeAtelier.MECANIQUE_GENERALE },
  CLIMATISATION_CONFORT: { motif: MotifVisite.DIAGNOSTIC_PANNE, equipe: EquipeAtelier.MECANIQUE_GENERALE },
  PNEUMATIQUE: { motif: MotifVisite.ENTRETIEN_PERIODIQUE, equipe: EquipeAtelier.REVISION },
  ENTRETIEN_REVISION: { motif: MotifVisite.ENTRETIEN_PERIODIQUE, equipe: EquipeAtelier.REVISION },
  CONTROLE_TECHNIQUE: { motif: MotifVisite.ENTRETIEN_PERIODIQUE, equipe: EquipeAtelier.REVISION },
  PIECES_RECHANGE: { motif: MotifVisite.ENTRETIEN_PERIODIQUE, equipe: EquipeAtelier.REVISION },
  CARROSSERIE_ESTHETIQUE: { motif: MotifVisite.CARROSSERIE, equipe: EquipeAtelier.CARROSSERIE },
};

// §4.3 — Réception du véhicule à l'arrivée du client : le rendez-vous devient un
// ordre de réparation, sans ressaisie. C'est le geste qui fait passer le dossier
// du planning à l'atelier.
export async function receptionnerRendezVous(formData: FormData) {
  const session = await getSession();
  if (
    !session ||
    !oneOf(session.role, Role.RECEPTIONNAIRE, Role.CHEF_ATELIER, Role.RESPONSABLE_SAV, Role.ADMIN)
  ) {
    throw new Error("Seul l'accueil peut réceptionner un véhicule");
  }

  const rendezVousId = String(formData.get("rendezVousId"));
  const etatDesLieuxNotes = String(formData.get("etatDesLieuxNotes") ?? "");

  const rdv = await prisma.rendezVous.findUnique({
    where: { id: rendezVousId },
    include: { site: true, serviceType: true, ordreReparation: true },
  });
  if (!rdv) throw new Error("Rendez-vous introuvable");

  // Le rendez-vous doit relever du périmètre du collaborateur.
  if (session.siteId && rdv.siteId !== session.siteId) throw new Error("Non autorisé sur ce site");
  if (session.compagnieId && rdv.site.compagnieId !== session.compagnieId) {
    throw new Error("Non autorisé sur ce site");
  }

  // Réception déjà faite : on renvoie le dossier existant plutôt que d'en créer un second.
  if (rdv.ordreReparation) return rdv.ordreReparation.id;

  const orientation = ORIENTATION[rdv.serviceType.code];
  const numero = await nextNumero(rdv.siteId, rdv.site.code, "OR");

  const or = await prisma.ordreReparation.create({
    data: {
      numero,
      clientId: rdv.clientId,
      vehiculeId: rdv.vehiculeId,
      siteId: rdv.siteId,
      rendezVousId: rdv.id,
      motifVisite: orientation.motif,
      equipeAtelier: orientation.equipe,
      etatDesLieuxNotes: etatDesLieuxNotes || rdv.motif || null,
      statut:
        orientation.motif === MotifVisite.DIAGNOSTIC_PANNE
          ? StatutOR.DIAGNOSTIC_EN_COURS
          : StatutOR.ACCUEIL,
    },
  });

  // Le rendez-vous est honoré : il sort du planning des prestations attendues.
  await prisma.rendezVous.update({
    where: { id: rdv.id },
    data: { statut: StatutRdv.REALISE },
  });

  revalidatePath("/dashboard/rendez-vous");
  revalidatePath("/dashboard/or");
  return or.id;
}

// Le client ne s'est pas présenté : le créneau est libéré pour d'autres réservations.
export async function marquerAbsent(formData: FormData) {
  const session = await getSession();
  if (
    !session ||
    !oneOf(session.role, Role.RECEPTIONNAIRE, Role.CHEF_ATELIER, Role.RESPONSABLE_SAV, Role.ADMIN)
  ) {
    throw new Error("Non autorisé");
  }

  const rendezVousId = String(formData.get("rendezVousId"));
  const rdv = await prisma.rendezVous.findUnique({
    where: { id: rendezVousId },
    include: { site: true },
  });
  if (!rdv) throw new Error("Rendez-vous introuvable");
  if (session.siteId && rdv.siteId !== session.siteId) throw new Error("Non autorisé sur ce site");

  await prisma.rendezVous.update({
    where: { id: rendezVousId },
    data: { statut: StatutRdv.NO_SHOW },
  });

  revalidatePath("/dashboard/rendez-vous");
}
