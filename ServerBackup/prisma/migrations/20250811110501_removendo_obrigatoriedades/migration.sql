-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_propriedade" (
    "nomepropriedade" TEXT NOT NULL PRIMARY KEY,
    "localizacao" TEXT,
    "usuarioId" TEXT NOT NULL,
    "area_ha" INTEGER,
    CONSTRAINT "propriedade_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_propriedade" ("area_ha", "localizacao", "nomepropriedade", "usuarioId") SELECT "area_ha", "localizacao", "nomepropriedade", "usuarioId" FROM "propriedade";
DROP TABLE "propriedade";
ALTER TABLE "new_propriedade" RENAME TO "propriedade";
CREATE UNIQUE INDEX "propriedade_nomepropriedade_key" ON "propriedade"("nomepropriedade");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
