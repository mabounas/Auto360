import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { porteeParSiteId } from "@/lib/portee";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, oneOf } from "@/lib/utils";
import { ReceptionActions } from "./reception-actions";
import { VehiculeIdentite } from "@/components/dashboard/vehicule-identite";

const STATUT_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "neutral"> = {
  CONFIRME: "success",
  LISTE_ATTENTE: "warning",
  ANNULE: "danger",
  REALISE: "neutral",
  NO_SHOW: "danger",
};

export default async function RendezVousPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; periode?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  if (session.role === Role.CLIENT) {
    const client = await prisma.clientProfile.findUnique({ where: { userId: session.userId } });
    const rdvs = client
      ? await prisma.rendezVous.findMany({
          where: { clientId: client.id },
          include: { site: true, serviceType: true, vehicule: true },
          orderBy: { dateHeure: "desc" },
        })
      : [];

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mes rendez-vous</h1>
            <p className="text-sm text-muted">Historique et prochains rendez-vous atelier.</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/rendez-vous/nouveau">Nouveau rendez-vous</Link>
          </Button>
        </div>
        <div className="space-y-3">
          {rdvs.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium">
                    {r.serviceType.nom} — {r.vehicule.modele}
                  </p>
                  <p className="text-xs text-muted">
                    {r.site.nom} — {formatDateTime(r.dateHeure)}
                  </p>
                </div>
                <Badge variant={STATUT_VARIANT[r.statut] ?? "default"}>{r.statut.replaceAll("_", " ")}</Badge>
              </CardContent>
            </Card>
          ))}
          {rdvs.length === 0 && <p className="text-sm text-muted">Aucun rendez-vous pour le moment.</p>}
        </div>
      </div>
    );
  }

  // Vue staff : planning groupé par service (visibilité métier par équipe — §4.2).
  // La période est réglable : limiter l'écran à la seule journée en cours masquait
  // les rendez-vous déjà pris pour les jours suivants.
  const sp = await searchParams;
  const periode = sp.periode ?? (sp.date ? "date" : "7j");

  const debut = new Date();
  const fin = new Date();
  if (periode === "date" && sp.date) {
    debut.setTime(new Date(sp.date).getTime());
    fin.setTime(new Date(sp.date).getTime());
  } else if (periode === "demain") {
    debut.setDate(debut.getDate() + 1);
    fin.setDate(fin.getDate() + 1);
  } else if (periode === "7j") {
    fin.setDate(fin.getDate() + 6);
  } else if (periode === "30j") {
    fin.setDate(fin.getDate() + 29);
  }
  debut.setHours(0, 0, 0, 0);
  fin.setHours(23, 59, 59, 999);

  const surPlusieursJours = fin.getTime() - debut.getTime() > 24 * 60 * 60 * 1000;
  const siteFilter = porteeParSiteId(session);

  const rdvs = await prisma.rendezVous.findMany({
    where: { ...siteFilter, dateHeure: { gte: debut, lte: fin } },
    include: {
      site: true,
      serviceType: true,
      vehicule: { include: { marque: true } },
      client: { include: { user: true } },
      ordreReparation: { select: { id: true, numero: true } },
    },
    orderBy: { dateHeure: "asc" },
  });

  // Seul l'accueil réceptionne le véhicule et ouvre le dossier atelier ; le
  // technicien consulte le planning et reprend le dossier une fois ouvert.
  const peutReceptionner = oneOf(
    session.role,
    Role.RECEPTIONNAIRE,
    Role.CHEF_ATELIER,
    Role.RESPONSABLE_SAV,
    Role.ADMIN
  );

  const parService = new Map<string, typeof rdvs>();
  for (const r of rdvs) {
    const key = r.serviceType.nom;
    parService.set(key, [...(parService.get(key) ?? []), r]);
  }

  const PERIODES: { valeur: string; libelle: string }[] = [
    { valeur: "aujourdhui", libelle: "Aujourd'hui" },
    { valeur: "demain", libelle: "Demain" },
    { valeur: "7j", libelle: "7 prochains jours" },
    { valeur: "30j", libelle: "30 prochains jours" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planning des rendez-vous</h1>
          <p className="text-sm text-muted">
            Prestations attendues sur votre atelier, regroupées par service.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form className="flex items-center gap-2">
            <select
              name="periode"
              defaultValue={periode === "date" ? "7j" : periode}
              className="h-10 rounded-lg border border-border px-3 text-sm"
            >
              {PERIODES.map((p) => (
                <option key={p.valeur} value={p.valeur}>
                  {p.libelle}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" variant="secondary">
              Afficher
            </Button>
          </form>
          <form className="flex items-center gap-2">
            <input type="hidden" name="periode" value="date" />
            <input
              type="date"
              name="date"
              defaultValue={
                periode === "date" && sp.date ? sp.date : debut.toISOString().slice(0, 10)
              }
              className="h-10 rounded-lg border border-border px-3 text-sm"
            />
            <Button type="submit" size="sm" variant="secondary">
              Aller à
            </Button>
          </form>
        </div>
      </div>

      <p className="text-sm text-muted">
        {rdvs.length} rendez-vous
        {periode === "date"
          ? ` le ${formatDateTime(debut).split(",")[0]}`
          : periode === "aujourdhui"
            ? " aujourd'hui"
            : periode === "demain"
              ? " demain"
              : ` du ${formatDateTime(debut).split(",")[0]} au ${formatDateTime(fin).split(",")[0]}`}
      </p>

      {[...parService.entries()].map(([service, list]) => (
        <Card key={service}>
          <CardHeader>
            <CardTitle>
              {service} <span className="ml-2 text-xs font-normal text-muted">{list.length} rendez-vous</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {list.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                <div className="min-w-[240px]">
                  <p className="font-medium">
                    {/* Sur une plage de plusieurs jours, l'heure seule ne suffit pas
                        à situer le rendez-vous : la date est alors reprise. */}
                    {surPlusieursJours
                      ? formatDateTime(r.dateHeure)
                      : formatDateTime(r.dateHeure).split(" ").slice(-1)}{" "}
                    — {r.client.user.prenom} {r.client.user.nom}
                  </p>
                  <VehiculeIdentite
                    marque={r.vehicule.marque.nom}
                    modele={r.vehicule.modele}
                    immatriculation={r.vehicule.immatriculation}
                    vin={r.vehicule.vin}
                  />
                  <p className="text-xs text-muted">{r.site.nom}</p>
                  {r.motif && <p className="mt-1 text-xs text-muted italic">« {r.motif} »</p>}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <ReceptionActions
                    rendezVousId={r.id}
                    ordreReparationId={r.ordreReparation?.id ?? null}
                    ordreReparationNumero={r.ordreReparation?.numero ?? null}
                    peutReceptionner={peutReceptionner}
                    statut={r.statut}
                  />
                  <Badge variant={STATUT_VARIANT[r.statut] ?? "default"}>{r.statut.replaceAll("_", " ")}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      {rdvs.length === 0 && (
        <p className="text-sm text-muted">
          Aucun rendez-vous sur cette période. Élargissez la période pour voir les prochains.
        </p>
      )}
    </div>
  );
}
