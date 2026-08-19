"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Role } from "@/app/generated/prisma/client";

export async function ajouterVehicule(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== Role.CLIENT) throw new Error("Non autorisé");

  const client = await prisma.clientProfile.findUnique({ where: { userId: session.userId } });
  if (!client) throw new Error("Profil client introuvable");

  const marqueId = String(formData.get("marqueId"));
  const modele = String(formData.get("modele"));
  const vin = String(formData.get("vin")).toUpperCase();
  const immatriculation = String(formData.get("immatriculation")).toUpperCase();
  const kilometrage = Number(formData.get("kilometrage") ?? 0);
  const dateMiseCirculation = formData.get("dateMiseCirculation")
    ? new Date(String(formData.get("dateMiseCirculation")))
    : undefined;

  await prisma.vehicule.create({
    data: { clientId: client.id, marqueId, modele, vin, immatriculation, kilometrage, dateMiseCirculation },
  });

  revalidatePath("/dashboard/vehicules");
}
