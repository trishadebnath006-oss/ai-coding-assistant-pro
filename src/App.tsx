import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Plus, 
  MessageSquare, 
  Trash2, 
  Copy, 
  Check, 
  Code, 
  Terminal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Github
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { generateCodeResponse } from '@/lib/gemini';
import { Message, ChatSession } from '@/types';

const STORAGE_KEY = 'ai_coding_helper_chats';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error('Failed to parse saved chats', e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-slot="scroll-area-viewport"]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [sessions, activeSessionId, isLoading]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      lastUpdated: Date.now()
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setIsSidebarOpen(false); // Close sidebar on mobile after creating
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (activeSessionId === id) {
      setActiveSessionId(newSessions.length > 0 ? newSessions[0].id : null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    let currentSessionId = activeSessionId;
    let currentSessions = [...sessions];

    // Create session if none exists
    if (!currentSessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: input.slice(0, 30) + (input.length > 30 ? '...' : ''),
        messages: [],
        lastUpdated: Date.now()
      };
      currentSessions = [newSession, ...currentSessions];
      currentSessionId = newSession.id;
      setSessions(currentSessions);
      setActiveSessionId(currentSessionId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    // Update session with user message
    const updatedSessions = currentSessions.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          messages: [...s.messages, userMessage],
          title: s.messages.length === 0 ? input.slice(0, 30) + (input.length > 30 ? '...' : '') : s.title,
          lastUpdated: Date.now()
        };
      }
      return s;
    });

    setSessions(updatedSessions);
    setInput('');
    setIsLoading(true);

    try {
      const session = updatedSessions.find(s => s.id === currentSessionId);
      const history = session?.messages.slice(0, -1).map(m => ({ role: m.role, content: m.content })) || [];
      
      const aiResponseContent = await generateCodeResponse(input, history);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: aiResponseContent,
        timestamp: Date.now()
      };

      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...s.messages, aiMessage],
            lastUpdated: Date.now()
          };
        }
        return s;
      }));
    } catch (error) {
      console.error('Failed to get AI response', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: "I'm sorry, I encountered an error. Please check your internet connection or API key.",
        timestamp: Date.now()
      };
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return { ...s, messages: [...s.messages, errorMessage] };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full bg-[#F8FAFC] text-slate-900 overflow-hidden font-sans">
        {/* Sidebar */}
        <motion.aside 
          initial={false}
          animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
          className={cn(
            "bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out z-20",
            !isSidebarOpen && "pointer-events-none"
          )}
        >
          <div className="p-4 flex flex-col h-full">
            <Button 
              onClick={createNewSession}
              className="w-full mb-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md border-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>

            <div className="flex-1 overflow-hidden flex flex-col">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">History</h3>
              <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="space-y-1">
                  {sessions.map(session => (
                    <div
                      key={session.id}
                      onClick={() => setActiveSessionId(session.id)}
                      className={cn(
                        "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                        activeSessionId === session.id 
                          ? "bg-indigo-50 text-indigo-700" 
                          : "hover:bg-slate-50 text-slate-600"
                      )}
                    >
                      <div className="flex items-center min-w-0">
                        <MessageSquare className={cn("w-4 h-4 mr-3 shrink-0", activeSessionId === session.id ? "text-indigo-600" : "text-slate-400")} />
                        <span className="truncate text-sm font-medium">{session.title}</span>
                      </div>
                      <button 
                        onClick={(e) => deleteSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm italic">
                      No chats yet
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100">
              <div className="flex items-center p-2 rounded-lg bg-slate-50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  AI
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-xs font-semibold truncate">Coding Helper</p>
                  <p className="text-[10px] text-slate-500">v1.0.0</p>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative min-w-0">
          {/* Header */}
          <header className="h-16 border-bottom border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="mr-4 text-slate-500 hover:bg-slate-100"
              >
                {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
              </Button>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white mr-3 shadow-indigo-200 shadow-lg">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                    AI Coding Helper
                  </h1>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Basic Programs</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-indigo-100 px-3 py-1">
                <Sparkles className="w-3 h-3 mr-1.5" />
                Gemini AI
              </Badge>
              <Tooltip>
                <TooltipTrigger render={<Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600" />}>
                  <Github className="w-5 h-5" />
                </TooltipTrigger>
                <TooltipContent>View Source</TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* Chat Area */}
          <ScrollArea ref={scrollRef} className="flex-1 h-full p-4 md:p-8 min-h-0 touch-auto">
            <div className="max-w-4xl mx-auto space-y-8 pb-24">
              {!activeSession || activeSession.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-200"
                  >
                    <Code className="w-10 h-10" />
                  </motion.div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-slate-800">How can I help you code today?</h2>
                    <p className="text-slate-500 max-w-md mx-auto">
                      Ask me to write a basic program in Python, JavaScript, C, C++, or HTML/CSS. I'll provide simple code and explanations.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
                    {[
                      "Write a Python program to check if a number is prime",
                      "Create a simple HTML/CSS login form",
                      "How to reverse a string in JavaScript?",
                      "Write a C++ program for a simple calculator"
                    ].map((suggestion, i) => (
                      <Button 
                        key={i}
                        variant="outline" 
                        className="justify-start h-auto py-3 px-4 text-left border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
                        onClick={() => {
                          setInput(suggestion);
                          textareaRef.current?.focus();
                        }}
                      >
                        <span className="text-slate-600 group-hover:text-indigo-600 text-sm line-clamp-1">{suggestion}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                activeSession.messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex w-full",
                      message.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm",
                      message.role === 'user' 
                        ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-none" 
                        : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                    )}>
                      {message.role === 'ai' ? (
                        <div className="prose prose-slate max-w-none">
                          <ReactMarkdown
                            components={{
                              code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                const codeString = String(children).replace(/\n$/, '');
                                return !inline && match ? (
                                  <div className="relative group my-4">
                                    <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-8 w-8 bg-slate-800/50 hover:bg-slate-800 text-white border-none"
                                        onClick={() => handleCopy(codeString, message.id)}
                                      >
                                        {copiedId === message.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                      </Button>
                                    </div>
                                    <SyntaxHighlighter
                                      style={vscDarkPlus}
                                      language={match[1]}
                                      PreTag="div"
                                      className="rounded-xl !m-0 !bg-slate-900 border border-slate-800"
                                      {...props}
                                    >
                                      {codeString}
                                    </SyntaxHighlighter>
                                  </div>
                                ) : (
                                  <code className={cn("bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono text-sm", className)} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc ml-4 mb-4 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal ml-4 mb-4 space-y-1">{children}</ol>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      )}
                      <div className={cn(
                        "text-[10px] mt-2 opacity-50",
                        message.role === 'user' ? "text-indigo-100 text-right" : "text-slate-400"
                      )}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }} 
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-2 h-2 bg-indigo-400 rounded-full" 
                      />
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }} 
                        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                        className="w-2 h-2 bg-indigo-500 rounded-full" 
                      />
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }} 
                        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                        className="w-2 h-2 bg-indigo-600 rounded-full" 
                      />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent z-10">
            <div className="max-w-4xl mx-auto relative">
              <Card className="shadow-xl border-slate-200 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                <div className="flex items-end p-2">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me to write some code..."
                    className="flex-1 min-h-[60px] max-h-[200px] border-none focus-visible:ring-0 resize-none py-3 px-4 text-slate-700 placeholder:text-slate-400"
                  />
                  <div className="pb-1 pr-1">
                    <Button 
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      size="icon"
                      className={cn(
                        "h-10 w-10 rounded-xl transition-all",
                        input.trim() 
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200" 
                          : "bg-slate-100 text-slate-400"
                      )}
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </Card>
              <p className="text-[10px] text-center mt-3 text-slate-400 font-medium uppercase tracking-widest">
                Press Enter to send • Shift + Enter for new line
              </p>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
