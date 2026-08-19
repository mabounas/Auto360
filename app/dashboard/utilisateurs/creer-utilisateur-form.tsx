"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { creerUtilisateur } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { ROLE_LABELS, MULTI_SITE_ROLES, STAFF_ROLES } from "@/lib/rbac";
import { Role } from "@/lib/enums";

export function CreerUtilisateurForm({ sites }: { sites: { id: string; label: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState<Role>(Role.RECEPTIONNAIRE);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const besoinSite = !MULTI_SITE_ROLES.includes(role);

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          try {
            await creerUtilisateur(fd);
            setError(null);
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Erreur");
          }
        })
      }
      className="grid gap-3 sm:grid-cols-2"
    >
      <div>
        <Label htmlFor="prenom">Prénom</Label>
        <Input id="prenom" name="prenom" required />
      </div>
      <div>
        <Label htmlFor="nom">Nom</Label>
        <Input id="nom" name="nom" required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="telephone">Téléphone</Label>
        <Input id="telephone" name="telephone" />
      </div>
      <div>
        <Label htmlFor="role">Rôle</Label>
        <Select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {STAFF_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="siteId">Site</Label>
        <Select id="siteId" name="siteId" disabled={!besoinSite} defaultValue={sites[0]?.id}>
          {besoinSite ? (
            sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))
          ) : (
            <option value="">Tous sites</option>
          )}
        </Select>
      </div>
      <div>
        <Label htmlFor="password">Mot de passe initial</Label>
        <Input id="password" name="password" type="password" minLength={6} required />
      </div>
      {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Création…" : "Créer le collaborateur"}
        </Button>
      </div>
    </form>
  );
}
