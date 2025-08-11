/*
  Warnings:

  - You are about to drop the column `quantidade` on the `producao` table. All the data in the column will be lost.
  - Added the required column `produtividade` to the `producao` table without a default value. This is not possible if the table is not empty.
  - Made the column `telefone` on table `usuario` required. This step will fail if there are existing NULL values in that column.

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
    "produtividade" REAL NOT NULL,
    CONSTRAINT "producao_nomepropriedade_fkey" FOREIGN KEY ("nomepropriedade") REFERENCES "propriedade" ("nomepropriedade") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_producao" ("areaproducao", "cultura", "data", "id", "nomepropriedade", "safra") SELECT "areaproducao", "cultura", "data", "id", "nomepropriedade", "safra" FROM "producao";
DROP TABLE "producao";
ALTER TABLE "new_producao" RENAME TO "producao";
CREATE TABLE "new_usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "fotoperfil" TEXT,
    "senha" TEXT NOT NULL
);
INSERT INTO "new_usuario" ("email", "id", "nome", "senha", "telefone") SELECT "email", "id", "nome", "senha", "telefone" FROM "usuario";
DROP TABLE "usuario";
ALTER TABLE "new_usuario" RENAME TO "usuario";
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");
CREATE UNIQUE INDEX "usuario_telefone_key" ON "usuario"("telefone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
