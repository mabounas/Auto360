"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { validerDevisClient } from "../actions";
import { Button } from "@/components/ui/button";
import { formatMAD } from "@/lib/utils";

export function ValidationDevisClient({
  ordreReparationId,
  montantTTC,
}: {
  ordreReparationId: string;
  montantTTC: number;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const submit = (accepte: boolean) => {
    const fd = new FormData();
    fd.set("ordreReparationId", ordreReparationId);
    fd.set("accepte", String(accepte));
    startTransition(async () => {
      await validerDevisClient(fd);
      router.refresh();
    });
  };

  return (
    <div className="rounded-lg border border-primary-300 bg-primary-50 p-4">
      <p className="text-sm font-medium text-foreground">
        Un devis de {formatMAD(montantTTC)} TTC attend votre validation.
      </p>
      <p className="mt-1 text-xs text-muted">
        Votre accord vaut signature électronique et autorise le lancement des travaux.
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => submit(true)} disabled={pending}>
          J&apos;accepte le devis
        </Button>
        <Button size="sm" variant="secondary" onClick={() => submit(false)} disabled={pending}>
          Je refuse
        </Button>
      </div>
    </div>
  );
}
