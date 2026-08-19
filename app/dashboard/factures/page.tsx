import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { canSeeAllSites } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMAD } from "@/lib/utils";
import { PaiementForm } from "./paiement-form";

export default async function FacturesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isClient = session.role === Role.CLIENT;

  let where = {};
  if (isClient) {
    const client = await prisma.clientProfile.findUnique({ where: { userId: session.userId } });
    where = { clientId: client?.id ?? "__none__" };
  } else if (!canSeeAllSites(session.role)) {
    where = { ordreReparation: { siteId: session.siteId ?? "__none__" } };
  }

  const factures = await prisma.facture.findMany({
    where,
    include: {
      client: { include: { user: true } },
      ordreReparation: { include: { vehicule: true, site: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{isClient ? "Mes factures" : "Factures"}</h1>
        <p className="text-sm text-muted">
          {isClient
            ? "Factures générées automatiquement à la clôture de vos réparations."
            : "Suivi de la facturation et des encaissements."}
        </p>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-primary-50/50 text-left text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3">N° facture</th>
                {!isClient && <th className="px-4 py-3">Client</th>}
                <th className="px-4 py-3">Véhicule</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Montant TTC</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {factures.map((f) => (
                <tr key={f.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/or/${f.ordreReparationId}`} className="font-medium text-primary-700">
                      {f.numero}
                    </Link>
                  </td>
                  {!isClient && (
                    <td className="px-4 py-3">
                      {f.client.user.prenom} {f.client.user.nom}
                    </td>
                  )}
                  <td className="px-4 py-3">{f.ordreReparation.vehicule.immatriculation}</td>
                  <td className="px-4 py-3">{formatDate(f.createdAt)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatMAD(Number(f.montantTTC))}</td>
                  <td className="px-4 py-3">
                    <Badge variant={f.statutPaiement === "PAYEE" ? "success" : "warning"}>
                      {f.statutPaiement.replaceAll("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {f.statutPaiement !== "PAYEE" && <PaiementForm factureId={f.id} isClient={isClient} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {factures.length === 0 && <p className="p-6 text-sm text-muted">Aucune facture pour le moment.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
