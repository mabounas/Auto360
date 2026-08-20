import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/session";
import { Role } from "@/app/generated/prisma/client";
import { oneOf } from "@/lib/utils";

const TAILLE_MAX = 8 * 1024 * 1024; // 8 Mo — largement suffisant pour une photo de téléphone
const TYPES_ACCEPTES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

// Dépôt des photos d'état des lieux et de diagnostic. Réservé au personnel : un
// client ne doit pas pouvoir alimenter le dossier atelier de son propre véhicule.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (
    !session ||
    !oneOf(
      session.role,
      Role.RECEPTIONNAIRE,
      Role.TECHNICIEN,
      Role.CHEF_ATELIER,
      Role.RESPONSABLE_SAV,
      Role.ADMIN
    )
  ) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Stockage des photos non configuré sur cet environnement." },
      { status: 503 }
    );
  }

  const formData = await req.formData();
  const fichier = formData.get("fichier");
  const dossier = String(formData.get("dossier") ?? "divers");

  if (!(fichier instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }
  if (!TYPES_ACCEPTES.includes(fichier.type)) {
    return NextResponse.json(
      { error: "Format non accepté : utilisez une photo JPEG, PNG ou WebP." },
      { status: 400 }
    );
  }
  if (fichier.size > TAILLE_MAX) {
    return NextResponse.json({ error: "Photo trop volumineuse (8 Mo maximum)." }, { status: 400 });
  }

  // `addRandomSuffix` rend l'URL non devinable : le magasin est public, seule
  // l'ignorance de l'URL protège la photo. Pour un usage réel avec des données
  // personnelles, basculer le magasin en privé et servir des URL signées.
  const blob = await put(`${dossier}/${fichier.name}`, fichier, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ url: blob.url });
}
