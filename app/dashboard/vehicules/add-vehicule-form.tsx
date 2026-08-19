"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ajouterVehicule } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export function AddVehiculeForm({ marques }: { marques: { id: string; nom: string }[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await ajouterVehicule(formData);
          router.refresh();
        });
      }}
      className="grid gap-3 sm:grid-cols-2"
    >
      <div>
        <Label htmlFor="marqueId">Marque</Label>
        <Select id="marqueId" name="marqueId" required defaultValue="">
          <option value="" disabled>
            Sélectionner…
          </option>
          {marques.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nom}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="modele">Modèle</Label>
        <Input id="modele" name="modele" required placeholder="ex : Clio V" />
      </div>
      <div>
        <Label htmlFor="immatriculation">Immatriculation</Label>
        <Input id="immatriculation" name="immatriculation" required placeholder="12345-A-6" />
      </div>
      <div>
        <Label htmlFor="vin">VIN</Label>
        <Input id="vin" name="vin" required placeholder="17 caractères" />
      </div>
      <div>
        <Label htmlFor="kilometrage">Kilométrage</Label>
        <Input id="kilometrage" name="kilometrage" type="number" min={0} defaultValue={0} />
      </div>
      <div>
        <Label htmlFor="dateMiseCirculation">Mise en circulation</Label>
        <Input id="dateMiseCirculation" name="dateMiseCirculation" type="date" />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Ajout…" : "Ajouter le véhicule"}
        </Button>
      </div>
    </form>
  );
}
