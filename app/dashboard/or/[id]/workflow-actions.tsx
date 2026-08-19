"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changerStatutOR, enregistrerControleQualite, cloturerEtFacturer } from "../actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Role, StatutOR } from "@/lib/enums";
import { oneOf } from "@/lib/utils";

export function WorkflowActions({
  ordreReparationId,
  statut,
  role,
  devisValide,
  dejaFacture,
}: {
  ordreReparationId: string;
  statut: StatutOR;
  role: Role;
  devisValide: boolean;
  dejaFacture: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const changer = (nouveauStatut: StatutOR) => {
    const fd = new FormData();
    fd.set("ordreReparationId", ordreReparationId);
    fd.set("statut", nouveauStatut);
    startTransition(async () => {
      await changerStatutOR(fd);
      router.refresh();
    });
  };

  const atelier = oneOf(role, Role.TECHNICIEN, Role.CHEF_ATELIER, Role.ADMIN, Role.RESPONSABLE_SAV);
  const accueil = oneOf(role, Role.RECEPTIONNAIRE, Role.RESPONSABLE_SAV, Role.ADMIN);

  return (
    <div className="space-y-3">
      {atelier && statut === StatutOR.ACCUEIL && (
        <Button size="sm" className="w-full" disabled={pending} onClick={() => changer(StatutOR.DIAGNOSTIC_EN_COURS)}>
          Démarrer le diagnostic
        </Button>
      )}

      {atelier && statut === StatutOR.DEVIS_VALIDE && (
        <Button size="sm" className="w-full" disabled={pending} onClick={() => changer(StatutOR.EN_REPARATION)}>
          Démarrer la réparation
        </Button>
      )}

      {atelier && statut === StatutOR.EN_REPARATION && (
        <form
          action={(fd) =>
            startTransition(async () => {
              await enregistrerControleQualite(fd);
              router.refresh();
            })
          }
          className="space-y-2"
        >
          <input type="hidden" name="ordreReparationId" value={ordreReparationId} />
          <input type="hidden" name="controleQualiteOk" value="true" />
          <Textarea name="controleQualiteNote" rows={2} placeholder="Checklist de contrôle qualité…" />
          <Button size="sm" className="w-full" type="submit" disabled={pending}>
            Valider le contrôle qualité
          </Button>
        </form>
      )}

      {accueil && statut === StatutOR.PRET_RESTITUTION && (
        <Button size="sm" className="w-full" disabled={pending} onClick={() => changer(StatutOR.RESTITUE)}>
          Marquer comme restitué
        </Button>
      )}

      {accueil && statut === StatutOR.RESTITUE && !dejaFacture && (
        <form
          action={(fd) =>
            startTransition(async () => {
              try {
                await cloturerEtFacturer(fd);
                setError(null);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Erreur");
              }
              router.refresh();
            })
          }
        >
          <input type="hidden" name="ordreReparationId" value={ordreReparationId} />
          <Button size="sm" className="w-full" type="submit" disabled={pending || !devisValide}>
            Clôturer et facturer
          </Button>
          {!devisValide && (
            <p className="mt-1 text-xs text-muted">Le devis doit être validé par le client avant facturation.</p>
          )}
        </form>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}

      {statut === StatutOR.CLOTURE && <p className="text-sm text-muted">Dossier clôturé et facturé.</p>}
    </div>
  );
}
