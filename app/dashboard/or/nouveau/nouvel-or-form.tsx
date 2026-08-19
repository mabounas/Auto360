"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { creerOrdreReparation } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

export function NouvelOrForm({
  vehicules,
  sites,
}: {
  vehicules: { id: string; label: string }[];
  sites: { id: string; label: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [motif, setMotif] = useState("ENTRETIEN_PERIODIQUE");
  const [sinistre, setSinistre] = useState(false);
  const router = useRouter();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const id = await creerOrdreReparation(formData);
          router.push(`/dashboard/or/${id}`);
        });
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="vehiculeId">Véhicule</Label>
        <Select id="vehiculeId" name="vehiculeId" required defaultValue="">
          <option value="" disabled>
            Rechercher par immatriculation…
          </option>
          {vehicules.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="siteId">Site</Label>
        <Select id="siteId" name="siteId" required defaultValue={sites[0]?.id}>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="motifVisite">Motif de visite</Label>
        <Select id="motifVisite" name="motifVisite" value={motif} onChange={(e) => setMotif(e.target.value)}>
          <option value="ENTRETIEN_PERIODIQUE">Entretien périodique → équipe Révision</option>
          <option value="DIAGNOSTIC_PANNE">Diagnostic / panne → équipe Mécanique générale</option>
          <option value="CARROSSERIE">Carrosserie → équipe Carrosserie</option>
        </Select>
        <p className="mt-1 text-xs text-muted">
          Le motif détermine le workflow et l&apos;équipe atelier destinataire du dossier.
        </p>
      </div>

      {motif === "CARROSSERIE" && (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="sinistre" checked={sinistre} onChange={(e) => setSinistre(e.target.checked)} />
            Dossier rattaché à un sinistre assurance
          </label>
          {sinistre && (
            <div>
              <Label htmlFor="compagnieAssurance">Compagnie d&apos;assurance</Label>
              <Input id="compagnieAssurance" name="compagnieAssurance" placeholder="ex : Wafa Assurance" />
            </div>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="etatDesLieuxNotes">État des lieux à la réception</Label>
        <Textarea
          id="etatDesLieuxNotes"
          name="etatDesLieuxNotes"
          rows={3}
          placeholder="Rayures, éléments manquants, niveau carburant, observations client…"
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Création…" : "Ouvrir l'ordre de réparation"}
      </Button>
    </form>
  );
}
