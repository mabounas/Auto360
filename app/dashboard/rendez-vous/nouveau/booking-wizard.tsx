"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { trierParDistance, formatDistance } from "@/lib/geo";
import { Navigation } from "lucide-react";

type Vehicule = { id: string; label: string };
type Site = {
  id: string;
  nom: string;
  ville: string;
  compagnieCode: string;
  compagnieNom: string;
  latitude: number | null;
  longitude: number | null;
};
type ServiceType = { id: string; code: string; nom: string; description: string | null };

export function BookingWizard({
  vehicules,
  sites,
  services,
}: {
  vehicules: Vehicule[];
  sites: Site[];
  services: ServiceType[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [vehiculeId, setVehiculeId] = useState(vehicules[0]?.id ?? "");
  const [serviceTypeId, setServiceTypeId] = useState(services[0]?.id ?? "");
  const [siteId, setSiteId] = useState(sites[0]?.id ?? "");
  const [motif, setMotif] = useState("");
  const [jours, setJours] = useState<string[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [creneaux, setCreneaux] = useState<{ heure: string; placesRestantes: number }[]>([]);
  const [heure, setHeure] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ statut: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maPosition, setMaPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [geoRefusee, setGeoRefusee] = useState(false);
  const [compagnieFiltre, setCompagnieFiltre] = useState("");

  // Enseignes réellement représentées parmi les centres proposés au client.
  const compagnies = [...new Map(sites.map((s) => [s.compagnieCode, s.compagnieNom])).entries()].sort(
    (a, b) => a[1].localeCompare(b[1], "fr")
  );

  // Filtre par enseigne, puis reclassement par éloignement dès que la position est connue.
  const sitesFiltres = compagnieFiltre
    ? sites.filter((s) => s.compagnieCode === compagnieFiltre)
    : sites;
  const sitesAffiches = maPosition
    ? trierParDistance(sitesFiltres, maPosition.lat, maPosition.lng)
    : sitesFiltres.map((s) => ({ ...s, distanceKm: null as number | null }));

  function localiserMoi() {
    if (!("geolocation" in navigator)) {
      setGeoRefusee(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setMaPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeoRefusee(true),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  // Le tri par proximité est le comportement par défaut : on demande la position en
  // arrivant sur le choix du centre, sans attendre une action de l'utilisateur. Si la
  // permission est refusée, la liste reste simplement triée par ville.
  function ouvrirEtapeCentre() {
    setStep(2);
    if (!maPosition && !geoRefusee) localiserMoi();
  }

  async function ouvrirEtapeCreneaux() {
    setStep(3);
    setDate(null);
    setHeure(null);
    setLoading(true);
    const res = await fetch(`/api/disponibilites?siteId=${siteId}&serviceTypeId=${serviceTypeId}`);
    const d = await res.json();
    setJours(d.jours ?? []);
    setLoading(false);
  }

  async function choisirDate(jour: string) {
    setDate(jour);
    setHeure(null);
    setLoading(true);
    const res = await fetch(
      `/api/disponibilites?siteId=${siteId}&serviceTypeId=${serviceTypeId}&date=${jour}`
    );
    const d = await res.json();
    setCreneaux(d.creneaux ?? []);
    setLoading(false);
  }

  async function confirmer() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/rendez-vous", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehiculeId, siteId, serviceTypeId, date, heure, motif }),
    });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Impossible de réserver ce créneau.");
      return;
    }
    setResult({ statut: data.statut });
  }

  if (result) {
    return (
      <Card className="max-w-lg">
        <CardContent className="p-6 text-center">
          <p className="text-lg font-bold text-foreground">
            {result.statut === "CONFIRME" ? "Rendez-vous confirmé !" : "Vous êtes en liste d'attente"}
          </p>
          <p className="mt-2 text-sm text-muted">
            {result.statut === "CONFIRME"
              ? "Un rappel automatique vous sera envoyé avant votre rendez-vous."
              : "Ce créneau vient d'être pris — nous vous contacterons dès qu'une place se libère."}
          </p>
          <Button className="mt-5" onClick={() => router.push("/dashboard/rendez-vous")}>
            Voir mes rendez-vous
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="space-y-5 p-6">
        <Stepper step={step} />

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Véhicule</Label>
              <Select value={vehiculeId} onChange={(e) => setVehiculeId(e.target.value)}>
                {vehicules.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Service</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {services.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setServiceTypeId(s.id)}
                    className={`rounded-lg border p-3 text-left text-sm ${
                      serviceTypeId === s.id ? "border-primary-700 bg-primary-50" : "border-border"
                    }`}
                  >
                    <p className="font-medium">{s.nom}</p>
                    {s.description && <p className="mt-0.5 text-xs text-muted">{s.description}</p>}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Motif (optionnel)</Label>
              <Textarea rows={2} value={motif} onChange={(e) => setMotif(e.target.value)} />
            </div>
            <Button onClick={ouvrirEtapeCentre} disabled={!vehiculeId || !serviceTypeId}>
              Continuer
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {compagnies.length > 1 && (
              <div>
                <Label htmlFor="compagnieFiltre">Enseigne</Label>
                <Select
                  id="compagnieFiltre"
                  value={compagnieFiltre}
                  onChange={(e) => {
                    setCompagnieFiltre(e.target.value);
                    setSiteId("");
                  }}
                >
                  <option value="">
                    Toutes les enseignes ({sites.length} centres)
                  </option>
                  {compagnies.map(([code, nom]) => (
                    <option key={code} value={code}>
                      {nom} ({sites.filter((s) => s.compagnieCode === code).length} centres)
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>Centre de service</Label>
              {maPosition ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  <Navigation size={13} className="text-accent-600" /> Classés par distance
                </span>
              ) : geoRefusee ? (
                <button
                  type="button"
                  onClick={() => {
                    setGeoRefusee(false);
                    localiserMoi();
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent-600"
                >
                  <Navigation size={13} /> Trier par proximité
                </button>
              ) : (
                <span className="text-xs text-muted">Localisation en cours…</span>
              )}
            </div>
            <div className="grid max-h-[420px] gap-2 overflow-y-auto sm:grid-cols-2">
              {sitesAffiches.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setSiteId(s.id)}
                  className={`rounded-lg border p-3 text-left text-sm ${
                    siteId === s.id ? "border-primary-700 bg-primary-50" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{s.nom}</p>
                    {s.distanceKm != null && (
                      <span className="shrink-0 text-xs font-medium text-accent-600">
                        {formatDistance(s.distanceKm)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted">
                    {s.ville} · {s.compagnieNom}
                  </p>
                </button>
              ))}
              {sitesAffiches.length === 0 && (
                <p className="text-sm text-muted">
                  Aucun centre de cette enseigne ne prend en charge votre véhicule.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Retour
              </Button>
              <Button onClick={ouvrirEtapeCreneaux} disabled={!siteId}>
                Continuer
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Label>Choisissez une date disponible</Label>
            {loading && !jours.length ? (
              <p className="text-sm text-muted">Recherche des disponibilités…</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {jours.map((j) => (
                  <button
                    type="button"
                    key={j}
                    onClick={() => choisirDate(j)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                      date === j ? "border-primary-700 bg-primary-50" : "border-border"
                    }`}
                  >
                    {formatDate(j)}
                  </button>
                ))}
                {!loading && jours.length === 0 && (
                  <p className="text-sm text-muted">Aucune disponibilité prochaine pour ce service dans ce centre.</p>
                )}
              </div>
            )}

            {date && (
              <>
                <Label>Créneau horaire</Label>
                {loading ? (
                  <p className="text-sm text-muted">Chargement…</p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {creneaux.map((c) => {
                        const complet = c.placesRestantes <= 0;
                        return (
                          <button
                            type="button"
                            key={c.heure}
                            disabled={complet}
                            title={complet ? "Créneau déjà réservé" : undefined}
                            onClick={() => setHeure(c.heure)}
                            className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                              complet
                                ? "cursor-not-allowed border-border bg-black/5 text-muted line-through opacity-60"
                                : heure === c.heure
                                  ? "border-primary-700 bg-primary-50"
                                  : "border-border hover:border-primary-300"
                            }`}
                          >
                            {c.heure}
                          </button>
                        );
                      })}
                    </div>
                    {creneaux.some((c) => c.placesRestantes <= 0) && (
                      <p className="text-xs text-muted">
                        Les créneaux barrés sont déjà réservés pour ce service dans ce centre.
                      </p>
                    )}
                  </>
                )}
              </>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(2)}>
                Retour
              </Button>
              <Button onClick={confirmer} disabled={!date || !heure || loading}>
                {loading ? "Réservation…" : "Confirmer le rendez-vous"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ["Service", "Centre", "Créneau"];
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-muted">
      {labels.map((l, i) => (
        <span key={l} className={i + 1 <= step ? "text-primary-700" : ""}>
          {i + 1}. {l}
          {i < labels.length - 1 && <span className="mx-2 text-border">—</span>}
        </span>
      ))}
    </div>
  );
}
