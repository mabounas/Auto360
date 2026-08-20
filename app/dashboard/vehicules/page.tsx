import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { porteeParSiteId } from "@/lib/portee";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { AddVehiculeForm } from "./add-vehicule-form";

export default async function VehiculesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  if (session.role === Role.CLIENT) {
    const client = await prisma.clientProfile.findUnique({
      where: { userId: session.userId },
      include: { vehicules: { include: { marque: true }, orderBy: { createdAt: "desc" } } },
    });
    const marques = await prisma.marque.findMany({ orderBy: { nom: "asc" } });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mes véhicules</h1>
          <p className="text-sm text-muted">Gérez votre parc et consultez le carnet d&apos;entretien digital.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {client?.vehicules.map((v) => (
            <Card key={v.id}>
              <CardHeader>
                <CardTitle>
                  {v.marque.nom} {v.modele}
                </CardTitle>
                <p className="text-xs text-muted">{v.immatriculation}</p>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>
                  <span className="text-muted">VIN :</span> {v.vin}
                </p>
                <p>
                  <span className="text-muted">Kilométrage :</span> {v.kilometrage.toLocaleString("fr-FR")} km
                </p>
                {v.dateMiseCirculation && (
                  <p>
                    <span className="text-muted">Mise en circulation :</span> {formatDate(v.dateMiseCirculation)}
                  </p>
                )}
                {v.garantieFin && (
                  <p>
                    <span className="text-muted">Garantie jusqu&apos;au :</span> {formatDate(v.garantieFin)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Ajouter un véhicule</CardTitle>
          </CardHeader>
          <CardContent>
            <AddVehiculeForm marques={marques.map((m) => ({ id: m.id, nom: m.nom }))} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vue staff — référentiel véhicules commun à tout le réseau (§4.1 : base client
  // unique multi-société et multi-marque). Un client n'appartient à aucun centre :
  // il peut se présenter dans n'importe lequel, qui doit pouvoir le retrouver par
  // son numéro de châssis ou son immatriculation et enchaîner sur une réservation.
  const { q } = await searchParams;
  const recherche = q?.trim();

  const vehicules = await prisma.vehicule.findMany({
    where: recherche
      ? {
          OR: [
            { vin: { contains: recherche, mode: "insensitive" } },
            { immatriculation: { contains: recherche, mode: "insensitive" } },
            { modele: { contains: recherche, mode: "insensitive" } },
            { client: { user: { nom: { contains: recherche, mode: "insensitive" } } } },
            { client: { user: { prenom: { contains: recherche, mode: "insensitive" } } } },
            { client: { user: { telephone: { contains: recherche } } } },
          ],
        }
      : {},
    include: {
      marque: true,
      client: { include: { user: true } },
      ordresReparation: {
        select: { id: true, siteId: true, createdAt: true, site: { select: { nom: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Les dossiers atelier, eux, restent cloisonnés : on distingue ce que ce centre
  // a déjà traité de l'historique réalisé ailleurs dans le réseau.
  const portee = porteeParSiteId(session);
  const monSiteId = "siteId" in portee ? portee.siteId : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Véhicules</h1>
        <p className="text-sm text-muted">
          Référentiel commun à tout le réseau : recherchez par numéro de châssis (VIN),
          immatriculation, nom ou téléphone, même si le véhicule n&apos;est jamais venu chez vous.
        </p>
      </div>

      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={recherche}
          placeholder="N° de châssis (VIN), immatriculation, nom ou téléphone…"
          className="h-10 w-full max-w-md rounded-lg border border-border px-3 text-sm"
        />
        <Button type="submit" variant="secondary">
          Rechercher
        </Button>
      </form>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-primary-50/50 text-left text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Véhicule</th>
                <th className="px-4 py-3">Immatriculation</th>
                <th className="px-4 py-3">N° de châssis (VIN)</th>
                <th className="px-4 py-3">Historique atelier</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {vehicules.map((v) => {
                const chezMoi = monSiteId
                  ? v.ordresReparation.filter((o) => o.siteId === monSiteId).length
                  : v.ordresReparation.length;
                const ailleurs = v.ordresReparation.length - chezMoi;
                return (
                  <tr key={v.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      {v.client.user.prenom} {v.client.user.nom}
                      <span className="block text-xs text-muted">{v.client.user.telephone}</span>
                    </td>
                    <td className="px-4 py-3">
                      {v.marque.nom} {v.modele}
                      <span className="block text-xs text-muted">
                        {v.kilometrage.toLocaleString("fr-FR")} km
                      </span>
                    </td>
                    <td className="px-4 py-3">{v.immatriculation}</td>
                    <td className="px-4 py-3 font-mono text-xs">{v.vin}</td>
                    <td className="px-4 py-3 text-xs">
                      {chezMoi > 0 && (
                        <Badge variant="success">
                          {chezMoi} passage{chezMoi > 1 ? "s" : ""} ici
                        </Badge>
                      )}
                      {ailleurs > 0 && (
                        <Badge variant="neutral">
                          {ailleurs} ailleurs dans le réseau
                        </Badge>
                      )}
                      {v.ordresReparation.length === 0 && (
                        <span className="text-muted">Jamais venu</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/rendez-vous/nouveau?client=${v.clientId}`}>
                          Planifier
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {vehicules.length === 0 && (
            <p className="p-6 text-sm text-muted">
              {recherche
                ? "Aucun véhicule ne correspond à cette recherche."
                : "Lancez une recherche pour retrouver un véhicule."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
