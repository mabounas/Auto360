-- Périmètre de visibilité par enseigne, en complément du rattachement à un site.
--
--   siteId renseigné   → le collaborateur ne voit que ce point de service
--   compagnieId seul   → il voit tous les sites de son enseigne
--   aucun des deux     → administrateur global, toutes enseignes

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "compagnieId" TEXT;

-- CreateIndex
CREATE INDEX "User_compagnieId_idx" ON "User"("compagnieId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_compagnieId_fkey" FOREIGN KEY ("compagnieId") REFERENCES "Compagnie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rétro-remplissage : un collaborateur déjà rattaché à un site appartient à
-- l'enseigne de ce site. Sans cela, il basculerait en administrateur global.
UPDATE "User" u
SET "compagnieId" = s."compagnieId"
FROM "Site" s
WHERE u."siteId" = s."id"
  AND u."compagnieId" IS NULL;
