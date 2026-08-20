import { prisma } from "./prisma";
import { StatutRdv } from "@/app/generated/prisma/client";

export type Creneau = { heure: string; placesRestantes: number };

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

// Renvoie les créneaux disponibles pour un site + service + date donnés, en tenant compte
// de la capacité configurée et des RDV déjà pris (§4.2 — disponibilité indépendante par service).
export async function getCreneauxDisponibles(siteId: string, serviceTypeId: string, date: Date) {
  const jourSemaine = date.getDay();
  const config = await prisma.disponibiliteConfig.findUnique({
    where: { siteId_serviceTypeId_jourSemaine: { siteId, serviceTypeId, jourSemaine } },
  });
  if (!config) return [];

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const rdvExistants = await prisma.rendezVous.findMany({
    where: {
      siteId,
      serviceTypeId,
      dateHeure: { gte: dayStart, lte: dayEnd },
      statut: { in: [StatutRdv.CONFIRME, StatutRdv.LISTE_ATTENTE] },
    },
    select: { dateHeure: true },
  });

  const compteParCreneau = new Map<string, number>();
  for (const rdv of rdvExistants) {
    const key = `${rdv.dateHeure.getHours().toString().padStart(2, "0")}:${rdv.dateHeure
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    compteParCreneau.set(key, (compteParCreneau.get(key) ?? 0) + 1);
  }

  const creneaux: Creneau[] = [];
  const debut = toMinutes(config.heureDebut);
  const fin = toMinutes(config.heureFin);
  // Tous les créneaux de la journée sont renvoyés, y compris ceux qui sont complets :
  // le client doit voir l'horaire exister et comprendre qu'il est déjà pris, plutôt
  // que de le voir disparaître sans explication.
  for (let t = debut; t + config.dureeCreneauMin <= fin; t += config.dureeCreneauMin) {
    const heure = toHHMM(t);
    const pris = compteParCreneau.get(heure) ?? 0;
    creneaux.push({ heure, placesRestantes: Math.max(0, config.capaciteParCreneau - pris) });
  }
  return creneaux;
}

// Renvoie les jours à venir qui ont au moins un créneau encore libre.
export async function getJoursDisponibles(siteId: string, serviceTypeId: string, depuis: Date, joursAScanner = 21) {
  const jours: string[] = [];
  for (let i = 0; i < joursAScanner; i++) {
    const d = new Date(depuis);
    d.setDate(d.getDate() + i);
    const creneaux = await getCreneauxDisponibles(siteId, serviceTypeId, d);
    if (creneaux.some((c) => c.placesRestantes > 0)) jours.push(d.toISOString().slice(0, 10));
  }
  return jours;
}
