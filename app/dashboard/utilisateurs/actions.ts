"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/client";
import { porteeSites } from "@/lib/portee";

export async function creerUtilisateur(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) throw new Error("Non autorisé");

  const role = String(formData.get("role")) as Role;
  if (role === Role.CLIENT) throw new Error("Utilisez l'inscription publique pour les clients");

  const email = String(formData.get("email")).toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Un compte existe déjà avec cet email");

  // Périmètre demandé : un site précis, ou l'enseigne entière.
  const siteIdRaw = String(formData.get("siteId") ?? "");
  const siteId = siteIdRaw || null;

  let compagnieId: string | null = null;
  if (siteId) {
    // Le site doit appartenir au périmètre de l'administrateur qui crée le compte :
    // un admin d'enseigne ne peut pas rattacher quelqu'un au réseau d'un concurrent.
    const site = await prisma.site.findFirst({
      where: { AND: [{ id: siteId }, porteeSites(session)] },
      select: { compagnieId: true },
    });
    if (!site) throw new Error("Site hors de votre périmètre");
    compagnieId = site.compagnieId;
  } else {
    // Sans site : le collaborateur hérite de l'enseigne de son administrateur.
    // Seul un administrateur global peut créer un autre administrateur global.
    compagnieId = session.compagnieId;
  }

  await prisma.user.create({
    data: {
      email,
      nom: String(formData.get("nom")),
      prenom: String(formData.get("prenom")),
      telephone: String(formData.get("telephone") ?? ""),
      passwordHash: await hashPassword(String(formData.get("password"))),
      role,
      siteId,
      compagnieId,
    },
  });

  revalidatePath("/dashboard/utilisateurs");
}
