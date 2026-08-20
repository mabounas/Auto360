"use client";

import { useState } from "react";
import { LoaderCircle, ChevronDown } from "lucide-react";
import { COMPTES_DEMO, MOT_DE_PASSE_DEMO } from "@/lib/demo-accounts";

export function DemoAccountsPanel({
  onChoisir,
}: {
  onChoisir: (email: string, motDePasse: string) => Promise<void>;
}) {
  const [ouvert, setOuvert] = useState(true);
  const [enCours, setEnCours] = useState<string | null>(null);

  return (
    <div className="mt-6 rounded-xl border border-dashed border-primary-300 bg-primary-50/50 p-4">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span>
          <span className="text-sm font-semibold text-primary-900">Comptes de démonstration</span>
          <span className="mt-0.5 block text-xs text-muted">
            Connexion en un clic pour parcourir chaque rôle.
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-primary-700 transition-transform ${ouvert ? "rotate-180" : ""}`}
        />
      </button>

      {ouvert && (
        <div className="mt-4 space-y-4">
          {COMPTES_DEMO.map((groupe) => (
            <div key={groupe.groupe}>
              <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-accent-600 uppercase">
                {groupe.groupe}
              </p>
              <div className="grid gap-1.5">
                {groupe.comptes.map((c) => (
                  <button
                    key={c.email}
                    type="button"
                    disabled={enCours !== null}
                    onClick={async () => {
                      setEnCours(c.email);
                      try {
                        await onChoisir(c.email, MOT_DE_PASSE_DEMO);
                      } finally {
                        setEnCours(null);
                      }
                    }}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2 text-left transition-colors hover:border-primary-300 disabled:opacity-60"
                  >
                    <span className="min-w-0">
                      <span className="block text-xs font-medium text-foreground">
                        {c.role} — {c.libelle}
                      </span>
                      <span className="block truncate text-[11px] text-muted">{c.perimetre}</span>
                    </span>
                    {enCours === c.email ? (
                      <LoaderCircle size={14} className="shrink-0 animate-spin text-primary-700" />
                    ) : (
                      <span className="shrink-0 text-[11px] font-medium text-primary-700">
                        Ouvrir
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-[11px] text-muted">
            Tous ces comptes partagent le mot de passe{" "}
            <code className="rounded bg-black/5 px-1">{MOT_DE_PASSE_DEMO}</code>. Panneau réservé
            à la démonstration.
          </p>
        </div>
      )}
    </div>
  );
}
