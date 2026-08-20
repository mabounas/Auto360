"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Trash2, LoaderCircle } from "lucide-react";
import { ajouterPhotosEtatDesLieux, retirerPhotoEtatDesLieux } from "../actions";
import { Button } from "@/components/ui/button";

export function PhotosEtatDesLieux({
  ordreReparationId,
  photos,
  peutModifier,
}: {
  ordreReparationId: string;
  photos: string[];
  peutModifier: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function envoyer(fichiers: FileList) {
    setErreur(null);
    setEnvoiEnCours(true);
    const urls: string[] = [];

    try {
      for (const fichier of Array.from(fichiers)) {
        const fd = new FormData();
        fd.set("fichier", fichier);
        fd.set("dossier", `etat-des-lieux/${ordreReparationId}`);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Envoi impossible.");
        urls.push(data.url);
      }

      const fd = new FormData();
      fd.set("ordreReparationId", ordreReparationId);
      for (const u of urls) fd.append("urls", u);
      await ajouterPhotosEtatDesLieux(fd);
      router.refresh();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      setEnvoiEnCours(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((url) => (
            <figure key={url} className="group relative overflow-hidden rounded-lg border border-border">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={url}
                    alt="Photo d'état des lieux du véhicule"
                    fill
                    sizes="(max-width: 640px) 50vw, 200px"
                    className="object-cover"
                  />
                </div>
              </a>
              {peutModifier && (
                <form
                  action={(fd) =>
                    startTransition(async () => {
                      await retirerPhotoEtatDesLieux(fd);
                      router.refresh();
                    })
                  }
                  className="absolute top-1 right-1"
                >
                  <input type="hidden" name="ordreReparationId" value={ordreReparationId} />
                  <input type="hidden" name="url" value={url} />
                  <button
                    type="submit"
                    disabled={pending}
                    aria-label="Retirer cette photo"
                    className="grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>
                </form>
              )}
            </figure>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">
          Aucune photo. Photographiez les rayures, chocs ou anomalies constatés à l&apos;arrivée du
          véhicule : c&apos;est la seule preuve en cas de contestation à la restitution.
        </p>
      )}

      {peutModifier && (
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.length && envoyer(e.target.files)}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={envoiEnCours}
            onClick={() => inputRef.current?.click()}
          >
            {envoiEnCours ? (
              <>
                <LoaderCircle size={15} className="animate-spin" /> Envoi…
              </>
            ) : (
              <>
                <Camera size={15} /> Ajouter des photos
              </>
            )}
          </Button>
          {erreur && <p className="text-xs text-danger">{erreur}</p>}
        </div>
      )}
    </div>
  );
}
