import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { canSeeAllSites } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

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
  searchParams: Promise<{ date?: string }>;
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

  // Vue staff : planning du jour, groupé par service (visibilité métier par équipe — §4.2)
  const sp = await searchParams;
  const dateStr = sp.date ?? new Date().toISOString().slice(0, 10);
  const dayStart = new Date(dateStr);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dateStr);
  dayEnd.setHours(23, 59, 59, 999);

  const siteFilter = canSeeAllSites(session.role) ? {} : { siteId: session.siteId ?? "__none__" };

  const rdvs = await prisma.rendezVous.findMany({
    where: { ...siteFilter, dateHeure: { gte: dayStart, lte: dayEnd } },
    include: { site: true, serviceType: true, vehicule: { include: { marque: true } }, client: { include: { user: true } } },
    orderBy: { dateHeure: "asc" },
  });

  const parService = new Map<string, typeof rdvs>();
  for (const r of rdvs) {
    const key = r.serviceType.nom;
    parService.set(key, [...(parService.get(key) ?? []), r]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planning des rendez-vous</h1>
          <p className="text-sm text-muted">Vue quotidienne consolidée par service.</p>
        </div>
        <form className="flex items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={dateStr}
            className="h-10 rounded-lg border border-border px-3 text-sm"
          />
          <Button type="submit" size="sm" variant="secondary">
            Afficher
          </Button>
        </form>
      </div>

      {[...parService.entries()].map(([service, list]) => (
        <Card key={service}>
          <CardHeader>
            <CardTitle>
              {service} <span className="ml-2 text-xs font-normal text-muted">{list.length} rendez-vous</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {list.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">
                    {formatDateTime(r.dateHeure).split(" ").slice(-1)} — {r.client.user.prenom} {r.client.user.nom}
                  </p>
                  <p className="text-xs text-muted">
                    {r.vehicule.marque.nom} {r.vehicule.modele} — {r.vehicule.immatriculation} — {r.site.nom}
                  </p>
                </div>
                <Badge variant={STATUT_VARIANT[r.statut] ?? "default"}>{r.statut.replaceAll("_", " ")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      {rdvs.length === 0 && <p className="text-sm text-muted">Aucun rendez-vous ce jour-là.</p>}
    </div>
  );
}
