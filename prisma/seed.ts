import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  Role,
  TypeClient,
  SegmentClient,
  CodeService,
  CategorieForfait,
  SegmentVehiculeForfait,
} from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";
import { COMPAGNIES, TOUTES_LES_MARQUES } from "./data/compagnies";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log("Seed Auto360 — démarrage…");

  // --- Marques (réelles, dérivées des réseaux chargés) ------------------
  const marqueParNom = new Map<string, { id: string }>();
  for (const nom of TOUTES_LES_MARQUES) {
    const m = await prisma.marque.upsert({ where: { nom }, create: { nom }, update: {} });
    marqueParNom.set(nom, m);
  }

  // --- Compagnies et leurs points de service, avec coordonnées GPS ------
  const sites: { id: string; code: string }[] = [];
  for (const c of COMPAGNIES) {
    const compagnie = await prisma.compagnie.upsert({
      where: { code: c.code },
      create: { code: c.code, nom: c.nom, description: c.description, couleur: c.couleur },
      update: { nom: c.nom, description: c.description, couleur: c.couleur },
    });

    for (const s of c.sites) {
      const site = await prisma.site.upsert({
        where: { code: s.code },
        create: {
          code: s.code,
          compagnieId: compagnie.id,
          nom: s.nom,
          ville: s.ville,
          adresse: s.adresse,
          telephone: s.telephone,
          latitude: s.latitude,
          longitude: s.longitude,
          certifieIso: c.code === "AUTOHALL",
          horaires: { "lun-ven": "08:00-18:00", sam: "09:00-13:00" },
        },
        update: {
          compagnieId: compagnie.id,
          nom: s.nom,
          ville: s.ville,
          adresse: s.adresse,
          telephone: s.telephone,
          latitude: s.latitude,
          longitude: s.longitude,
        },
      });
      sites.push(site);

      for (const nomMarque of s.marques) {
        const marque = marqueParNom.get(nomMarque);
        if (!marque) continue;
        await prisma.siteMarque.upsert({
          where: { siteId_marqueId: { siteId: site.id, marqueId: marque.id } },
          create: { siteId: site.id, marqueId: marque.id },
          update: {},
        });
      }
    }
    console.log(`  ${c.nom} : ${c.sites.length} points de service`);
  }

  // Le référentiel réseau fait autorité : on retire les sites hérités d'un jeu de
  // démonstration antérieur, sauf s'ils portent déjà des dossiers atelier.
  const codesConnus = COMPAGNIES.flatMap((c) => c.sites.map((s) => s.code));
  const obsoletes = await prisma.site.findMany({
    where: { code: { notIn: codesConnus } },
    include: { _count: { select: { ordresReparation: true, rendezVous: true } } },
  });
  for (const site of obsoletes) {
    if (site._count.ordresReparation > 0 || site._count.rendezVous > 0) {
      console.log(`  ↷ ${site.code} conservé (dossiers existants)`);
      continue;
    }
    await prisma.site.delete({ where: { id: site.id } });
    console.log(`  ✕ ${site.code} supprimé (site de démonstration obsolète)`);
  }

  // Marques devenues orphelines après nettoyage
  const orphelines = await prisma.marque.deleteMany({
    where: { sites: { none: {} }, vehicules: { none: {} } },
  });
  if (orphelines.count > 0) console.log(`  ✕ ${orphelines.count} marque(s) sans site supprimée(s)`);

  // --- Options de service ----------------------------------------------
  // `positions` = nombre de postes de travail (baies, ponts, agents) que le site
  // affecte à ce service. C'est ce qui détermine combien de véhicules peuvent être
  // pris en charge simultanément sur un même créneau horaire.
  const serviceDefs: {
    code: CodeService;
    nom: string;
    description: string;
    duree: number;
    positions: number;
  }[] = [
    { code: CodeService.DIAGNOSTIC, nom: "Diagnostic panne", description: "Diagnostic électronique multi-points.", duree: 45, positions: 2 },
    { code: CodeService.ENTRETIEN_REVISION, nom: "Entretien / révision", description: "Vidange, filtres, révisions périodiques.", duree: 60, positions: 3 },
    { code: CodeService.MECANIQUE_ELECTRICITE, nom: "Mécanique / électricité", description: "Freins, embrayage, distribution, électrique.", duree: 90, positions: 3 },
    { code: CodeService.CLIMATISATION_CONFORT, nom: "Climatisation & confort", description: "Recharge clim, contrôle d'étanchéité.", duree: 45, positions: 1 },
    { code: CodeService.PNEUMATIQUE, nom: "Pneumatique", description: "Montage, équilibrage, remplacement pneus.", duree: 30, positions: 2 },
    { code: CodeService.CARROSSERIE_ESTHETIQUE, nom: "Carrosserie / esthétique", description: "Chocs, débosselage, peinture.", duree: 180, positions: 1 },
    { code: CodeService.CONTROLE_TECHNIQUE, nom: "Contrôle technique", description: "Préparation au contrôle technique.", duree: 30, positions: 2 },
    { code: CodeService.PIECES_RECHANGE, nom: "Pièces de rechange", description: "Retrait / commande de pièces.", duree: 15, positions: 4 },
  ];
  const positionsParService = new Map(serviceDefs.map((s) => [s.code, s.positions]));
  const services: { id: string; code: CodeService; dureeEstimeeMin: number }[] = [];
  for (const s of serviceDefs) {
    const st = await prisma.serviceType.upsert({
      where: { code: s.code },
      create: { code: s.code, nom: s.nom, description: s.description, dureeEstimeeMin: s.duree },
      update: {},
    });
    services.push(st);
  }

  // --- Disponibilités (lun-sam, 08:00-18:00, capacité variable) ---------
  // Un insert groupé plutôt que ~3000 upserts séquentiels : sur une base distante,
  // la latence réseau dominait complètement le temps d'exécution du seed.
  const disponibilites = sites.flatMap((site) =>
    services.flatMap((service) =>
      [1, 2, 3, 4, 5, 6].map((jour) => ({
        siteId: site.id,
        serviceTypeId: service.id,
        jourSemaine: jour,
        heureDebut: "08:00",
        heureFin: jour === 6 ? "13:00" : "18:00",
        dureeCreneauMin: service.dureeEstimeeMin,
        capaciteParCreneau: positionsParService.get(service.code) ?? 1,
      }))
    )
  );
  const { count: nbDispos } = await prisma.disponibiliteConfig.createMany({
    data: disponibilites,
    skipDuplicates: true,
  });
  if (nbDispos > 0) console.log(`  ${nbDispos} créneaux de disponibilité créés`);

  // `createMany` ignore les lignes déjà présentes : sans cette passe, une évolution du
  // nombre de positions ne s'appliquerait qu'aux nouveaux sites. On réaligne donc
  // explicitement chaque service, sur tous les sites.
  for (const service of services) {
    const positions = positionsParService.get(service.code) ?? 1;
    const { count } = await prisma.disponibiliteConfig.updateMany({
      where: { serviceTypeId: service.id },
      data: { capaciteParCreneau: positions, dureeCreneauMin: service.dureeEstimeeMin },
    });
    console.log(`  ${service.code} : ${positions} position(s) — ${count} configurations alignées`);
  }

  // --- Forfaits Best-Cost -------------------------------------------
  const forfaitsData = [
    { nom: "Forfait Best-Cost Jeune", description: "Révision complète véhicule < 3 ans", prix: 890, segment: SegmentVehiculeForfait.JEUNE, cat: CategorieForfait.ENTRETIEN, service: CodeService.ENTRETIEN_REVISION },
    { nom: "Forfait Best-Cost Âge moyen", description: "Révision complète véhicule 3-7 ans", prix: 1190, segment: SegmentVehiculeForfait.AGE_MOYEN, cat: CategorieForfait.ENTRETIEN, service: CodeService.ENTRETIEN_REVISION },
    { nom: "Forfait Best-Cost Ancien", description: "Révision complète véhicule > 7 ans", prix: 1490, segment: SegmentVehiculeForfait.ANCIEN, cat: CategorieForfait.ENTRETIEN, service: CodeService.ENTRETIEN_REVISION },
    { nom: "Forfait Carrosserie Rapide", description: "Débosselage + retouche peinture, éléments standards", prix: 1990, segment: null, cat: CategorieForfait.CARROSSERIE, service: CodeService.CARROSSERIE_ESTHETIQUE },
  ];
  for (const f of forfaitsData) {
    const service = services.find((s) => s.code === f.service)!;
    const exists = await prisma.forfait.findFirst({ where: { nom: f.nom } });
    if (!exists) {
      await prisma.forfait.create({
        data: {
          nom: f.nom,
          description: f.description,
          prixFixeHT: f.prix,
          segmentVehicule: f.segment,
          categorie: f.cat,
          serviceTypeId: service.id,
        },
      });
    }
  }

  // --- Catalogue pièces + stock ---------------------------------------
  const piecesData = [
    { ref: "FLT-HUI-001", nom: "Filtre à huile", prix: 65 },
    { ref: "FLT-AIR-001", nom: "Filtre à air", prix: 95 },
    { ref: "HUI-5W30-05", nom: "Huile moteur 5W30 (5L)", prix: 380 },
    { ref: "PLQ-FRN-AV", nom: "Plaquettes de frein avant", prix: 320 },
    { ref: "PNE-19565R15", nom: "Pneu 195/65 R15", prix: 780 },
    { ref: "BAT-60AH", nom: "Batterie 60Ah", prix: 950 },
    { ref: "AMO-AV-STD", nom: "Amortisseur avant standard", prix: 610 },
  ];
  const pieces = [];
  for (const p of piecesData) {
    const piece = await prisma.piece.upsert({
      where: { reference: p.ref },
      create: { reference: p.ref, designation: p.nom, prixHT: p.prix, categorie: "Pièces d'usure" },
      update: {},
    });
    pieces.push(piece);
  }

  // Stock initial identique sur tous les points de service (insert groupé, cf. ci-dessus)
  await prisma.stockPiece.createMany({
    data: pieces.flatMap((piece) =>
      sites.map((site) => ({
        pieceId: piece.id,
        siteId: site.id,
        quantiteDisponible: 15,
        seuilAlerte: 3,
      }))
    ),
    skipDuplicates: true,
  });

  // --- Utilisateurs staff -----------------------------------------------
  // Le périmètre découle de l'affectation, pas du rôle :
  //   siteId     → le collaborateur ne voit que ce point de service
  //   compagnieId→ il voit toute son enseigne
  //   aucun      → administrateur global, toutes enseignes confondues
  const staffPw = await hash("Passw0rd!");

  const autoHall = await prisma.compagnie.findUniqueOrThrow({ where: { code: "AUTOHALL" } });
  const renault = await prisma.compagnie.findUniqueOrThrow({ where: { code: "RENAULT" } });

  // Deux agences Auto Hall distinctes, pour démontrer le cloisonnement entre sites.
  const casa1 = await prisma.site.findUniqueOrThrow({ where: { code: "CASA01" } });
  const casa2 = await prisma.site.findUniqueOrThrow({ where: { code: "CASA02" } });
  const renaultCasa = await prisma.site.findUniqueOrThrow({ where: { code: "RNL-CASA01" } });

  const staffUsers: {
    email: string;
    role: Role;
    nom: string;
    prenom: string;
    siteId?: string;
    compagnieId?: string;
  }[] = [
    // Administration globale — voit toutes les enseignes
    { email: "admin@auto360.ma", role: Role.ADMIN, nom: "Admin", prenom: "Auto360" },

    // Administration au niveau d'une enseigne — voit tous ses sites, pas les concurrents
    { email: "direction@auto360.ma", role: Role.DIRECTION_GROUPE, nom: "Bennani", prenom: "Yassine", compagnieId: autoHall.id },
    { email: "admin.autohall@auto360.ma", role: Role.ADMIN, nom: "Sekkat", prenom: "Leila", compagnieId: autoHall.id },
    { email: "direction.renault@auto360.ma", role: Role.DIRECTION_GROUPE, nom: "Berrada", prenom: "Mehdi", compagnieId: renault.id },
    { email: "centreappel@auto360.ma", role: Role.CENTRE_APPEL, nom: "Idrissi", prenom: "Salma", compagnieId: autoHall.id },

    // Agence Auto Hall n°1 (Lalla Yacout) — ne voit que ce site
    { email: "sav.casa@auto360.ma", role: Role.RESPONSABLE_SAV, nom: "Amrani", prenom: "Karim", siteId: casa1.id, compagnieId: autoHall.id },
    { email: "accueil.casa@auto360.ma", role: Role.RECEPTIONNAIRE, nom: "El Fassi", prenom: "Nadia", siteId: casa1.id, compagnieId: autoHall.id },
    { email: "chefatelier.casa@auto360.ma", role: Role.CHEF_ATELIER, nom: "Tazi", prenom: "Hicham", siteId: casa1.id, compagnieId: autoHall.id },
    { email: "technicien.casa@auto360.ma", role: Role.TECHNICIEN, nom: "Benjelloun", prenom: "Omar", siteId: casa1.id, compagnieId: autoHall.id },
    { email: "pieces.casa@auto360.ma", role: Role.GESTIONNAIRE_PIECES, nom: "Chraibi", prenom: "Rania", siteId: casa1.id, compagnieId: autoHall.id },
    { email: "pricing.casa@auto360.ma", role: Role.PRICING, nom: "Ouazzani", prenom: "Sara", siteId: casa1.id, compagnieId: autoHall.id },

    // Agence Auto Hall n°2 (Siège) — cloisonnée de la n°1
    { email: "sav.siege@auto360.ma", role: Role.RESPONSABLE_SAV, nom: "Alaoui", prenom: "Nabil", siteId: casa2.id, compagnieId: autoHall.id },
    { email: "accueil.siege@auto360.ma", role: Role.RECEPTIONNAIRE, nom: "Bouzidi", prenom: "Imane", siteId: casa2.id, compagnieId: autoHall.id },

    // Agence Renault — autre enseigne
    { email: "sav.renault@auto360.ma", role: Role.RESPONSABLE_SAV, nom: "Cherkaoui", prenom: "Anas", siteId: renaultCasa.id, compagnieId: renault.id },
  ];

  for (const u of staffUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      create: { ...u, passwordHash: staffPw, telephone: "+212 6 00 00 00 00" },
      // Le périmètre est réaligné à chaque seed : c'est le référentiel qui fait foi.
      update: { siteId: u.siteId ?? null, compagnieId: u.compagnieId ?? null, role: u.role },
    });
  }

  // --- Client de démo + véhicule ---------------------------------------
  const clientPw = await hash("Passw0rd!");
  const clientUser = await prisma.user.upsert({
    where: { email: "client@auto360.ma" },
    create: {
      email: "client@auto360.ma",
      passwordHash: clientPw,
      role: Role.CLIENT,
      nom: "Mansouri",
      prenom: "Youssef",
      telephone: "+212 6 61 23 45 67",
      clientProfile: {
        create: {
          typeClient: TypeClient.PARTICULIER,
          consentementRgpd: true,
          segment: SegmentClient.STANDARD,
        },
      },
    },
    update: {},
    include: { clientProfile: true },
  });

  let clientProfile = clientUser.clientProfile;
  if (!clientProfile) {
    clientProfile = await prisma.clientProfile.create({
      data: { userId: clientUser.id, typeClient: TypeClient.PARTICULIER, consentementRgpd: true },
    });
  }

  const ford = marqueParNom.get("Ford")!;
  await prisma.vehicule.upsert({
    where: { vin: "VF1RJA00012345678" },
    create: {
      clientId: clientProfile.id,
      marqueId: ford.id,
      modele: "Focus",
      vin: "VF1RJA00012345678",
      immatriculation: "12345-A-6",
      dateMiseCirculation: new Date("2022-03-15"),
      kilometrage: 34500,
      garantieFin: new Date("2027-03-15"),
    },
    update: {},
  });

  console.log("\nSeed terminé. Comptes de démo (mot de passe: Passw0rd!) :");
  console.log("\n  Périmètre global (toutes enseignes)");
  console.log("    admin@auto360.ma              — Administrateur global");
  console.log("\n  Périmètre enseigne");
  console.log("    admin.autohall@auto360.ma     — Admin Auto Hall (tous ses sites)");
  console.log("    direction@auto360.ma          — Direction Auto Hall");
  console.log("    direction.renault@auto360.ma  — Direction Renault Maroc");
  console.log("    centreappel@auto360.ma        — Centre d'appel Auto Hall");
  console.log("\n  Périmètre site — Auto Hall Lalla Yacout (agence 1)");
  console.log("    sav.casa@auto360.ma           — Responsable SAV");
  console.log("    accueil.casa@auto360.ma       — Réceptionnaire");
  console.log("    chefatelier.casa@auto360.ma   — Chef d'atelier");
  console.log("    technicien.casa@auto360.ma    — Technicien");
  console.log("    pieces.casa@auto360.ma        — Gestionnaire pièces");
  console.log("    pricing.casa@auto360.ma       — Pricing / chiffrage");
  console.log("\n  Périmètre site — Auto Hall Siège (agence 2)");
  console.log("    sav.siege@auto360.ma          — Responsable SAV");
  console.log("    accueil.siege@auto360.ma      — Réceptionnaire");
  console.log("\n  Périmètre site — Renault Casablanca");
  console.log("    sav.renault@auto360.ma        — Responsable SAV");
  console.log("\n  Client");
  console.log("    client@auto360.ma             — Youssef Mansouri");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
