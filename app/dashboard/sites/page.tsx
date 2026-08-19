import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { oneOf } from "@/lib/utils";

export default async function SitesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!oneOf(session.role, Role.DIRECTION_GROUPE, Role.ADMIN)) redirect("/dashboard");

  const sites = await prisma.site.findMany({
    include: {
      marques: { include: { marque: true } },
      _count: { select: { ordresReparation: true, rendezVous: true, users: true } },
    },
    orderBy: { ville: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sites &amp; marques</h1>
        <p className="text-sm text-muted">Réseau des centres Auto360 et marques distribuées par site.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {sites.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle>
                {s.nom} {s.certifieIso && <Badge variant="success">ISO 9001</Badge>}
              </CardTitle>
              <p className="text-xs text-muted">
                {s.adresse}, {s.ville} · {s.telephone}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {s.marques.map((sm) => (
                  <span key={sm.marqueId} className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs text-primary-700">
                    {sm.marque.nom}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted">
                {s._count.ordresReparation} ordre(s) de réparation · {s._count.rendezVous} rendez-vous ·{" "}
                {s._count.users} collaborateur(s)
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
