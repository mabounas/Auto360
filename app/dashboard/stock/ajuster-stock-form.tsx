"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ajusterStock } from "./actions";
import { Button } from "@/components/ui/button";

export function AjusterStockForm({ stockId, quantite }: { stockId: string; quantite: number }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          await ajusterStock(fd);
          router.refresh();
        })
      }
      className="flex items-center gap-1"
    >
      <input type="hidden" name="stockId" value={stockId} />
      <input
        name="quantiteDisponible"
        type="number"
        min={0}
        defaultValue={quantite}
        className="h-8 w-16 rounded border border-border px-2 text-xs"
      />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        OK
      </Button>
    </form>
  );
}
