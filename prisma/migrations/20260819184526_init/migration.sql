-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'CENTRE_APPEL', 'RECEPTIONNAIRE', 'TECHNICIEN', 'CHEF_ATELIER', 'GESTIONNAIRE_PIECES', 'PRICING', 'RESPONSABLE_SAV', 'DIRECTION_GROUPE', 'ADMIN');

-- CreateEnum
CREATE TYPE "TypeClient" AS ENUM ('PARTICULIER', 'ENTREPRISE');

-- CreateEnum
CREATE TYPE "SegmentClient" AS ENUM ('STANDARD', 'VIP', 'FLOTTE', 'RISQUE_CHURN');

-- CreateEnum
CREATE TYPE "PreferenceContact" AS ENUM ('SMS', 'EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "CodeService" AS ENUM ('DIAGNOSTIC', 'ENTRETIEN_REVISION', 'MECANIQUE_ELECTRICITE', 'CLIMATISATION_CONFORT', 'PNEUMATIQUE', 'CARROSSERIE_ESTHETIQUE', 'CONTROLE_TECHNIQUE', 'PIECES_RECHANGE');

-- CreateEnum
CREATE TYPE "StatutRdv" AS ENUM ('CONFIRME', 'LISTE_ATTENTE', 'ANNULE', 'REALISE', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "CanalRdv" AS ENUM ('WEB', 'MOBILE', 'TELEPHONE', 'AGENCE');

-- CreateEnum
CREATE TYPE "MotifVisite" AS ENUM ('ENTRETIEN_PERIODIQUE', 'DIAGNOSTIC_PANNE', 'CARROSSERIE');

-- CreateEnum
CREATE TYPE "EquipeAtelier" AS ENUM ('MECANIQUE_GENERALE', 'REVISION', 'CARROSSERIE');

-- CreateEnum
CREATE TYPE "StatutOR" AS ENUM ('ACCUEIL', 'DIAGNOSTIC_EN_COURS', 'DEVIS_EN_ATTENTE', 'DEVIS_VALIDE', 'EN_REPARATION', 'CONTROLE_QUALITE', 'PRET_RESTITUTION', 'RESTITUE', 'CLOTURE', 'ANNULE');

-- CreateEnum
CREATE TYPE "StatutDevis" AS ENUM ('BROUILLON', 'PUBLIE', 'VALIDE', 'REFUSE');

-- CreateEnum
CREATE TYPE "TypeLigneDevis" AS ENUM ('MAIN_OEUVRE', 'PIECE', 'FORFAIT');

-- CreateEnum
CREATE TYPE "SegmentVehiculeForfait" AS ENUM ('JEUNE', 'AGE_MOYEN', 'ANCIEN');

-- CreateEnum
CREATE TYPE "CategorieForfait" AS ENUM ('ENTRETIEN', 'CARROSSERIE');

-- CreateEnum
CREATE TYPE "StatutReservationPiece" AS ENUM ('RESERVEE', 'UTILISEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('EN_ATTENTE', 'PAYEE', 'PARTIELLEMENT_PAYEE');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('CARTE', 'MOBILE', 'ESPECES', 'VIREMENT', 'ASSURANCE');

-- CreateEnum
CREATE TYPE "StatutReclamation" AS ENUM ('OUVERT', 'EN_COURS', 'RESOLU', 'FERME');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "siteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "typeClient" "TypeClient" NOT NULL DEFAULT 'PARTICULIER',
    "raisonSociale" TEXT,
    "consentementRgpd" BOOLEAN NOT NULL DEFAULT false,
    "segment" "SegmentClient" NOT NULL DEFAULT 'STANDARD',
    "preferenceContact" "PreferenceContact" NOT NULL DEFAULT 'EMAIL',
    "pointsFidelite" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "telephone" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "certifieIso" BOOLEAN NOT NULL DEFAULT false,
    "horaires" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marque" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "Marque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteMarque" (
    "siteId" TEXT NOT NULL,
    "marqueId" TEXT NOT NULL,

    CONSTRAINT "SiteMarque_pkey" PRIMARY KEY ("siteId","marqueId")
);

-- CreateTable
CREATE TABLE "SiteCompteur" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "valeur" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SiteCompteur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicule" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "marqueId" TEXT NOT NULL,
    "modele" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "immatriculation" TEXT NOT NULL,
    "dateMiseCirculation" TIMESTAMP(3),
    "kilometrage" INTEGER NOT NULL DEFAULT 0,
    "garantieFin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceType" (
    "id" TEXT NOT NULL,
    "code" "CodeService" NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "dureeEstimeeMin" INTEGER NOT NULL DEFAULT 60,

    CONSTRAINT "ServiceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisponibiliteConfig" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "serviceTypeId" TEXT NOT NULL,
    "jourSemaine" INTEGER NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "dureeCreneauMin" INTEGER NOT NULL DEFAULT 30,
    "capaciteParCreneau" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "DisponibiliteConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RendezVous" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "vehiculeId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "serviceTypeId" TEXT NOT NULL,
    "dateHeure" TIMESTAMP(3) NOT NULL,
    "statut" "StatutRdv" NOT NULL DEFAULT 'CONFIRME',
    "canal" "CanalRdv" NOT NULL DEFAULT 'WEB',
    "motif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RendezVous_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticRapport" (
    "id" TEXT NOT NULL,
    "ordreReparationId" TEXT NOT NULL,
    "technicienId" TEXT NOT NULL,
    "dateRealisation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mesures" JSONB,
    "anomaliesConstatees" TEXT,
    "piecesARemplacer" TEXT,
    "photosUrls" TEXT[],
    "transmisPricingAt" TIMESTAMP(3),

    CONSTRAINT "DiagnosticRapport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdreReparation" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "vehiculeId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "rendezVousId" TEXT,
    "motifVisite" "MotifVisite" NOT NULL,
    "equipeAtelier" "EquipeAtelier",
    "statut" "StatutOR" NOT NULL DEFAULT 'ACCUEIL',
    "etatDesLieuxPhotos" TEXT[],
    "etatDesLieuxNotes" TEXT,
    "creneauRestitution" TIMESTAMP(3),
    "chefEquipeId" TEXT,
    "controleQualiteOk" BOOLEAN,
    "controleQualiteNote" TEXT,
    "sinistre" BOOLEAN NOT NULL DEFAULT false,
    "compagnieAssurance" TEXT,
    "numeroSinistre" TEXT,
    "statutExpertise" TEXT,
    "dateExpertise" TIMESTAMP(3),
    "repartitionAssurancePct" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clotureAt" TIMESTAMP(3),

    CONSTRAINT "OrdreReparation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneIntervention" (
    "id" TEXT NOT NULL,
    "ordreReparationId" TEXT NOT NULL,
    "technicienId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tempsPasseMin" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LigneIntervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Devis" (
    "id" TEXT NOT NULL,
    "ordreReparationId" TEXT NOT NULL,
    "statut" "StatutDevis" NOT NULL DEFAULT 'BROUILLON',
    "creeParId" TEXT NOT NULL,
    "montantHT" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "montantTTC" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "publieAt" TIMESTAMP(3),
    "validationClientAt" TIMESTAMP(3),
    "refuseAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Devis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevisLigne" (
    "id" TEXT NOT NULL,
    "devisId" TEXT NOT NULL,
    "type" "TypeLigneDevis" NOT NULL,
    "designation" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "prixUnitaireHT" DECIMAL(10,2) NOT NULL,
    "tauxTva" DECIMAL(4,2) NOT NULL DEFAULT 20,
    "forfaitId" TEXT,
    "pieceId" TEXT,

    CONSTRAINT "DevisLigne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Forfait" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "prixFixeHT" DECIMAL(10,2) NOT NULL,
    "segmentVehicule" "SegmentVehiculeForfait",
    "categorie" "CategorieForfait" NOT NULL,
    "serviceTypeId" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Forfait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Piece" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "categorie" TEXT,
    "prixHT" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "Piece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockPiece" (
    "id" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "quantiteDisponible" INTEGER NOT NULL DEFAULT 0,
    "seuilAlerte" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "StockPiece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationPiece" (
    "id" TEXT NOT NULL,
    "ordreReparationId" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "statut" "StatutReservationPiece" NOT NULL DEFAULT 'RESERVEE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationPiece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facture" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "ordreReparationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "montantHT" DECIMAL(10,2) NOT NULL,
    "montantTTC" DECIMAL(10,2) NOT NULL,
    "statutPaiement" "StatutPaiement" NOT NULL DEFAULT 'EN_ATTENTE',
    "modePaiement" "ModePaiement",
    "datePaiement" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Facture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reclamation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "ordreReparationId" TEXT,
    "siteId" TEXT,
    "motif" TEXT NOT NULL,
    "description" TEXT,
    "canal" "CanalRdv" NOT NULL DEFAULT 'WEB',
    "statut" "StatutReclamation" NOT NULL DEFAULT 'OUVERT',
    "slaEcheance" TIMESTAMP(3),
    "assigneAId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resoluAt" TIMESTAMP(3),

    CONSTRAINT "Reclamation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnqueteSatisfaction" (
    "id" TEXT NOT NULL,
    "ordreReparationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "npsScore" INTEGER,
    "csatScore" INTEGER,
    "commentaire" TEXT,
    "envoyeeAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reponduAt" TIMESTAMP(3),

    CONSTRAINT "EnqueteSatisfaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvisClient" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "note" INTEGER NOT NULL,
    "commentaire" TEXT,
    "verifie" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvisClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RappelConstructeur" (
    "id" TEXT NOT NULL,
    "marqueId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "criteres" JSONB,
    "dateDebut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RappelConstructeur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehiculeRappelConcerne" (
    "id" TEXT NOT NULL,
    "rappelId" TEXT NOT NULL,
    "vehiculeId" TEXT NOT NULL,
    "notifieAt" TIMESTAMP(3),
    "traiteAt" TIMESTAMP(3),

    CONSTRAINT "VehiculeRappelConcerne_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_siteId_idx" ON "User"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientProfile_userId_key" ON "ClientProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Site_code_key" ON "Site"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Marque_nom_key" ON "Marque"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "SiteCompteur_siteId_type_key" ON "SiteCompteur"("siteId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicule_vin_key" ON "Vehicule"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicule_immatriculation_key" ON "Vehicule"("immatriculation");

-- CreateIndex
CREATE INDEX "Vehicule_clientId_idx" ON "Vehicule"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceType_code_key" ON "ServiceType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DisponibiliteConfig_siteId_serviceTypeId_jourSemaine_key" ON "DisponibiliteConfig"("siteId", "serviceTypeId", "jourSemaine");

-- CreateIndex
CREATE INDEX "RendezVous_siteId_serviceTypeId_dateHeure_idx" ON "RendezVous"("siteId", "serviceTypeId", "dateHeure");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticRapport_ordreReparationId_key" ON "DiagnosticRapport"("ordreReparationId");

-- CreateIndex
CREATE INDEX "DiagnosticRapport_technicienId_idx" ON "DiagnosticRapport"("technicienId");

-- CreateIndex
CREATE UNIQUE INDEX "OrdreReparation_numero_key" ON "OrdreReparation"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "OrdreReparation_rendezVousId_key" ON "OrdreReparation"("rendezVousId");

-- CreateIndex
CREATE INDEX "OrdreReparation_siteId_statut_idx" ON "OrdreReparation"("siteId", "statut");

-- CreateIndex
CREATE INDEX "OrdreReparation_clientId_idx" ON "OrdreReparation"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Devis_ordreReparationId_key" ON "Devis"("ordreReparationId");

-- CreateIndex
CREATE UNIQUE INDEX "Piece_reference_key" ON "Piece"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "StockPiece_pieceId_siteId_key" ON "StockPiece"("pieceId", "siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Facture_numero_key" ON "Facture"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Facture_ordreReparationId_key" ON "Facture"("ordreReparationId");

-- CreateIndex
CREATE UNIQUE INDEX "EnqueteSatisfaction_ordreReparationId_key" ON "EnqueteSatisfaction"("ordreReparationId");

-- CreateIndex
CREATE UNIQUE INDEX "VehiculeRappelConcerne_rappelId_vehiculeId_key" ON "VehiculeRappelConcerne"("rappelId", "vehiculeId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteMarque" ADD CONSTRAINT "SiteMarque_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteMarque" ADD CONSTRAINT "SiteMarque_marqueId_fkey" FOREIGN KEY ("marqueId") REFERENCES "Marque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteCompteur" ADD CONSTRAINT "SiteCompteur_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicule" ADD CONSTRAINT "Vehicule_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicule" ADD CONSTRAINT "Vehicule_marqueId_fkey" FOREIGN KEY ("marqueId") REFERENCES "Marque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisponibiliteConfig" ADD CONSTRAINT "DisponibiliteConfig_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisponibiliteConfig" ADD CONSTRAINT "DisponibiliteConfig_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendezVous" ADD CONSTRAINT "RendezVous_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendezVous" ADD CONSTRAINT "RendezVous_vehiculeId_fkey" FOREIGN KEY ("vehiculeId") REFERENCES "Vehicule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendezVous" ADD CONSTRAINT "RendezVous_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendezVous" ADD CONSTRAINT "RendezVous_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticRapport" ADD CONSTRAINT "DiagnosticRapport_ordreReparationId_fkey" FOREIGN KEY ("ordreReparationId") REFERENCES "OrdreReparation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticRapport" ADD CONSTRAINT "DiagnosticRapport_technicienId_fkey" FOREIGN KEY ("technicienId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdreReparation" ADD CONSTRAINT "OrdreReparation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdreReparation" ADD CONSTRAINT "OrdreReparation_vehiculeId_fkey" FOREIGN KEY ("vehiculeId") REFERENCES "Vehicule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdreReparation" ADD CONSTRAINT "OrdreReparation_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdreReparation" ADD CONSTRAINT "OrdreReparation_rendezVousId_fkey" FOREIGN KEY ("rendezVousId") REFERENCES "RendezVous"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdreReparation" ADD CONSTRAINT "OrdreReparation_chefEquipeId_fkey" FOREIGN KEY ("chefEquipeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneIntervention" ADD CONSTRAINT "LigneIntervention_ordreReparationId_fkey" FOREIGN KEY ("ordreReparationId") REFERENCES "OrdreReparation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneIntervention" ADD CONSTRAINT "LigneIntervention_technicienId_fkey" FOREIGN KEY ("technicienId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_ordreReparationId_fkey" FOREIGN KEY ("ordreReparationId") REFERENCES "OrdreReparation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevisLigne" ADD CONSTRAINT "DevisLigne_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevisLigne" ADD CONSTRAINT "DevisLigne_forfaitId_fkey" FOREIGN KEY ("forfaitId") REFERENCES "Forfait"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevisLigne" ADD CONSTRAINT "DevisLigne_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "Piece"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Forfait" ADD CONSTRAINT "Forfait_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockPiece" ADD CONSTRAINT "StockPiece_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "Piece"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockPiece" ADD CONSTRAINT "StockPiece_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationPiece" ADD CONSTRAINT "ReservationPiece_ordreReparationId_fkey" FOREIGN KEY ("ordreReparationId") REFERENCES "OrdreReparation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationPiece" ADD CONSTRAINT "ReservationPiece_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "Piece"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_ordreReparationId_fkey" FOREIGN KEY ("ordreReparationId") REFERENCES "OrdreReparation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reclamation" ADD CONSTRAINT "Reclamation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reclamation" ADD CONSTRAINT "Reclamation_ordreReparationId_fkey" FOREIGN KEY ("ordreReparationId") REFERENCES "OrdreReparation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reclamation" ADD CONSTRAINT "Reclamation_assigneAId_fkey" FOREIGN KEY ("assigneAId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnqueteSatisfaction" ADD CONSTRAINT "EnqueteSatisfaction_ordreReparationId_fkey" FOREIGN KEY ("ordreReparationId") REFERENCES "OrdreReparation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnqueteSatisfaction" ADD CONSTRAINT "EnqueteSatisfaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvisClient" ADD CONSTRAINT "AvisClient_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvisClient" ADD CONSTRAINT "AvisClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RappelConstructeur" ADD CONSTRAINT "RappelConstructeur_marqueId_fkey" FOREIGN KEY ("marqueId") REFERENCES "Marque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiculeRappelConcerne" ADD CONSTRAINT "VehiculeRappelConcerne_rappelId_fkey" FOREIGN KEY ("rappelId") REFERENCES "RappelConstructeur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiculeRappelConcerne" ADD CONSTRAINT "VehiculeRappelConcerne_vehiculeId_fkey" FOREIGN KEY ("vehiculeId") REFERENCES "Vehicule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
