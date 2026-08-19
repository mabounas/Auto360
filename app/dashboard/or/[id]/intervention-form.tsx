"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ajouterLigneIntervention } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export function InterventionForm({ ordreReparationId }: { ordreReparationId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          await ajouterLigneIntervention(fd);
          router.refresh();
        })
      }
      className="space-y-3"
    >
      <input type="hidden" name="ordreReparationId" value={ordreReparationId} />
      <div>
        <Label htmlFor="description">Intervention réalisée</Label>
        <Textarea id="description" name="description" rows={2} required />
      </div>
      <div>
        <Label htmlFor="tempsPasseMin">Temps passé (minutes)</Label>
        <Input id="tempsPasseMin" name="tempsPasseMin" type="number" min={0} defaultValue={30} />
      </div>
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        Enregistrer l&apos;intervention
      </Button>
    </form>
  );
}
