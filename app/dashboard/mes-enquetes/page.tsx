import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { EnqueteForm } from "./enquete-form";

export default async function MesEnquetesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.CLIENT) redirect("/dashboard/satisfaction");

  const client = await prisma.clientProfile.findUnique({
    where: { userId: session.userId },
    include: {
      enquetes: {
        include: { ordreReparation: { include: { vehicule: true, site: true } } },
        orderBy: { envoyeeAt: "desc" },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mes enquêtes de satisfaction</h1>
          <p className="text-sm text-muted">Votre avis nous aide à améliorer nos ateliers.</p>
        </div>
        <Badge variant="accent">{client?.pointsFidelite ?? 0} points fidélité</Badge>
      </div>

      <div className="space-y-4">
        {client?.enquetes.map((e) => (
          <Card key={e.id}>
            <CardHeader>
              <CardTitle>
                {e.ordreReparation.vehicule.immatriculation} — {e.ordreReparation.site.nom}
              </CardTitle>
              <p className="text-xs text-muted">Intervention du {formatDate(e.envoyeeAt)}</p>
            </CardHeader>
            <CardContent>
              {e.reponduAt ? (
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted">Recommandation (NPS) :</span> {e.npsScore}/10
                  </p>
                  <p>
                    <span className="text-muted">Satisfaction (CSAT) :</span> {e.csatScore}/5
                  </p>
                  {e.commentaire && <p className="text-muted">« {e.commentaire} »</p>}
                </div>
              ) : (
                <EnqueteForm id={e.id} />
              )}
            </CardContent>
          </Card>
        ))}
        {!client?.enquetes.length && (
          <p className="text-sm text-muted">
            Aucune enquête pour le moment — elles sont envoyées après chaque intervention.
          </p>
        )}
      </div>
    </div>
  );
}
