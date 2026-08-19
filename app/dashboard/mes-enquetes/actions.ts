"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Role } from "@/app/generated/prisma/client";

// §4.7 — Réponse à l'enquête post-intervention ; les points de fidélité sont
// crédités à la première réponse seulement.
const POINTS_PAR_REPONSE = 50;

export async function repondreEnquete(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== Role.CLIENT) throw new Error("Non autorisé");

  const id = String(formData.get("id"));
  const npsScore = Number(formData.get("npsScore"));
  const csatScore = Number(formData.get("csatScore"));
  const commentaire = String(formData.get("commentaire") ?? "");

  const enquete = await prisma.enqueteSatisfaction.findUnique({
    where: { id },
    include: { client: true },
  });
  if (!enquete || enquete.client.userId !== session.userId) throw new Error("Non autorisé");

  const dejaRepondu = enquete.reponduAt !== null;

  await prisma.enqueteSatisfaction.update({
    where: { id },
    data: { npsScore, csatScore, commentaire, reponduAt: new Date() },
  });

  if (!dejaRepondu) {
    await prisma.clientProfile.update({
      where: { id: enquete.clientId },
      data: { pointsFidelite: { increment: POINTS_PAR_REPONSE } },
    });
  }

  revalidatePath("/dashboard/mes-enquetes");
}
