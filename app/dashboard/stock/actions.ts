"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Role } from "@/app/generated/prisma/client";
import { oneOf } from "@/lib/utils";

export async function ajusterStock(formData: FormData) {
  const session = await getSession();
  if (!session || !oneOf(session.role, Role.GESTIONNAIRE_PIECES, Role.ADMIN, Role.RESPONSABLE_SAV)) {
    throw new Error("Non autorisé");
  }

  const stockId = String(formData.get("stockId"));
  const quantiteDisponible = Number(formData.get("quantiteDisponible"));

  await prisma.stockPiece.update({ where: { id: stockId }, data: { quantiteDisponible } });
  revalidatePath("/dashboard/stock");
}
