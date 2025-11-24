"use client";

import { useState, useEffect } from "react";
import { AuthService, type User } from "@/lib/api";
import toast from "react-hot-toast";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Bell,
  Mic,
  Volume2,
  Camera,
  Paperclip,
  ArrowUp,
  AIIcon,
  Menu,
} from "./Icons";

interface Message {
  id: number;
  chatId: number;
  role: "user" | "assistant";
  content: string;
  language?: string;
  createdAt: string;
}

interface ChatAreaProps {
  currentChatId: number | null;
  onChatCreated?: (chatId: number) => void;
  onMenuClick?: () => void;
}

export default function ChatArea({ currentChatId, onChatCreated, onMenuClick }: ChatAreaProps) {

  const [user, setUser] = useState<User | null>(null);
  const [chatTitle, setChatTitle] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("python");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [chatLoadError, setChatLoadError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const userData = AuthService.getUser();
    setUser(userData);
  }, []);

  useEffect(() => {
    if (currentChatId) {
      // Immediately clear current messages and show loading state
      setMessages([]);
      setChatTitle("");
      setChatLoadError("");
      setIsLoadingChat(true);
      loadChat(currentChatId);
    } else {
      setChatTitle("");
      setMessages([]);
      setPrompt("");
      setError("");
      setChatLoadError("");
      setIsLoadingChat(false);
    }
  }, [currentChatId]);

  const loadChat = async (chatId: number) => {
    const token = AuthService.getToken();
    if (!token) {
      setIsLoadingChat(false);
      setChatLoadError("Please login to view chats");
      return;
    }

    try {
      const response = await AuthService.getChat(chatId);
      
      if (response.success) {
        setChatTitle(response.data.chat?.title || "");
        setMessages(response.data.messages || []);
        setChatLoadError("");
      } else {
        setChatLoadError("Failed to load chat");
      }
    } catch (err) {
      console.error("Failed to load chat:", err);
      setChatLoadError("Failed to load chat. Please check your connection.");
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    const token = AuthService.getToken();
    if (!token) {
      setError("Please login to generate code");
      return;
    }

    setIsLoading(true);
    setError("");

    // Add user message to UI immediately
    const userMessage: Message = {
      id: Date.now(),
      chatId: currentChatId || 0,
      role: "user",
      content: prompt,
      language: language,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentPrompt = prompt;
    setPrompt("");

    try {
      const response = await AuthService.generateCode(currentPrompt, language, currentChatId || undefined);

      if (response.success && response.data) {
        // Add AI response to UI
        const aiMessage: Message = {
          id: Date.now() + 1,
          chatId: response.data.chatId,
          role: "assistant",
          content: response.data.code,
          language: language,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);

        // Update current chat ID if it was a new chat
        if (!currentChatId && onChatCreated) {
          onChatCreated(response.data.chatId);
        }
      } else {
        setError("Failed to generate code");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while generating code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Text copied");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 transition-colors overflow-x-hidden w-full">
      {/* Header */}
      <header className="h-16 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between px-4 md:px-6 flex-shrink-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm transition-colors">
        <div className="flex items-center gap-3">
          {/* Burger Menu Button - Only visible on mobile */}
          <button
            onClick={onMenuClick}
            className="lg:hidden text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-2 -ml-2"
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            <span className="hidden sm:inline text-zinc-500 dark:text-zinc-400">Code Generation</span>
            <span className="hidden sm:inline text-zinc-300 dark:text-zinc-600">/</span>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-semibold truncate max-w-[200px] sm:max-w-none">
              {currentChatId && chatTitle ? chatTitle : "New Chat"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <Bell size={20} />
          </button>

        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar w-full">
        {/* Loading Chat State */}
        {isLoadingChat && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 p-6">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-zinc-700">Loading chat...</h2>
              <p className="text-sm text-zinc-500">Please wait while we fetch your messages</p>
            </div>
          </div>
        )}

        {/* Chat Load Error State */}
        {!isLoadingChat && chatLoadError && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 p-6">
            <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-2 max-w-md">
              <h2 className="text-xl font-semibold text-red-700">Failed to load chat</h2>
              <p className="text-sm text-zinc-600">{chatLoadError}</p>
              <button
                onClick={() => currentChatId && loadChat(currentChatId)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Welcome State */}
        {!isLoadingChat && !chatLoadError && messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-8 p-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-300/50 animate-float">
              <AIIcon size={40} className="text-white" />
            </div>

            <div className="space-y-3 max-w-lg">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Welcome, {user?.name || "Guest"}! 👋
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed">
                I'm here to help you generate high-quality code.
                What would you like to build today?
              </p>
            </div>
          </div>
        )}

        {!isLoadingChat && !chatLoadError && messages.length > 0 && (
          <div className="max-w-full md:max-w-4xl mx-auto py-4 md:py-6 space-y-4 md:space-y-6 px-3 md:px-4 w-full">
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`flex gap-4 animate-fadeIn ${
                  msg.role === "user" ? "justify-end" : ""
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <AIIcon size={18} className="text-white" />
                  </div>
                )}

                <div className={`flex-1 min-w-0 ${msg.role === "user" ? "max-w-2xl" : "max-w-full"}`}>
                  <div
                    className={`rounded-2xl p-3 md:p-4 transition-all duration-200 overflow-hidden ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white ml-auto shadow-lg shadow-blue-200/50"
                        : "bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-800 dark:to-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div>
                        <div className="flex items-center justify-between mb-3 gap-2">
                          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide truncate">
                            Generated Code {msg.language && `(${msg.language})`}
                          </span>
                          <button
                            onClick={() => handleCopyCode(msg.content)}
                            className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 py-1.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md font-medium flex-shrink-0"
                          >
                            Copy
                          </button>
                        </div>
                        <SyntaxHighlighter
                          language={msg.language || 'javascript'}
                          style={atomDark}
                          customStyle={{
                            margin: 0,
                            borderRadius: '0.75rem',
                            padding: '0.5rem',
                            backgroundColor: '#18181b', // zinc-900
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            maxWidth: '100%',
                            width: '100%',
                            fontSize: '0.75rem',
                            overflowX: 'auto',
                          }}
                          wrapLongLines={true}
                          showLineNumbers={false}
                        >
                          {msg.content}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere">
                        {msg.content}
                      </p>
                    )}
                  </div>
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 flex items-center justify-center flex-shrink-0 text-zinc-700 font-semibold text-xs shadow-md">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-4 max-w-4xl mx-auto py-4 md:py-6 px-3 md:px-4 animate-fadeIn">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <AIIcon size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="bg-gradient-to-br from-zinc-50 to-zinc-100/50 border border-zinc-200/80 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm text-zinc-600 font-medium">
                    Generating code...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="px-3 md:px-6 pb-2">
          <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm shadow-sm">
            {error}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 md:p-6 pt-3 md:pt-4 bg-gradient-to-t from-zinc-50/50 to-transparent w-full">
        <div className="max-w-full md:max-w-4xl mx-auto bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600 focus-within:border-blue-500 dark:focus-within:border-blue-500 rounded-2xl shadow-lg transition-all duration-200 p-2 flex items-end gap-2">
          <div className="flex-1">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe the code you want to generate..."
              className="w-full resize-none border-0 bg-transparent p-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-0 outline-none max-h-32"
              rows={1}
              disabled={isLoading}
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <div className="flex items-center gap-1">
                <button className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hidden sm:block">
                  <Mic size={18} />
                </button>
                <button className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hidden sm:block">
                  <Volume2 size={18} />
                </button>
                <button className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hidden sm:block">
                  <Camera size={18} />
                </button>
                <button className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hidden sm:block">
                  <Paperclip size={18} />
                </button>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-gradient-to-r from-zinc-50 to-zinc-100 border border-zinc-200 text-zinc-700 text-xs rounded-lg px-2 md:px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer font-medium"
                disabled={isLoading}
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/50 mb-1 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
          >
            <ArrowUp size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
