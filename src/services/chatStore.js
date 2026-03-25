import crypto from "node:crypto";
import { prisma } from "../db/prisma.js";

export const createChatSession = async (title = "New chat") => {
  return prisma.chatSession.create({
    data: { title }
  });
};

export const ensureChatSession = async (chatId) => {
  if (!chatId) {
    return createChatSession();
  }

  const existing = await prisma.chatSession.findUnique({
    where: { id: chatId }
  });

  if (existing) return existing;

  return prisma.chatSession.create({
    data: {
      id: chatId,
      title: "New chat"
    }
  });
};

export const listChatSessions = async (view = "active") => {
  const normalizedView =
    view === "archived" || view === "all" ? view : "active";
  const whereClause =
    normalizedView === "archived"
      ? `WHERE COALESCE("archived", 0) = 1`
      : normalizedView === "all"
        ? ""
        : `WHERE COALESCE("archived", 0) = 0`;

  const rows = await prisma.$queryRawUnsafe(
    `SELECT
      "id",
      "title",
      "createdAt",
      "updatedAt",
      COALESCE("pinned", 0) AS "pinned",
      COALESCE("archived", 0) AS "archived"
     FROM "ChatSession"
     ${whereClause}
     ORDER BY COALESCE("pinned", 0) DESC, "updatedAt" DESC`
  );

  return (rows || []).map((row) => ({
    ...row,
    pinned: Boolean(Number(row.pinned || 0)),
    archived: Boolean(Number(row.archived || 0))
  }));
};

export const getChatSessionById = async (chatId) => {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT
      "id",
      "title",
      "createdAt",
      "updatedAt",
      COALESCE("pinned", 0) AS "pinned",
      COALESCE("archived", 0) AS "archived"
     FROM "ChatSession"
     WHERE "id" = ?
     LIMIT 1`,
    chatId
  );

  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return null;
  return {
    ...row,
    pinned: Boolean(Number(row.pinned || 0)),
    archived: Boolean(Number(row.archived || 0))
  };
};

export const getChatMessages = async (chatId) => {
  return prisma.chatMessage.findMany({
    where: { chatId },
    orderBy: { createdAt: "asc" }
  });
};

export const getRecentChatMessages = async (chatId, limit = 12) => {
  const capped = Math.max(1, Math.min(Number(limit) || 12, 50));
  return prisma.chatMessage.findMany({
    where: { chatId },
    orderBy: { createdAt: "desc" },
    take: capped
  });
};

export const getRecentMessagesAcrossChats = async ({ excludeChatId, limit = 12 }) => {
  const capped = Math.max(1, Math.min(Number(limit) || 12, 50));
  return prisma.chatMessage.findMany({
    where: {
      ...(excludeChatId ? { chatId: { not: excludeChatId } } : {})
    },
    include: {
      chat: {
        select: {
          id: true,
          title: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: capped
  });
};

export const getChatMessageCount = async (chatId) => {
  const count = await prisma.chatMessage.count({
    where: { chatId }
  });
  return Number(count || 0);
};

export const getChatSummary = async (chatId) => {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT "id", "chatId", "summary", "sourceMessageCount", "updatedAt"
     FROM "ChatSummary"
     WHERE "chatId" = ?
     LIMIT 1`,
    chatId
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  return rows[0];
};

export const upsertChatSummary = async ({ chatId, summary, sourceMessageCount }) => {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "ChatSummary" ("id", "chatId", "summary", "sourceMessageCount", "updatedAt")
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT("chatId") DO UPDATE SET
       "summary" = excluded."summary",
       "sourceMessageCount" = excluded."sourceMessageCount",
       "updatedAt" = CURRENT_TIMESTAMP`,
    crypto.randomUUID(),
    chatId,
    summary,
    Number(sourceMessageCount || 0)
  );

  return getChatSummary(chatId);
};

export const appendChatMessage = async ({ chatId, role, content, meta }) => {
  const message = await prisma.chatMessage.create({
    data: {
      chatId,
      role,
      content,
      meta: meta ? JSON.stringify(meta) : null
    }
  });

  await prisma.chatSession.update({
    where: { id: chatId },
    data: {
      updatedAt: new Date(),
      ...(role === "user" ? { title: content.slice(0, 28) || "New chat" } : {})
    }
  });

  return message;
};

export const clearAllChats = async () => {
  await prisma.$executeRawUnsafe(`DELETE FROM "ChatSummary";`);
  const deletedMessages = await prisma.chatMessage.deleteMany();
  const deletedChats = await prisma.chatSession.deleteMany();
  return {
    deletedMessages: deletedMessages.count,
    deletedChats: deletedChats.count
  };
};

export const clearChatById = async (chatId) => {
  await prisma.$executeRawUnsafe(`DELETE FROM "ChatSummary" WHERE "chatId" = ?`, chatId);
  const deletedMessages = await prisma.chatMessage.deleteMany({
    where: { chatId }
  });
  const deletedChat = await prisma.chatSession.deleteMany({
    where: { id: chatId }
  });
  return {
    deletedMessages: deletedMessages.count,
    deletedChats: deletedChat.count
  };
};

export const updateChatSession = async ({ chatId, title, pinned, archived }) => {
  const updates = [];
  const values = [];

  if (typeof title === "string") {
    updates.push(`"title" = ?`);
    values.push(title);
  }
  if (typeof pinned === "boolean") {
    updates.push(`"pinned" = ?`);
    values.push(pinned ? 1 : 0);
  }
  if (typeof archived === "boolean") {
    updates.push(`"archived" = ?`);
    values.push(archived ? 1 : 0);
  }
  updates.push(`"updatedAt" = CURRENT_TIMESTAMP`);

  await prisma.$executeRawUnsafe(
    `UPDATE "ChatSession" SET ${updates.join(", ")} WHERE "id" = ?`,
    ...values,
    chatId
  );

  return getChatSessionById(chatId);
};
