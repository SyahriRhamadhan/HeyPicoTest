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
  const deletedMessages = await prisma.chatMessage.deleteMany();
  const deletedChats = await prisma.chatSession.deleteMany();
  return {
    deletedMessages: deletedMessages.count,
    deletedChats: deletedChats.count
  };
};

export const clearChatById = async (chatId) => {
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
