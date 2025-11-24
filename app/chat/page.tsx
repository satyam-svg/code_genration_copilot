"use client";

import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";

import { useState } from "react";

export default function ChatPage() {
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleChatSelect = (chatId: number | null) => {
    setCurrentChatId(chatId);
    setIsSidebarOpen(false); // Close sidebar on mobile after selecting a chat
  };

  const handleChatCreated = (chatId: number) => {
    setCurrentChatId(chatId);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-900 font-sans transition-colors overflow-hidden overflow-x-hidden w-full max-w-full">
      <Sidebar 
        currentChatId={currentChatId} 
        onChatSelect={handleChatSelect}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <ChatArea 
        currentChatId={currentChatId} 
        onChatCreated={handleChatCreated}
        onMenuClick={toggleSidebar}
      />
    </div>
  );
}
