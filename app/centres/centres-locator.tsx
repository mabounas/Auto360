"use client";

import { useState } from "react";
import { MapPin, Navigation, Phone, BadgeCheck, LoaderCircle, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDistance, lienItineraire } from "@/lib/geo";

type Compagnie = {
  code: string;
  nom: string;
  description: string | null;
  couleur: string | null;
  nbSites: number;
};

type Centre = {
  id: string;
  code: string;
  nom: string;
  ville: string;
  adresse: string;
  telephone: string | null;
  latitude: number | null;
  longitude: number | null;
  certifieIso: boolean;
  marques: string[];
  compagnie: { code: string; nom: string; couleur: string | null };
  distanceKm?: number | null;
};

export function CentresLocator({
  compagnies,
  villes,
  marques,
  centresInitiaux,
}: {
  compagnies: Compagnie[];
  villes: string[];
  marques: string[];
  centresInitiaux: Centre[];
}) {
  // La première liste est rendue côté serveur : pas d'appel au montage, donc pas de
  // page vide au chargement et un contenu indexable.
  const [centres, setCentres] = useState<Centre[]>(centresInitiaux);
  const [compagnie, setCompagnie] = useState("");
  const [ville, setVille] = useState("");
  const [marque, setMarque] = useState("");
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [chargement, setChargement] = useState(false);
  const [geoEtat, setGeoEtat] = useState<"inactif" | "attente" | "refuse" | "indispo">("inactif");

  type Filtres = {
    compagnie?: string;
    ville?: string;
    marque?: string;
    pos?: { lat: number; lng: number } | null;
  };

  async function charger(f: Filtres) {
    setChargement(true);
    const params = new URLSearchParams();
    if (f.compagnie) params.set("compagnie", f.compagnie);
    if (f.ville) params.set("ville", f.ville);
    if (f.marque) params.set("marque", f.marque);
    if (f.pos) {
      params.set("lat", String(f.pos.lat));
      params.set("lng", String(f.pos.lng));
    }
    const res = await fetch(`/api/centres?${params}`);
    const data = await res.json();
    setCentres(data.centres ?? []);
    setChargement(false);
  }

  function choisirCompagnie(code: string) {
    setCompagnie(code);
    setMarque("");
    charger({ compagnie: code, ville, pos: position });
  }

  function localiserMoi() {
    if (!("geolocation" in navigator)) {
      setGeoEtat("indispo");
      return;
    }
    setGeoEtat("attente");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(p);
        setGeoEtat("inactif");
        setVille("");
        charger({ compagnie, marque, pos: p });
      },
      () => setGeoEtat("refuse"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  return (
    <div className="space-y-6">
      {/* Sélecteur d'enseigne */}
      <div>
        <Label>Enseigne</Label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => choisirCompagnie("")}
            className={`rounded-xl border p-3 text-left transition-colors ${
              compagnie === "" ? "border-primary-700 bg-primary-50" : "border-border bg-surface"
            }`}
          >
            <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Building2 size={15} /> Toutes les enseignes
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {compagnies.reduce((n, c) => n + c.nbSites, 0)} points de service
            </p>
          </button>
          {compagnies.map((c) => (
            <button
              type="button"
              key={c.code}
              onClick={() => choisirCompagnie(c.code)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                compagnie === c.code ? "border-primary-700 bg-primary-50" : "border-border bg-surface"
              }`}
            >
              <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: c.couleur ?? "var(--primary-700)" }}
                />
                {c.nom}
              </p>
              <p className="mt-0.5 text-xs text-muted">{c.nbSites} points de service</p>
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-[180px] flex-1">
            <Label htmlFor="ville">Ville</Label>
            <Select
              id="ville"
              value={ville}
              onChange={(e) => {
                setVille(e.target.value);
                setPosition(null);
                charger({ compagnie, ville: e.target.value, marque });
              }}
            >
              <option value="">Toutes les villes</option>
              {villes.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-[180px] flex-1">
            <Label htmlFor="marque">Marque</Label>
            <Select
              id="marque"
              value={marque}
              onChange={(e) => {
                setMarque(e.target.value);
                charger({ compagnie, ville, marque: e.target.value, pos: position });
              }}
            >
              <option value="">Toutes les marques</option>
              {marques.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={localiserMoi} variant="accent" disabled={geoEtat === "attente"}>
            {geoEtat === "attente" ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Navigation size={16} />
            )}
            Le plus proche de moi
          </Button>
        </CardContent>
      </Card>

      {geoEtat === "refuse" && (
        <p className="text-sm text-warning">
          Localisation refusée ou indisponible. Autorisez l&apos;accès à votre position dans le
          navigateur, ou choisissez votre ville dans la liste.
        </p>
      )}
      {geoEtat === "indispo" && (
        <p className="text-sm text-warning">
          Votre navigateur ne prend pas en charge la géolocalisation — utilisez le filtre par ville.
        </p>
      )}

      {chargement ? (
        <p className="text-sm text-muted">Recherche des centres…</p>
      ) : centres.length === 0 ? (
        <p className="text-sm text-muted">Aucun centre ne correspond à ces critères.</p>
      ) : (
        <>
          <p className="text-sm text-muted">
            {centres.length} centre{centres.length > 1 ? "s" : ""} trouvé
            {centres.length > 1 ? "s" : ""}
            {position && " — classés du plus proche au plus éloigné"}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {centres.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{c.nom}</p>
                      <p className="mt-0.5 flex items-start gap-1 text-xs text-muted">
                        <MapPin size={12} className="mt-0.5 shrink-0" />
                        <span>{c.adresse}</span>
                      </p>
                    </div>
                    {c.distanceKm != null && (
                      <Badge variant="accent" className="shrink-0">
                        {formatDistance(c.distanceKm)}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                      style={{ background: c.compagnie.couleur ?? "#003282" }}
                    >
                      {c.compagnie.nom}
                    </span>
                    {c.marques.slice(0, 5).map((m) => (
                      <span
                        key={m}
                        className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] text-primary-700"
                      >
                        {m}
                      </span>
                    ))}
                    {c.marques.length > 5 && (
                      <span className="text-[11px] text-muted">+{c.marques.length - 5}</span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                    {c.certifieIso && (
                      <span className="inline-flex items-center gap-1 text-success">
                        <BadgeCheck size={13} /> ISO 9001
                      </span>
                    )}
                    {c.telephone && (
                      <a href={`tel:${c.telephone}`} className="inline-flex items-center gap-1 text-primary-700">
                        <Phone size={13} /> {c.telephone}
                      </a>
                    )}
                    {c.latitude != null && c.longitude != null && (
                      <a
                        href={lienItineraire(c.latitude, c.longitude, c.nom)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-accent-600"
                      >
                        <Navigation size={13} /> Itinéraire
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
