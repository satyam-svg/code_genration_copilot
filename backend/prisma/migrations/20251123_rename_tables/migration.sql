-- Rename tables to lowercase
ALTER TABLE "User" RENAME TO "users";
ALTER TABLE "Language" RENAME TO "languages";
ALTER TABLE "Generation" RENAME TO "generations";

-- Rename columns to snake_case
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "generations" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "generations" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "generations" RENAME COLUMN "languageId" TO "language_id";

-- Drop old constraints (they will be recreated with new names automatically)
ALTER TABLE "generations" DROP CONSTRAINT "Generation_userId_fkey";
ALTER TABLE "generations" DROP CONSTRAINT "Generation_languageId_fkey";

-- Add new foreign key constraints with updated column names
ALTER TABLE "generations" ADD CONSTRAINT "generations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "generations" ADD CONSTRAINT "generations_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
