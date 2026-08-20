import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { porteeSites } from "@/lib/portee";
import { oneOf } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CapacitesEditor } from "./capacites-editor";

export const dynamic = "force-dynamic";

export default async function CapacitesPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!oneOf(session.role, Role.ADMIN, Role.RESPONSABLE_SAV, Role.CHEF_ATELIER)) {
    redirect("/dashboard");
  }

  const sites = await prisma.site.findMany({
    where: porteeSites(session),
    include: { compagnie: true },
    orderBy: [{ compagnie: { nom: "asc" } }, { ville: "asc" }, { nom: "asc" }],
  });
  if (sites.length === 0) {
    return <p className="text-sm text-muted">Aucun site rattaché à votre compte.</p>;
  }

  const { site: siteParam } = await searchParams;
  const siteCourant = sites.find((s) => s.id === siteParam) ?? sites[0];

  const services = await prisma.serviceType.findMany({ orderBy: { nom: "asc" } });

  // Une ligne de configuration par jour ; la capacité étant identique sur la semaine,
  // on prend celle du premier jour configuré comme valeur affichée.
  const configs = await prisma.disponibiliteConfig.findMany({
    where: { siteId: siteCourant.id },
    orderBy: { jourSemaine: "asc" },
  });
  const capaciteParService = new Map<string, number>();
  for (const c of configs) {
    if (!capaciteParService.has(c.serviceTypeId)) {
      capaciteParService.set(c.serviceTypeId, c.capaciteParCreneau);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Positions par service</h1>
        <p className="text-sm text-muted">
          Nombre de postes de travail (baies, ponts, agents) affectés à chaque service. C&apos;est
          ce qui détermine combien de véhicules peuvent être pris en charge sur un même créneau
          horaire — et donc à partir de quand le créneau devient complet côté client.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{siteCourant.nom}</CardTitle>
          <p className="text-xs text-muted">
            {siteCourant.ville} · {siteCourant.compagnie.nom}
          </p>
        </CardHeader>
        <CardContent>
          <CapacitesEditor
            siteId={siteCourant.id}
            sites={sites.map((s) => ({
              id: s.id,
              label: `${s.nom} — ${s.ville} (${s.compagnie.nom})`,
            }))}
            services={services.map((s) => ({
              id: s.id,
              nom: s.nom,
              dureeEstimeeMin: s.dureeEstimeeMin,
              positions: capaciteParService.get(s.id) ?? 0,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
