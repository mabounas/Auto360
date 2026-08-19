"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

type Vehicule = { id: string; label: string };
type Site = { id: string; nom: string; ville: string };
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
            <Button onClick={() => setStep(2)} disabled={!vehiculeId || !serviceTypeId}>
              Continuer
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Label>Centre Auto360</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {sites.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setSiteId(s.id)}
                  className={`rounded-lg border p-3 text-left text-sm ${
                    siteId === s.id ? "border-primary-700 bg-primary-50" : "border-border"
                  }`}
                >
                  <p className="font-medium">{s.nom}</p>
                  <p className="text-xs text-muted">{s.ville}</p>
                </button>
              ))}
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
                  <div className="flex flex-wrap gap-2">
                    {creneaux.map((c) => (
                      <button
                        type="button"
                        key={c.heure}
                        onClick={() => setHeure(c.heure)}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                          heure === c.heure ? "border-primary-700 bg-primary-50" : "border-border"
                        }`}
                      >
                        {c.heure}
                      </button>
                    ))}
                  </div>
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
