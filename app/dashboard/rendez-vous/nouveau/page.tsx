import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { oneOf } from "@/lib/utils";
import { BookingWizard } from "./booking-wizard";
import { ClientPicker } from "./client-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Rôles autorisés à prendre un rendez-vous au nom d'un client : centre d'appel
// (demandes téléphoniques) et réceptionnaire (demandes au comptoir), plus
// l'encadrement SAV.
const ROLES_PRISE_RDV_POUR_CLIENT = [
  Role.CENTRE_APPEL,
  Role.RECEPTIONNAIRE,
  Role.RESPONSABLE_SAV,
  Role.ADMIN,
];

export default async function NouveauRendezVousPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const pourAutrui = session.role !== Role.CLIENT;
  if (pourAutrui && !oneOf(session.role, ...ROLES_PRISE_RDV_POUR_CLIENT)) {
    redirect("/dashboard");
  }

  const { client: clientParam, q } = await searchParams;

  // --- Sélection du client (uniquement pour le staff) --------------------
  if (pourAutrui && !clientParam) {
    const clients = await prisma.clientProfile.findMany({
      where: q
        ? {
            OR: [
              { user: { nom: { contains: q, mode: "insensitive" } } },
              { user: { prenom: { contains: q, mode: "insensitive" } } },
              { user: { telephone: { contains: q } } },
              { user: { email: { contains: q, mode: "insensitive" } } },
              { vehicules: { some: { immatriculation: { contains: q, mode: "insensitive" } } } },
              { vehicules: { some: { vin: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {},
      include: { user: true, vehicules: { include: { marque: true } } },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prendre rendez-vous pour un client</h1>
          <p className="text-sm text-muted">
            Recherchez le client par numéro de châssis, immatriculation, nom, téléphone ou email —
            le référentiel couvre tout le réseau, même si le client n&apos;est jamais venu dans
            votre centre. Les disponibilités affichées sont celles que voit le client en ligne.
          </p>
        </div>
        <ClientPicker
          q={q ?? ""}
          clients={clients.map((c) => ({
            id: c.id,
            nom: `${c.user.prenom} ${c.user.nom}`,
            telephone: c.user.telephone,
            email: c.user.email,
            segment: c.segment,
            vehicules: c.vehicules.map((v) => `${v.marque.nom} ${v.modele} — ${v.immatriculation}`),
          }))}
        />
      </div>
    );
  }

  // --- Chargement du client concerné -------------------------------------
  const client = pourAutrui
    ? await prisma.clientProfile.findUnique({
        where: { id: clientParam },
        include: { user: true, vehicules: { include: { marque: true } } },
      })
    : await prisma.clientProfile.findUnique({
        where: { userId: session.userId },
        include: { user: true, vehicules: { include: { marque: true } } },
      });

  if (!client) redirect("/dashboard/rendez-vous/nouveau");

  if (client.vehicules.length === 0) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>
            {pourAutrui ? "Ce client n'a aucun véhicule enregistré" : "Ajoutez d'abord un véhicule"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">
            {pourAutrui
              ? "Enregistrez le véhicule du client avant de planifier une intervention."
              : "Vous devez enregistrer au moins un véhicule avant de prendre rendez-vous."}
          </p>
          <Link
            href={pourAutrui ? "/dashboard/clients" : "/dashboard/vehicules"}
            className="mt-3 inline-block text-sm font-medium text-primary-700"
          >
            {pourAutrui ? "Voir la fiche client →" : "Ajouter un véhicule →"}
          </Link>
        </CardContent>
      </Card>
    );
  }

  // On charge les centres couvrant l'une des marques du client, puis le tunnel
  // restreint la liste à la marque du véhicule effectivement sélectionné : un
  // client possédant une Ford et une Renault ne doit pas se voir proposer un
  // atelier Renault pour venir faire réviser sa Ford.
  const marquesClient = [...new Set(client.vehicules.map((v) => v.marqueId))];

  const [sites, services] = await Promise.all([
    prisma.site.findMany({
      where: { marques: { some: { marqueId: { in: marquesClient } } } },
      include: { compagnie: true, marques: { select: { marqueId: true } } },
      orderBy: [{ ville: "asc" }, { nom: "asc" }],
    }),
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

      {pourAutrui && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-medium">
                Pour {client.user.prenom} {client.user.nom}{" "}
                <Badge variant="neutral">{client.segment}</Badge>
              </p>
              <p className="text-xs text-muted">
                {client.user.telephone ?? "—"} · {client.user.email}
              </p>
            </div>
            <Link
              href="/dashboard/rendez-vous/nouveau"
              className="text-xs font-medium text-primary-700"
            >
              Changer de client
            </Link>
          </CardContent>
        </Card>
      )}

      <BookingWizard
        pourClientId={pourAutrui ? client.id : null}
        vehicules={client.vehicules.map((v) => ({
          id: v.id,
          label: `${v.marque.nom} ${v.modele} — ${v.immatriculation}`,
          marqueId: v.marqueId,
          marqueNom: v.marque.nom,
        }))}
        sites={sites.map((s) => ({
          id: s.id,
          nom: s.nom,
          ville: s.ville,
          compagnieCode: s.compagnie.code,
          compagnieNom: s.compagnie.nom,
          marqueIds: s.marques.map((m) => m.marqueId),
          latitude: s.latitude,
          longitude: s.longitude,
        }))}
        services={services.map((s) => ({
          id: s.id,
          code: s.code,
          nom: s.nom,
          description: s.description,
        }))}
      />
    </div>
  );
}
