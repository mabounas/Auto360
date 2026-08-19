"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/client";
import { MULTI_SITE_ROLES } from "@/lib/rbac";

export async function creerUtilisateur(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) throw new Error("Non autorisé");

  const role = String(formData.get("role")) as Role;
  if (role === Role.CLIENT) throw new Error("Utilisez l'inscription publique pour les clients");

  const siteIdRaw = String(formData.get("siteId") ?? "");
  const siteId = MULTI_SITE_ROLES.includes(role) || !siteIdRaw ? null : siteIdRaw;

  const email = String(formData.get("email")).toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Un compte existe déjà avec cet email");

  await prisma.user.create({
    data: {
      email,
      nom: String(formData.get("nom")),
      prenom: String(formData.get("prenom")),
      telephone: String(formData.get("telephone") ?? ""),
      passwordHash: await hashPassword(String(formData.get("password"))),
      role,
      siteId,
    },
  });

  revalidatePath("/dashboard/utilisateurs");
}
