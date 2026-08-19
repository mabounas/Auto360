"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Role, StatutReclamation } from "@/app/generated/prisma/client";

// SLA de traitement par défaut : 48 h après ouverture (§4.9)
const SLA_HEURES = 48;

export async function creerReclamation(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Non autorisé");

  const motif = String(formData.get("motif"));
  const description = String(formData.get("description") ?? "");
  const ordreReparationId = formData.get("ordreReparationId") ? String(formData.get("ordreReparationId")) : null;

  let clientId: string;
  if (session.role === Role.CLIENT) {
    const client = await prisma.clientProfile.findUnique({ where: { userId: session.userId } });
    if (!client) throw new Error("Profil client introuvable");
    clientId = client.id;
  } else {
    clientId = String(formData.get("clientId"));
  }

  const slaEcheance = new Date();
  slaEcheance.setHours(slaEcheance.getHours() + SLA_HEURES);

  const or = ordreReparationId
    ? await prisma.ordreReparation.findUnique({ where: { id: ordreReparationId } })
    : null;

  await prisma.reclamation.create({
    data: {
      clientId,
      ordreReparationId,
      siteId: or?.siteId ?? null,
      motif,
      description,
      slaEcheance,
      canal: session.role === Role.CLIENT ? "WEB" : "TELEPHONE",
    },
  });

  revalidatePath("/dashboard/reclamations");
}

export async function changerStatutReclamation(formData: FormData) {
  const session = await getSession();
  if (!session || session.role === Role.CLIENT) throw new Error("Non autorisé");

  const id = String(formData.get("id"));
  const statut = String(formData.get("statut")) as StatutReclamation;

  await prisma.reclamation.update({
    where: { id },
    data: {
      statut,
      assigneAId: session.userId,
      resoluAt: statut === StatutReclamation.RESOLU || statut === StatutReclamation.FERME ? new Date() : null,
    },
  });

  revalidatePath("/dashboard/reclamations");
}
