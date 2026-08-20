import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role, StatutOR } from "@/app/generated/prisma/client";
import { porteeParSiteId } from "@/lib/portee";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, oneOf } from "@/lib/utils";

const STATUT_VARIANT: Record<string, "default" | "accent" | "success" | "warning" | "danger" | "neutral"> = {
  ACCUEIL: "neutral",
  DIAGNOSTIC_EN_COURS: "warning",
  DEVIS_EN_ATTENTE: "warning",
  DEVIS_VALIDE: "accent",
  EN_REPARATION: "accent",
  CONTROLE_QUALITE: "warning",
  PRET_RESTITUTION: "success",
  RESTITUE: "success",
  CLOTURE: "neutral",
  ANNULE: "danger",
};

export default async function OrdresReparationPage() {
  const session = await getSession();
  if (!session) return null;

  if (session.role === Role.CLIENT) {
    const client = await prisma.clientProfile.findUnique({ where: { userId: session.userId } });
    const ors = client
      ? await prisma.ordreReparation.findMany({
          where: { clientId: client.id },
          include: { vehicule: { include: { marque: true } }, site: true, devis: true },
          orderBy: { createdAt: "desc" },
        })
      : [];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mes réparations</h1>
          <p className="text-sm text-muted">Suivez l&apos;avancement de vos interventions en temps réel.</p>
        </div>
        <div className="space-y-3">
          {ors.map((or) => (
            <Link key={or.id} href={`/dashboard/or/${or.id}`}>
              <Card className="transition-colors hover:border-primary-300">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-medium">
                      {or.numero} — {or.vehicule.marque.nom} {or.vehicule.modele}
                    </p>
                    <p className="text-xs text-muted">
                      {or.site.nom} — ouvert le {formatDate(or.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {or.devis?.statut === "PUBLIE" && <Badge variant="warning">Devis à valider</Badge>}
                    <Badge variant={STATUT_VARIANT[or.statut] ?? "default"}>{or.statut.replaceAll("_", " ")}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {ors.length === 0 && <p className="text-sm text-muted">Aucune réparation pour le moment.</p>}
        </div>
      </div>
    );
  }

  const siteFilter = porteeParSiteId(session);

  // Le pricing ne voit que les dossiers en attente de chiffrage (§4.3)
  const statutFilter =
    session.role === Role.PRICING ? { statut: { in: [StatutOR.DEVIS_EN_ATTENTE] } } : {};

  const ors = await prisma.ordreReparation.findMany({
    where: { ...siteFilter, ...statutFilter },
    include: {
      vehicule: { include: { marque: true } },
      client: { include: { user: true } },
      site: true,
      devis: true,
      diagnostic: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const canCreate = oneOf(session.role, Role.RECEPTIONNAIRE, Role.CHEF_ATELIER, Role.ADMIN, Role.RESPONSABLE_SAV);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {session.role === Role.PRICING ? "Devis à chiffrer" : "Ordres de réparation"}
          </h1>
          <p className="text-sm text-muted">
            {session.role === Role.PRICING
              ? "Dossiers transmis par les techniciens après diagnostic."
              : "Suivi des dossiers atelier, de l'accueil à la restitution."}
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/dashboard/or/nouveau">Nouvel ordre de réparation</Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-primary-50/50 text-left text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3">N° OR</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Véhicule</th>
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3">Motif</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {ors.map((or) => (
                <tr key={or.id} className="border-b border-border last:border-0 hover:bg-primary-50/40">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/or/${or.id}`} className="font-medium text-primary-700">
                      {or.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {or.client.user.prenom} {or.client.user.nom}
                  </td>
                  <td className="px-4 py-3">
                    {or.vehicule.marque.nom} {or.vehicule.modele}
                    <span className="block text-xs text-muted">{or.vehicule.immatriculation}</span>
                  </td>
                  <td className="px-4 py-3">{or.site.ville}</td>
                  <td className="px-4 py-3 text-xs">{or.motifVisite.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUT_VARIANT[or.statut] ?? "default"}>{or.statut.replaceAll("_", " ")}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ors.length === 0 && <p className="p-6 text-sm text-muted">Aucun dossier à afficher.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
