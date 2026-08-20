"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, UserX } from "lucide-react";
import { receptionnerRendezVous, marquerAbsent } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export function ReceptionActions({
  rendezVousId,
  ordreReparationId,
  ordreReparationNumero,
  peutReceptionner,
  statut,
}: {
  rendezVousId: string;
  ordreReparationId: string | null;
  ordreReparationNumero: string | null;
  peutReceptionner: boolean;
  statut: string;
}) {
  const [pending, startTransition] = useTransition();
  const [ouvert, setOuvert] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const router = useRouter();

  // Le véhicule est déjà passé à l'atelier : on renvoie vers son dossier.
  if (ordreReparationId) {
    return (
      <Link
        href={`/dashboard/or/${ordreReparationId}`}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary-700"
      >
        {ordreReparationNumero} <ArrowRight size={13} />
      </Link>
    );
  }

  if (statut === "NO_SHOW" || statut === "ANNULE") return null;

  if (!peutReceptionner) {
    return <span className="text-xs text-muted">En attente de réception à l&apos;accueil</span>;
  }

  if (!ouvert) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setOuvert(true)}>
          Réceptionner le véhicule
        </Button>
        <form
          action={(fd) =>
            startTransition(async () => {
              await marquerAbsent(fd);
              router.refresh();
            })
          }
        >
          <input type="hidden" name="rendezVousId" value={rendezVousId} />
          <button
            type="submit"
            disabled={pending}
            title="Le client ne s'est pas présenté"
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-danger"
          >
            <UserX size={13} /> Absent
          </button>
        </form>
      </div>
    );
  }

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          try {
            const id = await receptionnerRendezVous(fd);
            router.push(`/dashboard/or/${id}`);
          } catch (e) {
            setErreur(e instanceof Error ? e.message : "Erreur");
          }
        })
      }
      className="w-full max-w-md space-y-2"
    >
      <input type="hidden" name="rendezVousId" value={rendezVousId} />
      <Textarea
        name="etatDesLieuxNotes"
        rows={2}
        placeholder="État des lieux à la réception : rayures, niveau carburant, observations du client…"
      />
      {erreur && <p className="text-xs text-danger">{erreur}</p>}
      <div className="flex gap-2">
        <Button size="sm" type="submit" disabled={pending}>
          {pending ? "Ouverture…" : "Ouvrir le dossier atelier"}
        </Button>
        <Button size="sm" variant="secondary" type="button" onClick={() => setOuvert(false)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
