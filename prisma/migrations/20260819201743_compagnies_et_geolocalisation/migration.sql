-- Introduction du niveau "Compagnie" au-dessus des sites.
-- Les sites déjà en base sont rattachés à Auto Hall, seule enseigne exploitée
-- jusqu'ici : on crée donc la compagnie, on ajoute la colonne en nullable, on
-- rétro-remplit, puis on impose la contrainte NOT NULL.

-- CreateTable
CREATE TABLE "Compagnie" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "couleur" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Compagnie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Compagnie_code_key" ON "Compagnie"("code");

-- Compagnie de reprise pour les sites préexistants
INSERT INTO "Compagnie" ("id", "code", "nom", "description", "couleur")
VALUES (
    'cmpgn_autohall_seed',
    'AUTOHALL',
    'Auto Hall',
    'Groupe de distribution multi-marques : Ford, Nissan, Opel, Fiat, Mitsubishi, Chery et véhicules industriels.',
    '#003282'
)
ON CONFLICT ("code") DO NOTHING;

-- AlterTable : ajout en nullable, rétro-remplissage, puis NOT NULL
ALTER TABLE "Site" ADD COLUMN "compagnieId" TEXT;

UPDATE "Site"
SET "compagnieId" = (SELECT "id" FROM "Compagnie" WHERE "code" = 'AUTOHALL')
WHERE "compagnieId" IS NULL;

ALTER TABLE "Site" ALTER COLUMN "compagnieId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Site_compagnieId_idx" ON "Site"("compagnieId");

-- CreateIndex
CREATE INDEX "Site_ville_idx" ON "Site"("ville");

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_compagnieId_fkey" FOREIGN KEY ("compagnieId") REFERENCES "Compagnie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
