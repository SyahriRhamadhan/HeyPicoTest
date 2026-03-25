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

export const listChatSessions = async () => {
  return prisma.chatSession.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        where: { role: "user" },
        orderBy: { createdAt: "asc" },
        take: 1
      }
    }
  });
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
