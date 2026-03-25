import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const initChatSchema = async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ChatSession" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL DEFAULT 'New chat',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ChatMessage" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "chatId" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "meta" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ChatMessage_chatId_fkey"
        FOREIGN KEY ("chatId") REFERENCES "ChatSession" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "ChatMessage_chatId_createdAt_idx" ON "ChatMessage"("chatId","createdAt");`
  );

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ChatSummary" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "chatId" TEXT NOT NULL UNIQUE,
      "summary" TEXT NOT NULL,
      "sourceMessageCount" INTEGER NOT NULL DEFAULT 0,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ChatSummary_chatId_fkey"
        FOREIGN KEY ("chatId") REFERENCES "ChatSession" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
};
