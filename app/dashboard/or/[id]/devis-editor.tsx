"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ajouterLigneDevis, supprimerLigneDevis, publierDevis } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

export function DevisEditor({
  ordreReparationId,
  lignes,
  peutPublier,
  pieces,
  forfaits,
}: {
  ordreReparationId: string;
  lignes: { id: string; designation: string }[];
  peutPublier: boolean;
  pieces: { id: string; label: string }[];
  forfaits: { id: string; label: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState("MAIN_OEUVRE");
  const router = useRouter();

  const run = (fn: (fd: FormData) => Promise<void>) => (fd: FormData) =>
    startTransition(async () => {
      await fn(fd);
      router.refresh();
    });

  return (
    <div className="space-y-4 border-t border-border pt-4">
      {lignes.length > 0 && (
        <div className="space-y-1">
          {lignes.map((l) => (
            <form key={l.id} action={run(supprimerLigneDevis)} className="flex items-center justify-between text-xs">
              <input type="hidden" name="ligneId" value={l.id} />
              <input type="hidden" name="ordreReparationId" value={ordreReparationId} />
              <span className="text-muted">{l.designation}</span>
              <button type="submit" className="text-danger" aria-label="Supprimer la ligne">
                <Trash2 size={14} />
              </button>
            </form>
          ))}
        </div>
      )}

      <form action={run(ajouterLigneDevis)} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="ordreReparationId" value={ordreReparationId} />
        <div>
          <Label htmlFor="type">Type de ligne</Label>
          <Select id="type" name="type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="MAIN_OEUVRE">Main d&apos;œuvre</option>
            <option value="PIECE">Pièce</option>
            <option value="FORFAIT">Forfait</option>
          </Select>
        </div>

        {type === "PIECE" && (
          <div>
            <Label htmlFor="pieceId">Pièce du catalogue</Label>
            <Select id="pieceId" name="pieceId" required defaultValue="">
              <option value="" disabled>
                Sélectionner…
              </option>
              {pieces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
        )}

        {type === "FORFAIT" && (
          <div>
            <Label htmlFor="forfaitId">Forfait</Label>
            <Select id="forfaitId" name="forfaitId" required defaultValue="">
              <option value="" disabled>
                Sélectionner…
              </option>
              {forfaits.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </Select>
          </div>
        )}

        {type === "MAIN_OEUVRE" && (
          <>
            <div>
              <Label htmlFor="designation">Désignation</Label>
              <Input id="designation" name="designation" required placeholder="ex : Remplacement plaquettes AV" />
            </div>
            <div>
              <Label htmlFor="prixUnitaireHT">Prix unitaire HT (MAD)</Label>
              <Input id="prixUnitaireHT" name="prixUnitaireHT" type="number" step="0.01" min={0} required />
            </div>
          </>
        )}

        <div>
          <Label htmlFor="quantite">Quantité</Label>
          <Input id="quantite" name="quantite" type="number" min={1} defaultValue={1} />
        </div>

        <div className="flex items-end sm:col-span-2">
          <Button type="submit" size="sm" variant="secondary" disabled={pending}>
            Ajouter au devis
          </Button>
        </div>
      </form>

      {peutPublier && (
        <form action={run(publierDevis)}>
          <input type="hidden" name="ordreReparationId" value={ordreReparationId} />
          <Button type="submit" disabled={pending}>
            {pending ? "Publication…" : "Publier le devis au client"}
          </Button>
          <p className="mt-1 text-xs text-muted">
            Le client est notifié et les pièces du devis sont automatiquement réservées.
          </p>
        </form>
      )}
    </div>
  );
}
