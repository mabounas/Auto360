import { prisma } from "@/lib/prisma";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { CentresLocator } from "./centres-locator";

export const metadata = {
  title: "Nos centres — Auto360",
  description:
    "Trouvez le point de service le plus proche : recherche par enseigne, par ville, par marque ou selon votre position actuelle.",
};

// Le réseau vient de la base : pas de pré-rendu statique au build.
export const dynamic = "force-dynamic";

export default async function CentresPage() {
  const [compagnies, villes, marques, total, sitesInitiaux] = await Promise.all([
    prisma.compagnie.findMany({
      include: { _count: { select: { sites: true } } },
      orderBy: { nom: "asc" },
    }),
    prisma.site.findMany({ distinct: ["ville"], select: { ville: true }, orderBy: { ville: "asc" } }),
    prisma.marque.findMany({
      where: { sites: { some: {} } },
      select: { nom: true },
      orderBy: { nom: "asc" },
    }),
    prisma.site.count(),
    prisma.site.findMany({
      include: { marques: { include: { marque: true } }, compagnie: true },
      orderBy: [{ ville: "asc" }, { nom: "asc" }],
      take: 50,
    }),
  ]);

  return (
    <div className="flex flex-col">
      <MarketingNav />
      <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
        <span className="mb-2 block text-xs font-semibold tracking-wide text-accent-600 uppercase">
          Localisateur d&apos;ateliers
        </span>
        <h1 className="mb-2 text-3xl font-extrabold text-primary-900">Trouvez votre centre</h1>
        <p className="mb-8 max-w-2xl text-sm text-muted">
          {total} points de service répartis dans {villes.length} villes du Maroc, sur{" "}
          {compagnies.length} enseignes. Choisissez votre enseigne, filtrez par ville ou par
          marque, ou laissez-nous détecter le centre le plus proche de vous.
        </p>
        <CentresLocator
          compagnies={compagnies.map((c) => ({
            code: c.code,
            nom: c.nom,
            description: c.description,
            couleur: c.couleur,
            nbSites: c._count.sites,
          }))}
          villes={villes.map((v) => v.ville)}
          marques={marques.map((m) => m.nom)}
          centresInitiaux={sitesInitiaux.map((s) => ({
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
            compagnie: {
              code: s.compagnie.code,
              nom: s.compagnie.nom,
              couleur: s.compagnie.couleur,
            },
          }))}
        />
      </main>
    </div>
  );
}
