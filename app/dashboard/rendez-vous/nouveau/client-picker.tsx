"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Phone, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type ClientLigne = {
  id: string;
  nom: string;
  telephone: string | null;
  email: string;
  segment: string;
  vehicules: string[];
};

export function ClientPicker({ q, clients }: { q: string; clients: ClientLigne[] }) {
  const router = useRouter();
  const [recherche, setRecherche] = useState(q);

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push(
            `/dashboard/rendez-vous/nouveau${recherche ? `?q=${encodeURIComponent(recherche)}` : ""}`
          );
        }}
        className="flex flex-wrap gap-2"
      >
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="N° de châssis (VIN), immatriculation, nom, téléphone…"
          className="max-w-sm flex-1"
        />
        <Button type="submit" variant="secondary">
          <Search size={15} /> Rechercher
        </Button>
      </form>

      <div className="grid gap-3 lg:grid-cols-2">
        {clients.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {c.nom} <Badge variant="neutral">{c.segment}</Badge>
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                  <Phone size={11} /> {c.telephone ?? "—"} · {c.email}
                </p>
                <p className="mt-1 flex items-start gap-1 text-xs text-muted">
                  <Car size={11} className="mt-0.5 shrink-0" />
                  <span>
                    {c.vehicules.length > 0 ? c.vehicules.join(" · ") : "Aucun véhicule enregistré"}
                  </span>
                </p>
              </div>
              <Button asChild size="sm" disabled={c.vehicules.length === 0}>
                <Link href={`/dashboard/rendez-vous/nouveau?client=${c.id}`}>Planifier</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
        {clients.length === 0 && (
          <p className="text-sm text-muted">
            Aucun client ne correspond à cette recherche. Créez sa fiche depuis l&apos;écran
            Clients avant de planifier son rendez-vous.
          </p>
        )}
      </div>
    </div>
  );
}
