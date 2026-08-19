import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role, StatutOR, StatutDevis } from "@/app/generated/prisma/client";
import { canSeeAllSites } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMAD, oneOf } from "@/lib/utils";

export default async function KpisPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!oneOf(session.role, Role.RESPONSABLE_SAV, Role.DIRECTION_GROUPE, Role.ADMIN)) {
    redirect("/dashboard");
  }

  const siteFilter = canSeeAllSites(session.role) ? {} : { siteId: session.siteId ?? "__none__" };

  const [ors, factures, devis, enquetes, sites] = await Promise.all([
    prisma.ordreReparation.findMany({
      where: siteFilter,
      select: { id: true, siteId: true, statut: true, createdAt: true, clotureAt: true, clientId: true },
    }),
    prisma.facture.findMany({
      where: canSeeAllSites(session.role) ? {} : { ordreReparation: { siteId: session.siteId ?? "__none__" } },
      select: { montantTTC: true, ordreReparation: { select: { siteId: true } } },
    }),
    prisma.devis.findMany({
      where: canSeeAllSites(session.role) ? {} : { ordreReparation: { siteId: session.siteId ?? "__none__" } },
      select: { statut: true },
    }),
    prisma.enqueteSatisfaction.findMany({
      where: canSeeAllSites(session.role) ? {} : { ordreReparation: { siteId: session.siteId ?? "__none__" } },
      select: { npsScore: true, csatScore: true, reponduAt: true },
    }),
    prisma.site.findMany({ orderBy: { ville: "asc" } }),
  ]);

  const caTotal = factures.reduce((sum, f) => sum + Number(f.montantTTC), 0);
  const orClotures = ors.filter((o) => o.statut === StatutOR.CLOTURE);
  const panierMoyen = factures.length ? caTotal / factures.length : 0;

  const delaisJours = orClotures
    .filter((o) => o.clotureAt)
    .map((o) => (o.clotureAt!.getTime() - o.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const delaiMoyen = delaisJours.length ? delaisJours.reduce((a, b) => a + b, 0) / delaisJours.length : 0;

  const devisTotal = devis.filter((d) => d.statut !== StatutDevis.BROUILLON).length;
  const devisValides = devis.filter((d) => d.statut === StatutDevis.VALIDE).length;
  const tauxConversion = devisTotal ? Math.round((devisValides / devisTotal) * 100) : 0;

  // Taux de rétention SAV : part des clients ayant plus d'un passage atelier
  const passagesParClient = new Map<string, number>();
  for (const o of ors) passagesParClient.set(o.clientId, (passagesParClient.get(o.clientId) ?? 0) + 1);
  const clientsRecurrents = [...passagesParClient.values()].filter((n) => n > 1).length;
  const tauxRetention = passagesParClient.size ? Math.round((clientsRecurrents / passagesParClient.size) * 100) : 0;

  const repondues = enquetes.filter((e) => e.reponduAt && e.npsScore !== null);
  const promoteurs = repondues.filter((e) => e.npsScore! >= 9).length;
  const detracteurs = repondues.filter((e) => e.npsScore! <= 6).length;
  const nps = repondues.length ? Math.round(((promoteurs - detracteurs) / repondues.length) * 100) : null;

  // Comparatif inter-sites (§4.12)
  const parSite = sites
    .filter((s) => canSeeAllSites(session.role) || s.id === session.siteId)
    .map((s) => {
      const orsSite = ors.filter((o) => o.siteId === s.id);
      const caSite = factures
        .filter((f) => f.ordreReparation.siteId === s.id)
        .reduce((sum, f) => sum + Number(f.montantTTC), 0);
      return {
        site: s,
        nbOr: orsSite.length,
        enCours: orsSite.filter((o) => !oneOf(o.statut, StatutOR.CLOTURE, StatutOR.ANNULE)).length,
        ca: caSite,
      };
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">KPIs &amp; pilotage SAV</h1>
        <p className="text-sm text-muted">
          {canSeeAllSites(session.role) ? "Vision consolidée multi-sites." : "Indicateurs de votre site."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="CA SAV facturé" value={formatMAD(caTotal)} />
        <Kpi label="Panier moyen atelier" value={formatMAD(panierMoyen)} />
        <Kpi label="Ordres de réparation" value={String(ors.length)} />
        <Kpi label="Délai moyen d'intervention" value={`${delaiMoyen.toFixed(1)} j`} />
        <Kpi label="Taux de conversion devis" value={`${tauxConversion} %`} />
        <Kpi label="Taux de rétention SAV" value={`${tauxRetention} %`} />
        <Kpi label="NPS" value={nps !== null ? String(nps) : "—"} />
        <Kpi label="Dossiers en cours" value={String(ors.filter((o) => !oneOf(o.statut, StatutOR.CLOTURE, StatutOR.ANNULE)).length)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparatif par site</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-primary-50/50 text-left text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3 text-right">OR total</th>
                <th className="px-4 py-3 text-right">En cours</th>
                <th className="px-4 py-3 text-right">CA facturé</th>
              </tr>
            </thead>
            <tbody>
              {parSite.map((r) => (
                <tr key={r.site.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{r.site.nom}</td>
                  <td className="px-4 py-3">{r.site.ville}</td>
                  <td className="px-4 py-3 text-right">{r.nbOr}</td>
                  <td className="px-4 py-3 text-right">{r.enCours}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatMAD(r.ca)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium text-muted uppercase">{label}</p>
        <p className="mt-1 text-xl font-bold text-primary-700">{value}</p>
      </CardContent>
    </Card>
  );
}
