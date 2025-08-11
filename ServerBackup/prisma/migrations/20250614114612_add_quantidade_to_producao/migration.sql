/*
  Warnings:

  - Added the required column `quantidade` to the `producao` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_producao" (
    "safra" TEXT NOT NULL,
    "areaproducao" REAL NOT NULL,
    "data" DATETIME NOT NULL,
    "nomepropriedade" TEXT NOT NULL,
    "cultura" TEXT NOT NULL,
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quantidade" REAL NOT NULL,
    CONSTRAINT "producao_nomepropriedade_fkey" FOREIGN KEY ("nomepropriedade") REFERENCES "propriedade" ("nomepropriedade") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_producao" ("areaproducao", "cultura", "data", "id", "nomepropriedade", "safra") SELECT "areaproducao", "cultura", "data", "id", "nomepropriedade", "safra" FROM "producao";
DROP TABLE "producao";
ALTER TABLE "new_producao" RENAME TO "producao";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
