"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { creerReclamation, changerStatutReclamation } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

export function ReclamationForm({ ordres }: { ordres: { id: string; numero: string }[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          await creerReclamation(fd);
          router.refresh();
        })
      }
      className="space-y-3"
    >
      <div>
        <Label htmlFor="motif">Motif</Label>
        <Input id="motif" name="motif" required placeholder="ex : Problème non résolu après intervention" />
      </div>
      {ordres.length > 0 && (
        <div>
          <Label htmlFor="ordreReparationId">Dossier concerné (optionnel)</Label>
          <Select id="ordreReparationId" name="ordreReparationId" defaultValue="">
            <option value="">Aucun dossier particulier</option>
            {ordres.map((o) => (
              <option key={o.id} value={o.id}>
                {o.numero}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer la réclamation"}
      </Button>
    </form>
  );
}

export function StatutReclamationForm({ id, statut }: { id: string; statut: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          await changerStatutReclamation(fd);
          router.refresh();
        })
      }
      className="flex items-center gap-1"
    >
      <input type="hidden" name="id" value={id} />
      <select name="statut" defaultValue={statut} className="h-8 rounded border border-border px-2 text-xs">
        <option value="OUVERT">Ouvert</option>
        <option value="EN_COURS">En cours</option>
        <option value="RESOLU">Résolu</option>
        <option value="FERME">Fermé</option>
      </select>
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        OK
      </Button>
    </form>
  );
}
