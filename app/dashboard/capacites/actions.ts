"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Role } from "@/app/generated/prisma/client";
import { porteeSites } from "@/lib/portee";
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

  // Un collaborateur ne peut régler que la capacité d'un site de son périmètre :
  // le contrôle est refait ici, l'écran ne suffit pas à garantir l'isolation.
  // `AND` et non un spread : `porteeSites` renvoie parfois une clé `id`, qui
  // écraserait silencieusement le site demandé et laisserait passer le contrôle.
  const autorise = await prisma.site.findFirst({
    where: { AND: [{ id: siteId }, porteeSites(session)] },
    select: { id: true },
  });
  if (!autorise) throw new Error("Non autorisé sur ce site");

  await prisma.disponibiliteConfig.updateMany({
    where: { siteId, serviceTypeId },
    data: { capaciteParCreneau: positions },
  });

  revalidatePath("/dashboard/capacites");
}
