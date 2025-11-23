"use client";

import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";

import { useState } from "react";

export default function ChatPage() {
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);

  const handleChatSelect = (chatId: number | null) => {
    setCurrentChatId(chatId);
  };

  const handleChatCreated = (chatId: number) => {
    setCurrentChatId(chatId);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-900 font-sans transition-colors">
      <Sidebar currentChatId={currentChatId} onChatSelect={handleChatSelect} />
      <ChatArea currentChatId={currentChatId} onChatCreated={handleChatCreated} />
    </div>
  );
}
