"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Role, ModePaiement, StatutPaiement } from "@/app/generated/prisma/client";
import { oneOf } from "@/lib/utils";

export async function reglerFacture(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Non autorisé");

  const factureId = String(formData.get("factureId"));
  const modePaiement = String(formData.get("modePaiement")) as ModePaiement;

  const facture = await prisma.facture.findUnique({
    where: { id: factureId },
    include: { client: true },
  });
  if (!facture) throw new Error("Facture introuvable");

  // Le client ne peut régler que ses propres factures, et uniquement en ligne
  if (session.role === Role.CLIENT) {
    if (facture.client.userId !== session.userId) throw new Error("Non autorisé");
    if (!oneOf(modePaiement, ModePaiement.CARTE, ModePaiement.MOBILE)) {
      throw new Error("Mode de paiement non disponible en ligne");
    }
  } else if (!oneOf(session.role, Role.RECEPTIONNAIRE, Role.RESPONSABLE_SAV, Role.ADMIN)) {
    throw new Error("Non autorisé");
  }

  await prisma.facture.update({
    where: { id: factureId },
    data: { statutPaiement: StatutPaiement.PAYEE, modePaiement, datePaiement: new Date() },
  });

  revalidatePath("/dashboard/factures");
}
