import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { canSeeAllSites } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMAD, oneOf } from "@/lib/utils";
import { AjusterStockForm } from "./ajuster-stock-form";

export default async function StockPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === Role.CLIENT) redirect("/dashboard");

  const siteFilter = canSeeAllSites(session.role) ? {} : { siteId: session.siteId ?? "__none__" };

  const stocks = await prisma.stockPiece.findMany({
    where: siteFilter,
    include: { piece: true, site: true },
    orderBy: [{ site: { ville: "asc" } }, { piece: { designation: "asc" } }],
  });

  const enAlerte = stocks.filter((s) => s.quantiteDisponible <= s.seuilAlerte);
  const peutAjuster = oneOf(session.role, Role.GESTIONNAIRE_PIECES, Role.ADMIN, Role.RESPONSABLE_SAV);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Stock pièces détachées</h1>
        <p className="text-sm text-muted">Niveaux de stock, seuils d&apos;alerte et disponibilité inter-sites.</p>
      </div>

      {enAlerte.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardHeader>
            <CardTitle>{enAlerte.length} référence(s) sous le seuil d&apos;alerte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {enAlerte.map((s) => (
              <p key={s.id}>
                {s.piece.designation} — {s.site.ville} : {s.quantiteDisponible} en stock (seuil {s.seuilAlerte})
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-primary-50/50 text-left text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Désignation</th>
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3 text-right">Prix HT</th>
                <th className="px-4 py-3 text-right">Disponible</th>
                <th className="px-4 py-3">État</th>
                {peutAjuster && <th className="px-4 py-3">Ajuster</th>}
              </tr>
            </thead>
            <tbody>
              {stocks.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{s.piece.reference}</td>
                  <td className="px-4 py-3">{s.piece.designation}</td>
                  <td className="px-4 py-3">{s.site.ville}</td>
                  <td className="px-4 py-3 text-right">{formatMAD(Number(s.piece.prixHT))}</td>
                  <td className="px-4 py-3 text-right">{s.quantiteDisponible}</td>
                  <td className="px-4 py-3">
                    {s.quantiteDisponible <= s.seuilAlerte ? (
                      <Badge variant="warning">Sous seuil</Badge>
                    ) : (
                      <Badge variant="success">OK</Badge>
                    )}
                  </td>
                  {peutAjuster && (
                    <td className="px-4 py-3">
                      <AjusterStockForm stockId={s.id} quantite={s.quantiteDisponible} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
