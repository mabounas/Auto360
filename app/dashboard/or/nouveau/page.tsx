import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { canSeeAllSites } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NouvelOrForm } from "./nouvel-or-form";
import { oneOf } from "@/lib/utils";

export default async function NouvelOrPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!oneOf(session.role, Role.RECEPTIONNAIRE, Role.CHEF_ATELIER, Role.ADMIN, Role.RESPONSABLE_SAV)) {
    redirect("/dashboard");
  }

  const [vehicules, sites] = await Promise.all([
    prisma.vehicule.findMany({
      include: { marque: true, client: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    canSeeAllSites(session.role)
      ? prisma.site.findMany({ orderBy: { ville: "asc" } })
      : prisma.site.findMany({ where: { id: session.siteId ?? "__none__" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nouvel ordre de réparation</h1>
        <p className="text-sm text-muted">
          Réception du véhicule : qualification du motif de visite et état des lieux.
        </p>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Accueil véhicule</CardTitle>
        </CardHeader>
        <CardContent>
          <NouvelOrForm
            vehicules={vehicules.map((v) => ({
              id: v.id,
              label: `${v.immatriculation} — ${v.marque.nom} ${v.modele} (${v.client.user.prenom} ${v.client.user.nom})`,
            }))}
            sites={sites.map((s) => ({ id: s.id, label: `${s.nom} (${s.ville})` }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
