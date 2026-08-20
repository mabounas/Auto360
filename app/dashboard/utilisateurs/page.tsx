import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { ROLE_LABELS } from "@/lib/rbac";
import { porteeSites } from "@/lib/portee";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreerUtilisateurForm } from "./creer-utilisateur-form";

export default async function UtilisateursPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.ADMIN) redirect("/dashboard");

  // Un administrateur d'enseigne ne gère que les collaborateurs de son réseau.
  const filtreUtilisateurs = session.compagnieId
    ? { compagnieId: session.compagnieId }
    : {};

  const [users, sites] = await Promise.all([
    prisma.user.findMany({
      where: { role: { not: Role.CLIENT }, ...filtreUtilisateurs },
      include: { site: true, compagnie: true },
      orderBy: [{ role: "asc" }, { nom: "asc" }],
    }),
    prisma.site.findMany({
      where: porteeSites(session),
      include: { compagnie: true },
      orderBy: [{ compagnie: { nom: "asc" } }, { ville: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Utilisateurs</h1>
        <p className="text-sm text-muted">Collaborateurs Auto360 et droits d&apos;accès par profil et par site.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Créer un collaborateur</CardTitle>
        </CardHeader>
        <CardContent>
          <CreerUtilisateurForm
            sites={sites.map((s) => ({
              id: s.id,
              label: `${s.nom} — ${s.ville} (${s.compagnie.nom})`,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-primary-50/50 text-left text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Périmètre</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    {u.prenom} {u.nom}
                  </td>
                  <td className="px-4 py-3 text-xs">{u.email}</td>
                  <td className="px-4 py-3">{ROLE_LABELS[u.role]}</td>
                  <td className="px-4 py-3 text-xs">
                    {u.site ? (
                      <>
                        {u.site.nom}
                        <span className="block text-muted">{u.compagnie?.nom}</span>
                      </>
                    ) : u.compagnie ? (
                      <>
                        Toute l&apos;enseigne
                        <span className="block text-muted">{u.compagnie.nom}</span>
                      </>
                    ) : (
                      <Badge variant="accent">Toutes enseignes</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.actif ? "success" : "neutral"}>{u.actif ? "Actif" : "Inactif"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
