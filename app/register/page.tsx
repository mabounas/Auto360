"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/marketing/auth-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    password: "",
    typeClient: "PARTICULIER",
    raisonSociale: "",
    consentementRgpd: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Impossible de créer le compte.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell title="Créer mon espace client" subtitle="Réservez vos services et suivez vos véhicules en ligne.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="prenom">Prénom</Label>
            <Input
              id="prenom"
              required
              value={form.prenom}
              onChange={(e) => setForm({ ...form, prenom: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          </div>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="telephone">Téléphone</Label>
          <Input
            id="telephone"
            required
            placeholder="06 12 34 56 78"
            value={form.telephone}
            onChange={(e) => setForm({ ...form, telephone: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="typeClient">Profil</Label>
          <Select
            id="typeClient"
            value={form.typeClient}
            onChange={(e) => setForm({ ...form, typeClient: e.target.value })}
          >
            <option value="PARTICULIER">Particulier</option>
            <option value="ENTREPRISE">Entreprise / gestionnaire de flotte</option>
          </Select>
        </div>
        {form.typeClient === "ENTREPRISE" && (
          <div>
            <Label htmlFor="raisonSociale">Raison sociale</Label>
            <Input
              id="raisonSociale"
              value={form.raisonSociale}
              onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })}
            />
          </div>
        )}
        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            minLength={6}
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <label className="flex items-start gap-2 text-xs text-muted">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={form.consentementRgpd}
            onChange={(e) => setForm({ ...form, consentementRgpd: e.target.checked })}
          />
          <span>
            J&apos;accepte que mes données personnelles soient traitées conformément à la loi 09-08
            relative à la protection des données à caractère personnel, pour la gestion de ma
            relation client Auto360.
          </span>
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Création…" : "Créer mon compte"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        Déjà client ?{" "}
        <Link href="/login" className="font-medium text-primary-700">
          Se connecter
        </Link>
      </p>
    </AuthShell>
  );
}
