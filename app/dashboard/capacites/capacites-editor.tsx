"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { definirPositions } from "./actions";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";

type Service = { id: string; nom: string; dureeEstimeeMin: number; positions: number };

export function CapacitesEditor({
  siteId,
  sites,
  services,
}: {
  siteId: string;
  sites: { id: string; label: string }[];
  services: Service[];
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-5">
      {sites.length > 1 && (
        <div className="max-w-md">
          <Label htmlFor="site">Site</Label>
          <Select
            id="site"
            value={siteId}
            onChange={(e) => router.push(`/dashboard/capacites?site=${e.target.value}`)}
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs text-muted uppercase">
            <tr>
              <th className="py-2">Service</th>
              <th className="py-2">Durée d&apos;un créneau</th>
              <th className="py-2">Positions</th>
              <th className="py-2">Capacité par jour</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => {
              // Journée type 08:00-18:00, soit 600 minutes d'ouverture.
              const creneauxParJour = Math.floor(600 / s.dureeEstimeeMin);
              return (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="py-3 font-medium">{s.nom}</td>
                  <td className="py-3 text-muted">{s.dureeEstimeeMin} min</td>
                  <td className="py-3">
                    <form
                      action={(fd) =>
                        startTransition(async () => {
                          await definirPositions(fd);
                          router.refresh();
                        })
                      }
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="siteId" value={siteId} />
                      <input type="hidden" name="serviceTypeId" value={s.id} />
                      <input
                        name="positions"
                        type="number"
                        min={0}
                        max={20}
                        defaultValue={s.positions}
                        className="h-8 w-16 rounded border border-border px-2 text-sm"
                      />
                      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
                        Enregistrer
                      </Button>
                    </form>
                  </td>
                  <td className="py-3 text-muted">
                    {s.positions === 0 ? (
                      <span className="text-warning">Service non proposé</span>
                    ) : (
                      `${creneauxParJour * s.positions} véhicules`
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted">
        Mettre 0 retire le service du site : plus aucun créneau ne sera proposé aux clients pour
        cette prestation.
      </p>
    </div>
  );
}
