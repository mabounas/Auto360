import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Role, StatutRdv, CanalRdv } from "@/app/generated/prisma/client";
import { getCreneauxDisponibles } from "@/lib/availability";

const schema = z.object({
  vehiculeId: z.string(),
  siteId: z.string(),
  serviceTypeId: z.string(),
  date: z.string(), // YYYY-MM-DD
  heure: z.string(), // HH:mm
  motif: z.string().optional(),
  // Renseigné quand un conseiller prend le rendez-vous au nom d'un client.
  pourClientId: z.string().optional(),
});

// Rôles habilités à réserver pour un tiers, avec le canal enregistré sur le rendez-vous.
const CANAL_PAR_ROLE: Partial<Record<Role, CanalRdv>> = {
  [Role.CENTRE_APPEL]: CanalRdv.TELEPHONE,
  [Role.RECEPTIONNAIRE]: CanalRdv.AGENCE,
  [Role.RESPONSABLE_SAV]: CanalRdv.AGENCE,
  [Role.ADMIN]: CanalRdv.AGENCE,
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Formulaire invalide." }, { status: 400 });
  const data = body.data;

  const canalStaff = CANAL_PAR_ROLE[session.role];
  const pourAutrui = session.role !== Role.CLIENT;
  if (pourAutrui && !canalStaff) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const client = pourAutrui
    ? await prisma.clientProfile.findUnique({ where: { id: data.pourClientId ?? "__none__" } })
    : await prisma.clientProfile.findUnique({ where: { userId: session.userId } });
  if (!client) return NextResponse.json({ error: "Profil client introuvable." }, { status: 404 });

  // Le véhicule doit appartenir au client concerné, que la demande vienne de lui
  // ou d'un conseiller agissant pour son compte.
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
      canal: canalStaff ?? CanalRdv.WEB,
    },
  });

  return NextResponse.json({ ok: true, id: rdv.id, statut });
}
