import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role, StatutOR, StatutDevis, StatutReclamation } from "@/app/generated/prisma/client";
import { porteeParSiteId, porteeParRelation, libellePortee } from "@/lib/portee";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";
import { VehiculeIdentite } from "@/components/dashboard/vehicule-identite";

export default async function DashboardHome() {
  const session = await getSession();
  if (!session) return null;

  if (session.role === Role.CLIENT) {
    const client = await prisma.clientProfile.findUnique({
      where: { userId: session.userId },
      include: {
        vehicules: true,
        rendezVous: {
          where: { dateHeure: { gte: new Date() } },
          orderBy: { dateHeure: "asc" },
          take: 5,
          include: { site: true, serviceType: true },
        },
        ordresReparation: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { vehicule: true, devis: true },
        },
        factures: { where: { statutPaiement: "EN_ATTENTE" }, take: 5 },
      },
    });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bonjour {session.prenom} 👋</h1>
          <p className="text-sm text-muted">Voici un aperçu de votre espace Auto360.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted uppercase">Véhicules</p>
              <p className="mt-1 text-2xl font-bold">{client?.vehicules.length ?? 0}</p>
              <Link href="/dashboard/vehicules" className="mt-2 inline-block text-xs font-medium text-primary-700">
                Gérer mes véhicules →
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted uppercase">Rendez-vous à venir</p>
              <p className="mt-1 text-2xl font-bold">{client?.rendezVous.length ?? 0}</p>
              <Link href="/dashboard/rendez-vous/nouveau" className="mt-2 inline-block text-xs font-medium text-primary-700">
                Prendre rendez-vous →
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted uppercase">Factures en attente</p>
              <p className="mt-1 text-2xl font-bold">{client?.factures.length ?? 0}</p>
              <Link href="/dashboard/factures" className="mt-2 inline-block text-xs font-medium text-primary-700">
                Voir mes factures →
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Prochains rendez-vous</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client?.rendezVous.length ? (
              client.rendezVous.map((rdv) => (
                <div key={rdv.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{rdv.serviceType.nom}</p>
                    <p className="text-xs text-muted">
                      {rdv.site.nom} — {formatDateTime(rdv.dateHeure)}
                    </p>
                  </div>
                  <Badge>{rdv.statut}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">Aucun rendez-vous à venir.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Réparations récentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client?.ordresReparation.length ? (
              client.ordresReparation.map((or) => (
                <Link
                  key={or.id}
                  href={`/dashboard/or/${or.id}`}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-primary-50"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {or.numero} — {or.vehicule.modele}
                    </p>
                    <p className="text-xs text-muted">{formatDate(or.createdAt)}</p>
                  </div>
                  <Badge variant="accent">{or.statut.replaceAll("_", " ")}</Badge>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted">Aucune réparation pour le moment.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Tableau de bord staff ---------------------------------------------
  const siteFilter = porteeParSiteId(session);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [rdvAujourdhui, orEnCours, devisEnAttente, reclamationsOuvertes, stocks] = await Promise.all([
    prisma.rendezVous.count({ where: { ...siteFilter, dateHeure: { gte: todayStart, lte: todayEnd } } }),
    prisma.ordreReparation.count({
      where: { ...siteFilter, statut: { in: [StatutOR.ACCUEIL, StatutOR.DIAGNOSTIC_EN_COURS, StatutOR.EN_REPARATION, StatutOR.DEVIS_EN_ATTENTE] } },
    }),
    prisma.devis.count({
      where: { statut: StatutDevis.PUBLIE, ...porteeParRelation(session, "ordreReparation") },
    }),
    prisma.reclamation.count({
      where: {
        statut: { in: [StatutReclamation.OUVERT, StatutReclamation.EN_COURS] },
        ...siteFilter,
      },
    }),
    prisma.stockPiece.findMany({ where: siteFilter, select: { quantiteDisponible: true, seuilAlerte: true } }),
  ]);
  const stockAlertes = stocks.filter((s) => s.quantiteDisponible <= s.seuilAlerte).length;

  const recentOr = await prisma.ordreReparation.findMany({
    where: siteFilter,
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { client: { include: { user: true } }, vehicule: true, site: true },
  });

  const nomCompagnie = session.compagnieId
    ? (await prisma.compagnie.findUnique({ where: { id: session.compagnieId } }))?.nom
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Bonjour {session.prenom} {session.nom}
        </h1>
        <p className="text-sm text-muted">{libellePortee(session, nomCompagnie)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="RDV aujourd'hui" value={rdvAujourdhui} href="/dashboard/rendez-vous" />
        <StatCard label="OR en cours" value={orEnCours} href="/dashboard/or" />
        <StatCard label="Devis publiés" value={devisEnAttente} href="/dashboard/or" />
        <StatCard label="Réclamations ouvertes" value={reclamationsOuvertes} href="/dashboard/reclamations" />
        <StatCard label="Alertes stock" value={stockAlertes} href="/dashboard/stock" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Derniers ordres de réparation</CardTitle>
          <Button asChild size="sm" variant="secondary">
            <Link href="/dashboard/or">Tout voir</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentOr.length ? (
            recentOr.map((or) => (
              <Link
                key={or.id}
                href={`/dashboard/or/${or.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 hover:bg-primary-50"
              >
                <div>
                  <p className="text-sm font-medium">
                    {or.numero} — {or.client.user.prenom} {or.client.user.nom}
                  </p>
                  <VehiculeIdentite
                    modele={or.vehicule.modele}
                    immatriculation={or.vehicule.immatriculation}
                    vin={or.vehicule.vin}
                  />
                  <p className="text-xs text-muted">
                    {or.site.nom} — {formatDate(or.createdAt)}
                  </p>
                </div>
                <Badge variant="accent">{or.statut.replaceAll("_", " ")}</Badge>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted">Aucun ordre de réparation pour le moment.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-primary-300">
        <CardContent className="p-5">
          <p className="text-xs font-medium text-muted uppercase">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
