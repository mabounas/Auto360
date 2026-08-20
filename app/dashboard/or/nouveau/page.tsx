import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { porteeSites } from "@/lib/portee";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NouvelOrForm } from "./nouvel-or-form";
import { Button } from "@/components/ui/button";
import { oneOf } from "@/lib/utils";

export default async function NouvelOrPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!oneOf(session.role, Role.RECEPTIONNAIRE, Role.CHEF_ATELIER, Role.ADMIN, Role.RESPONSABLE_SAV)) {
    redirect("/dashboard");
  }

  // Le véhicule est cherché dans le référentiel commun au réseau : un client qui se
  // présente pour la première fois dans ce centre doit être retrouvé, typiquement
  // par son numéro de châssis (VIN) relevé sur la carte grise.
  const { q } = await searchParams;
  const recherche = q?.trim();

  const [vehicules, sites] = await Promise.all([
    prisma.vehicule.findMany({
      where: recherche
        ? {
            OR: [
              { vin: { contains: recherche, mode: "insensitive" } },
              { immatriculation: { contains: recherche, mode: "insensitive" } },
              { client: { user: { nom: { contains: recherche, mode: "insensitive" } } } },
              { client: { user: { telephone: { contains: recherche } } } },
            ],
          }
        : {},
      include: { marque: true, client: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: recherche ? 50 : 25,
    }),
    prisma.site.findMany({ where: porteeSites(session), orderBy: { ville: "asc" } }),
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
          <CardTitle>Rechercher le véhicule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <form className="flex flex-wrap gap-2">
            <input
              name="q"
              defaultValue={recherche}
              placeholder="N° de châssis (VIN), immatriculation, nom ou téléphone…"
              className="h-10 w-full max-w-md flex-1 rounded-lg border border-border px-3 text-sm"
            />
            <Button type="submit" variant="secondary">
              Rechercher
            </Button>
          </form>
          <p className="text-xs text-muted">
            Le référentiel couvre tout le réseau : un client venu pour la première fois dans votre
            centre y figure déjà s&apos;il a été enregistré ailleurs.
          </p>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Accueil véhicule</CardTitle>
        </CardHeader>
        <CardContent>
          {vehicules.length === 0 ? (
            <p className="text-sm text-muted">
              Aucun véhicule ne correspond à cette recherche. Créez la fiche du client depuis
              l&apos;écran Clients avant d&apos;ouvrir son dossier.
            </p>
          ) : (
            <NouvelOrForm
              vehicules={vehicules.map((v) => ({
                id: v.id,
                label: `${v.immatriculation} — ${v.marque.nom} ${v.modele} — ${v.vin} (${v.client.user.prenom} ${v.client.user.nom})`,
              }))}
              sites={sites.map((s) => ({ id: s.id, label: `${s.nom} (${s.ville})` }))}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
