"use client";

import {
  Home,
  PlusSquare,
  LayoutGrid,
  MessageCircle,
  Zap,
  HelpCircle,
  Settings,
  Crown,
  PanelLeftClose,
  AIIcon,
  Plus,
  ChevronDown,
  ChevronUp,
  LogOut,
} from "./Icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthService } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Chat {
  id: number;
  title: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  email: string;
  name: string;
}

interface SidebarProps {
  currentChatId: number | null;
  onChatSelect: (chatId: number | null) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ currentChatId, onChatSelect, isOpen, onClose }: SidebarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isChatsExpanded, setIsChatsExpanded] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userData = AuthService.getUser();
    setUser(userData);
    loadChats();
  }, []);

  // Reload chats when currentChatId changes (new chat created)
  useEffect(() => {
    if (currentChatId) {
      loadChats();
    }
  }, [currentChatId]);

  const loadChats = async () => {
    const token = AuthService.getToken();
    if (!token) return;

    try {
      const response = await AuthService.getChats();
      if (response.success) {
        setChats(response.data || []);
      }
    } catch (err) {
      console.error("Failed to load chats:", err);
    }
  };

  const handleNewChat = () => {
    onChatSelect(null);
  };

  const handleLogout = () => {
    // Clear authentication data
    AuthService.logout();
    // Redirect to home page (login page)
    router.push('/');
  };

  const navItems = [
    { icon: Home, label: "Home", href: "/chat" },
    { icon: LayoutGrid, label: "Templates", href: "/chat/templates" },
  ];

  const bottomNavItems = [
    { icon: Zap, label: "Pricing Plans", href: "/pricing" },
    { icon: HelpCircle, label: "Help", href: "/help" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:relative
        w-64 h-screen 
        bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-900 dark:to-zinc-800/50 
        border-r border-zinc-200/80 dark:border-zinc-700/80 
        flex flex-col flex-shrink-0 backdrop-blur-sm transition-all duration-300 ease-in-out
        z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-700/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200/50">
            <AIIcon size={20} className="text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Copyzen
          </span>
        </div>
        <button 
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors lg:hidden"
        >
          <PanelLeftClose size={20} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={handleNewChat}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/50 hover:scale-[1.02]"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-6 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all duration-200 hover:shadow-sm"
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </div>

        {/* Chat History Dropdown */}
        <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-700/50">
          <button
            onClick={() => setIsChatsExpanded(!isChatsExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            <span>Your Chats</span>
            {isChatsExpanded ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>

          {isChatsExpanded && (
            <div className="mt-1 space-y-1 animate-fadeIn">
              {chats.length === 0 ? (
                <div className="px-3 py-2 text-xs text-zinc-400 dark:text-zinc-500 text-center">
                  No chats yet
                </div>
              ) : (
                chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => onChatSelect(chat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 group ${
                      currentChatId === chat.id
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-100 dark:border-blue-800"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageCircle size={14} className="flex-shrink-0" />
                      <div className="truncate flex-1">{chat.title}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="pt-6 border-t border-zinc-200/50 dark:border-zinc-700/50 space-y-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all duration-200 hover:shadow-sm"
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200 hover:shadow-sm"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-zinc-200/50 dark:border-zinc-700/50 bg-white/40 dark:bg-zinc-800/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {user?.name || "Guest"}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {user?.email || ""}
            </div>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
