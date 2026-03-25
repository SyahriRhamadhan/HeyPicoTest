import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const now = new Date();

const chatSessions = [
  {
    id: "demo-chat-map-assistant",
    title: "Find coffee in Batam",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "demo-chat-general-qa",
    title: "REST API basics",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "demo-chat-location-followup",
    title: "Current location + map",
    createdAt: now,
    updatedAt: now
  }
];

const chatMessages = [
  {
    id: "demo-msg-1",
    chatId: "demo-chat-map-assistant",
    role: "assistant",
    content: "Hi! I can answer normal questions and find places on map. Try: find coffee shops in Batam.",
    meta: null,
    createdAt: now
  },
  {
    id: "demo-msg-2",
    chatId: "demo-chat-map-assistant",
    role: "user",
    content: "Find coffee shops in Batam.",
    meta: null,
    createdAt: now
  },
  {
    id: "demo-msg-3",
    chatId: "demo-chat-map-assistant",
    role: "assistant",
    content:
      "Hello! I found 4 coffee shop recommendations in Batam. If you want, I can re-rank them by closest to your current location.",
    meta: '{"provider":"google","results":4}',
    createdAt: now
  },
  {
    id: "demo-msg-4",
    chatId: "demo-chat-general-qa",
    role: "user",
    content: "Can you explain what a REST API is in simple terms?",
    meta: null,
    createdAt: now
  },
  {
    id: "demo-msg-5",
    chatId: "demo-chat-general-qa",
    role: "assistant",
    content:
      "A REST API is a way for two systems to communicate over HTTP using standard methods like GET, POST, PUT, and DELETE.",
    meta: null,
    createdAt: now
  },
  {
    id: "demo-msg-6",
    chatId: "demo-chat-location-followup",
    role: "user",
    content: "Where is my current location?",
    meta: null,
    createdAt: now
  },
  {
    id: "demo-msg-7",
    chatId: "demo-chat-location-followup",
    role: "assistant",
    content:
      "Please click 'Use Location' first, then I can show your current location and rank nearby places.",
    meta: null,
    createdAt: now
  }
];

async function main() {
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();

  await prisma.chatSession.createMany({ data: chatSessions });
  await prisma.chatMessage.createMany({ data: chatMessages });

  console.log(`Seed completed. Inserted ${chatSessions.length} chats and ${chatMessages.length} messages.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

