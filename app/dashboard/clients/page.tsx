import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { oneOf } from "@/lib/utils";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!oneOf(session.role, Role.CENTRE_APPEL, Role.RECEPTIONNAIRE, Role.ADMIN, Role.RESPONSABLE_SAV)) {
    redirect("/dashboard");
  }

  const { q } = await searchParams;

  const clients = await prisma.clientProfile.findMany({
    where: q
      ? {
          OR: [
            { user: { nom: { contains: q, mode: "insensitive" } } },
            { user: { prenom: { contains: q, mode: "insensitive" } } },
            { user: { email: { contains: q, mode: "insensitive" } } },
            { vehicules: { some: { immatriculation: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {},
    include: {
      user: true,
      vehicules: { include: { marque: true } },
      _count: { select: { ordresReparation: true, reclamations: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-sm text-muted">Vue 360° : coordonnées, véhicules et historique.</p>
        </div>
        <form>
          <input
            name="q"
            defaultValue={q}
            placeholder="Nom, email ou immatriculation…"
            className="h-10 w-64 rounded-lg border border-border px-3 text-sm"
          />
        </form>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {clients.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {c.user.prenom} {c.user.nom}
                    {c.raisonSociale && <span className="text-muted"> — {c.raisonSociale}</span>}
                  </p>
                  <p className="text-xs text-muted">
                    {c.user.email} · {c.user.telephone ?? "—"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={c.segment === "VIP" ? "accent" : c.segment === "FLOTTE" ? "default" : "neutral"}>
                    {c.segment}
                  </Badge>
                  <span className="text-xs text-muted">{c.pointsFidelite} pts</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {c.vehicules.map((v) => (
                  <span key={v.id} className="rounded-full bg-primary-50 px-2.5 py-0.5 text-primary-700">
                    {v.marque.nom} {v.modele} — {v.immatriculation}
                  </span>
                ))}
                {c.vehicules.length === 0 && <span className="text-muted">Aucun véhicule enregistré</span>}
              </div>
              <p className="mt-3 text-xs text-muted">
                {c._count.ordresReparation} passage(s) atelier · {c._count.reclamations} réclamation(s) ·{" "}
                {c.consentementRgpd ? "Consentement 09-08 recueilli" : "Consentement manquant"}
              </p>
            </CardContent>
          </Card>
        ))}
        {clients.length === 0 && <p className="text-sm text-muted">Aucun client trouvé.</p>}
      </div>
    </div>
  );
}
