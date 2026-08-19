"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { reglerFacture } from "./actions";
import { Button } from "@/components/ui/button";

export function PaiementForm({ factureId, isClient }: { factureId: string; isClient: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          await reglerFacture(fd);
          router.refresh();
        })
      }
      className="flex items-center gap-1"
    >
      <input type="hidden" name="factureId" value={factureId} />
      <select name="modePaiement" className="h-8 rounded border border-border px-2 text-xs" defaultValue="CARTE">
        <option value="CARTE">Carte bancaire</option>
        <option value="MOBILE">Paiement mobile</option>
        {!isClient && (
          <>
            <option value="ESPECES">Espèces</option>
            <option value="VIREMENT">Virement</option>
            <option value="ASSURANCE">Prise en charge assurance</option>
          </>
        )}
      </select>
      <Button type="submit" size="sm" disabled={pending}>
        {isClient ? "Payer" : "Encaisser"}
      </Button>
    </form>
  );
}
