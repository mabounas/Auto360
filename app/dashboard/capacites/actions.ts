"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Role } from "@/app/generated/prisma/client";
import { canSeeAllSites } from "@/lib/rbac";
import { oneOf } from "@/lib/utils";

// Met à jour le nombre de positions (postes / agents) affectées à un service sur un site.
// La valeur s'applique à tous les jours d'ouverture : c'est une capacité d'atelier, pas
// un planning individuel.
export async function definirPositions(formData: FormData) {
  const session = await getSession();
  if (!session || !oneOf(session.role, Role.ADMIN, Role.RESPONSABLE_SAV, Role.CHEF_ATELIER)) {
    throw new Error("Non autorisé");
  }

  const siteId = String(formData.get("siteId"));
  const serviceTypeId = String(formData.get("serviceTypeId"));
  const positions = Math.max(0, Math.min(20, Number(formData.get("positions") ?? 1)));

  // Un responsable de site ne peut pas régler la capacité d'un autre site.
  if (!canSeeAllSites(session.role) && siteId !== session.siteId) {
    throw new Error("Non autorisé sur ce site");
  }

  await prisma.disponibiliteConfig.updateMany({
    where: { siteId, serviceTypeId },
    data: { capaciteParCreneau: positions },
  });

  revalidatePath("/dashboard/capacites");
}
