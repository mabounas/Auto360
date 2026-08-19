import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { canSeeAllSites } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { ReclamationForm, StatutReclamationForm } from "./reclamation-forms";

const VARIANT: Record<string, "warning" | "accent" | "success" | "neutral"> = {
  OUVERT: "warning",
  EN_COURS: "accent",
  RESOLU: "success",
  FERME: "neutral",
};

export default async function ReclamationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isClient = session.role === Role.CLIENT;

  let where = {};
  let ordresClient: { id: string; numero: string }[] = [];

  if (isClient) {
    const client = await prisma.clientProfile.findUnique({
      where: { userId: session.userId },
      include: { ordresReparation: { select: { id: true, numero: true }, orderBy: { createdAt: "desc" } } },
    });
    where = { clientId: client?.id ?? "__none__" };
    ordresClient = client?.ordresReparation ?? [];
  } else if (!canSeeAllSites(session.role)) {
    where = { siteId: session.siteId ?? "__none__" };
  }

  const reclamations = await prisma.reclamation.findMany({
    where,
    include: { client: { include: { user: true } }, ordreReparation: true, assigneA: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Réclamations</h1>
        <p className="text-sm text-muted">
          {isClient
            ? "Signalez un problème : nous traitons chaque réclamation sous 48 h."
            : "Suivi des réclamations clients et de leur SLA de traitement."}
        </p>
      </div>

      {isClient && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Nouvelle réclamation</CardTitle>
          </CardHeader>
          <CardContent>
            <ReclamationForm ordres={ordresClient} />
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {reclamations.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium">{r.motif}</p>
                {r.description && <p className="mt-1 text-xs text-muted">{r.description}</p>}
                <p className="mt-1 text-xs text-muted">
                  {!isClient && `${r.client.user.prenom} ${r.client.user.nom} — `}
                  {r.ordreReparation ? `${r.ordreReparation.numero} — ` : ""}
                  ouvert le {formatDateTime(r.createdAt)}
                  {r.slaEcheance && ` — SLA : ${formatDateTime(r.slaEcheance)}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={VARIANT[r.statut] ?? "neutral"}>{r.statut.replaceAll("_", " ")}</Badge>
                {!isClient && <StatutReclamationForm id={r.id} statut={r.statut} />}
              </div>
            </CardContent>
          </Card>
        ))}
        {reclamations.length === 0 && <p className="text-sm text-muted">Aucune réclamation.</p>}
      </div>
    </div>
  );
}
