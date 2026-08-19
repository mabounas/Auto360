import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Role, StatutRdv } from "@/app/generated/prisma/client";
import { getCreneauxDisponibles } from "@/lib/availability";

const schema = z.object({
  vehiculeId: z.string(),
  siteId: z.string(),
  serviceTypeId: z.string(),
  date: z.string(), // YYYY-MM-DD
  heure: z.string(), // HH:mm
  motif: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Formulaire invalide." }, { status: 400 });
  const data = body.data;

  const client = await prisma.clientProfile.findUnique({ where: { userId: session.userId } });
  if (!client) return NextResponse.json({ error: "Profil client introuvable." }, { status: 404 });

  const vehicule = await prisma.vehicule.findFirst({ where: { id: data.vehiculeId, clientId: client.id } });
  if (!vehicule) return NextResponse.json({ error: "Véhicule introuvable." }, { status: 404 });

  const [h, m] = data.heure.split(":").map(Number);
  const dateHeure = new Date(data.date);
  dateHeure.setHours(h, m, 0, 0);

  // Revérifie la disponibilité au moment de la confirmation (concurrence)
  const creneaux = await getCreneauxDisponibles(data.siteId, data.serviceTypeId, dateHeure);
  const creneau = creneaux.find((c) => c.heure === data.heure);
  const statut = creneau && creneau.placesRestantes > 0 ? StatutRdv.CONFIRME : StatutRdv.LISTE_ATTENTE;

  const rdv = await prisma.rendezVous.create({
    data: {
      clientId: client.id,
      vehiculeId: data.vehiculeId,
      siteId: data.siteId,
      serviceTypeId: data.serviceTypeId,
      dateHeure,
      motif: data.motif,
      statut,
      canal: "WEB",
    },
  });

  return NextResponse.json({ ok: true, id: rdv.id, statut });
}
