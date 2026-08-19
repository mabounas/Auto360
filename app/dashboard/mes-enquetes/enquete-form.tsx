"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { repondreEnquete } from "./actions";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/input";

export function EnqueteForm({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          await repondreEnquete(fd);
          router.refresh();
        })
      }
      className="space-y-3"
    >
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`nps-${id}`}>Recommanderiez-vous Auto360 ? (0-10)</Label>
          <Select id={`nps-${id}`} name="npsScore" defaultValue="9">
            {Array.from({ length: 11 }, (_, i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor={`csat-${id}`}>Satisfaction globale (1-5)</Label>
          <Select id={`csat-${id}`} name="csatScore" defaultValue="4">
            {[1, 2, 3, 4, 5].map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor={`com-${id}`}>Commentaire (optionnel)</Label>
        <Textarea id={`com-${id}`} name="commentaire" rows={2} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer mon avis"}
      </Button>
    </form>
  );
}
