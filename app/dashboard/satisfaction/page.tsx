import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { canSeeAllSites } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function SatisfactionPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === Role.CLIENT) redirect("/dashboard");

  const where = canSeeAllSites(session.role)
    ? {}
    : { ordreReparation: { siteId: session.siteId ?? "__none__" } };

  const enquetes = await prisma.enqueteSatisfaction.findMany({
    where,
    include: {
      client: { include: { user: true } },
      ordreReparation: { include: { site: true, vehicule: true } },
    },
    orderBy: { envoyeeAt: "desc" },
  });

  const repondues = enquetes.filter((e) => e.reponduAt);
  const nps = repondues.filter((e) => e.npsScore !== null).map((e) => e.npsScore!);
  const csat = repondues.filter((e) => e.csatScore !== null).map((e) => e.csatScore!);

  const promoteurs = nps.filter((n) => n >= 9).length;
  const detracteurs = nps.filter((n) => n <= 6).length;
  const npsScore = nps.length ? Math.round(((promoteurs - detracteurs) / nps.length) * 100) : null;
  const csatMoyen = csat.length ? (csat.reduce((a, b) => a + b, 0) / csat.length).toFixed(1) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Satisfaction client</h1>
        <p className="text-sm text-muted">
          Enquêtes déclenchées automatiquement à la restitution du véhicule.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Enquêtes envoyées" value={String(enquetes.length)} />
        <StatCard label="Taux de réponse" value={enquetes.length ? `${Math.round((repondues.length / enquetes.length) * 100)} %` : "—"} />
        <StatCard label="NPS" value={npsScore !== null ? String(npsScore) : "—"} />
        <StatCard label="CSAT moyen" value={csatMoyen ?? "—"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détail des enquêtes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {enquetes.map((e) => {
            const faible = (e.npsScore !== null && e.npsScore <= 6) || (e.csatScore !== null && e.csatScore <= 2);
            return (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">
                    {e.client.user.prenom} {e.client.user.nom} — {e.ordreReparation.vehicule.immatriculation}
                  </p>
                  <p className="text-xs text-muted">
                    {e.ordreReparation.site.ville} — envoyée le {formatDate(e.envoyeeAt)}
                    {e.commentaire && ` — « ${e.commentaire} »`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {e.reponduAt ? (
                    <>
                      {e.npsScore !== null && <Badge variant={faible ? "danger" : "success"}>NPS {e.npsScore}</Badge>}
                      {e.csatScore !== null && <Badge variant={faible ? "danger" : "success"}>CSAT {e.csatScore}</Badge>}
                      {faible && <Badge variant="danger">SAV de récupération</Badge>}
                    </>
                  ) : (
                    <Badge variant="neutral">En attente de réponse</Badge>
                  )}
                </div>
              </div>
            );
          })}
          {enquetes.length === 0 && <p className="text-sm text-muted">Aucune enquête pour le moment.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium text-muted uppercase">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
