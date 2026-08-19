import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { trierParDistance } from "@/lib/geo";

// Localisateur d'ateliers (§4.14). Deux modes :
//   ?ville=Casablanca        → filtre par ville
//   ?lat=33.59&lng=-7.61     → tri par proximité de la position du client
// Les deux peuvent se combiner ; `rayon` (km) borne éventuellement les résultats.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const compagnie = searchParams.get("compagnie")?.trim();
  const ville = searchParams.get("ville")?.trim();
  const marque = searchParams.get("marque")?.trim();
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const rayon = searchParams.get("rayon");
  const limite = Math.min(Number(searchParams.get("limite") ?? 50), 100);

  const sites = await prisma.site.findMany({
    where: {
      ...(compagnie ? { compagnie: { code: compagnie } } : {}),
      ...(ville ? { ville: { contains: ville, mode: "insensitive" } } : {}),
      ...(marque ? { marques: { some: { marque: { nom: { equals: marque, mode: "insensitive" } } } } } : {}),
    },
    include: { marques: { include: { marque: true } }, compagnie: true },
    orderBy: [{ ville: "asc" }, { nom: "asc" }],
  });

  const format = (s: (typeof sites)[number]) => ({
    id: s.id,
    code: s.code,
    nom: s.nom,
    ville: s.ville,
    adresse: s.adresse,
    telephone: s.telephone,
    latitude: s.latitude,
    longitude: s.longitude,
    certifieIso: s.certifieIso,
    marques: s.marques.map((m) => m.marque.nom),
    compagnie: { code: s.compagnie.code, nom: s.compagnie.nom, couleur: s.compagnie.couleur },
  });

  if (lat && lng) {
    const latN = Number(lat);
    const lngN = Number(lng);
    if (Number.isNaN(latN) || Number.isNaN(lngN)) {
      return NextResponse.json({ error: "Coordonnées invalides." }, { status: 400 });
    }
    let classes = trierParDistance(sites.map(format), latN, lngN);
    if (rayon) {
      const rayonN = Number(rayon);
      classes = classes.filter((s) => s.distanceKm != null && s.distanceKm <= rayonN);
    }
    return NextResponse.json({ centres: classes.slice(0, limite), triePar: "distance" });
  }

  return NextResponse.json({ centres: sites.slice(0, limite).map(format), triePar: "ville" });
}
