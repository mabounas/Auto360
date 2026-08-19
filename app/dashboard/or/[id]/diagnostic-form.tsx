"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { enregistrerDiagnostic } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

type Existing = {
  anomaliesConstatees: string | null;
  piecesARemplacer: string | null;
  mesures: unknown;
} | null;

const POINTS = [
  { name: "moteur", label: "Moteur" },
  { name: "freinage", label: "Freinage" },
  { name: "direction", label: "Direction" },
  { name: "niveaux", label: "Niveaux" },
  { name: "pneumatiques", label: "Pneumatiques" },
  { name: "electrique", label: "Système électrique" },
];

export function DiagnosticForm({ ordreReparationId, existing }: { ordreReparationId: string; existing: Existing }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const mesures = (existing?.mesures ?? {}) as Record<string, string>;

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          await enregistrerDiagnostic(fd);
          router.refresh();
        })
      }
      className="space-y-3"
    >
      <input type="hidden" name="ordreReparationId" value={ordreReparationId} />
      <p className="text-sm font-medium">Diagnostic électronique multi-points</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {POINTS.map((p) => (
          <div key={p.name}>
            <Label htmlFor={p.name}>{p.label}</Label>
            <Input id={p.name} name={p.name} defaultValue={mesures[p.name] ?? ""} placeholder="Conforme / à surveiller…" />
          </div>
        ))}
      </div>
      <div>
        <Label htmlFor="anomaliesConstatees">Anomalies constatées</Label>
        <Textarea
          id="anomaliesConstatees"
          name="anomaliesConstatees"
          rows={2}
          defaultValue={existing?.anomaliesConstatees ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="piecesARemplacer">Pièces à remplacer (transmises au pricing)</Label>
        <Textarea
          id="piecesARemplacer"
          name="piecesARemplacer"
          rows={2}
          defaultValue={existing?.piecesARemplacer ?? ""}
          placeholder="ex : plaquettes de frein avant, filtre à huile"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer et transmettre au chiffrage"}
      </Button>
    </form>
  );
}
