import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { BookingWizard } from "./booking-wizard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function NouveauRendezVousPage() {
  const session = await getSession();
  if (!session || session.role !== Role.CLIENT) redirect("/dashboard");

  const client = await prisma.clientProfile.findUnique({
    where: { userId: session.userId },
    include: { vehicules: { include: { marque: true } } },
  });

  if (!client || client.vehicules.length === 0) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Ajoutez d&apos;abord un véhicule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">
            Vous devez enregistrer au moins un véhicule avant de prendre rendez-vous.
          </p>
          <Link href="/dashboard/vehicules" className="mt-3 inline-block text-sm font-medium text-primary-700">
            Ajouter un véhicule →
          </Link>
        </CardContent>
      </Card>
    );
  }

  const [sites, services] = await Promise.all([
    prisma.site.findMany({ orderBy: { ville: "asc" } }),
    prisma.serviceType.findMany({ orderBy: { nom: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Prendre rendez-vous</h1>
        <p className="text-sm text-muted">
          Chaque service dispose de son propre calendrier de disponibilité.
        </p>
      </div>
      <BookingWizard
        vehicules={client.vehicules.map((v) => ({ id: v.id, label: `${v.marque.nom} ${v.modele} — ${v.immatriculation}` }))}
        sites={sites.map((s) => ({ id: s.id, nom: s.nom, ville: s.ville }))}
        services={services.map((s) => ({ id: s.id, code: s.code, nom: s.nom, description: s.description }))}
      />
    </div>
  );
}
