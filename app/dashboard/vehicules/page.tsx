import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { porteeParSiteId } from "@/lib/portee";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { AddVehiculeForm } from "./add-vehicule-form";

export default async function VehiculesPage() {
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

  // Vue staff : recherche véhicules / clients
  // Le staff ne voit que les véhicules déjà passés dans un atelier de son périmètre.
  const portee = porteeParSiteId(session);
  const siteFilter =
    Object.keys(portee).length === 0
      ? {}
      : { client: { ordresReparation: { some: portee } } };
  const vehicules = await prisma.vehicule.findMany({
    where: siteFilter,
    include: { marque: true, client: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Véhicules</h1>
        <p className="text-sm text-muted">Parc véhicules des clients Auto360.</p>
      </div>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-primary-50/50 text-left text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Véhicule</th>
                <th className="px-4 py-3">Immatriculation</th>
                <th className="px-4 py-3">Kilométrage</th>
              </tr>
            </thead>
            <tbody>
              {vehicules.map((v) => (
                <tr key={v.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    {v.client.user.prenom} {v.client.user.nom}
                  </td>
                  <td className="px-4 py-3">
                    {v.marque.nom} {v.modele}
                  </td>
                  <td className="px-4 py-3">{v.immatriculation}</td>
                  <td className="px-4 py-3">{v.kilometrage.toLocaleString("fr-FR")} km</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
