import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMAD, oneOf } from "@/lib/utils";

export default async function CataloguePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!oneOf(session.role, Role.ADMIN, Role.RESPONSABLE_SAV, Role.PRICING)) redirect("/dashboard");

  const [forfaits, pieces, services] = await Promise.all([
    prisma.forfait.findMany({ include: { serviceType: true }, orderBy: { nom: "asc" } }),
    prisma.piece.findMany({ orderBy: { designation: "asc" } }),
    prisma.serviceType.findMany({ orderBy: { nom: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Catalogue</h1>
        <p className="text-sm text-muted">Forfaits à prix fixe, catalogue pièces et options de service.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forfaits à prix fixe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {forfaits.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
              <div>
                <p className="font-medium">{f.nom}</p>
                <p className="text-xs text-muted">
                  {f.description} · {f.serviceType?.nom}
                  {f.segmentVehicule && ` · segment ${f.segmentVehicule.replaceAll("_", " ").toLowerCase()}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={f.categorie === "CARROSSERIE" ? "accent" : "default"}>{f.categorie}</Badge>
                <span className="font-medium">{formatMAD(Number(f.prixFixeHT))} HT</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Options de service</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {services.map((s) => (
            <div key={s.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">{s.nom}</p>
              <p className="text-xs text-muted">
                {s.description} · durée type {s.dureeEstimeeMin} min
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catalogue pièces</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-primary-50/50 text-left text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Désignation</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3 text-right">Prix HT</th>
              </tr>
            </thead>
            <tbody>
              {pieces.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{p.reference}</td>
                  <td className="px-4 py-3">{p.designation}</td>
                  <td className="px-4 py-3 text-xs text-muted">{p.categorie ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{formatMAD(Number(p.prixHT))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
