"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Trash2, AlertCircle, Shield, CreditCard, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { decryptObject, type PageData } from '@/lib/utils/encryption';

type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

// Komponenta za renderiranje Markdown poruka
function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:mt-1 prose-headings:mb-1 prose-p:my-1 prose-ul:my-1 prose-ol:my-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom komponente za bolji izgled
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mt-2 mb-1 border-b pb-1 border-gray-200 dark:border-gray-700">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-md font-bold mt-2 mb-1 border-b pb-1 border-gray-200 dark:border-gray-700">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold mt-1 mb-1">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold mt-1 mb-1">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-medium mt-1 mb-1">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-sm font-medium mt-1 mb-1 text-gray-600 dark:text-gray-400">
              {children}
            </h6>
          ),
          p: ({ children }) => <p className="mb-1 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-1 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-1 space-y-0.5">{children}</ol>,
          li: ({ children }) => <li className="mb-0.5">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-3 italic bg-blue-50 dark:bg-blue-900/20 py-1 my-1 rounded-r">
              {children}
            </blockquote>
          ),
          code: ({ children, className, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono border border-gray-200 dark:border-gray-700">
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg my-2 overflow-x-auto border border-gray-200 dark:border-gray-700">
                <code className={`block ${className || ''}`} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-2 border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50 dark:bg-gray-800">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {children}
            </tbody>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              {children}
            </tr>
          ),
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          hr: () => (
            <hr className="my-3 border-gray-300 dark:border-gray-600" />
          ),
          // GFM specific komponente
          del: ({ children }) => (
            <del className="line-through text-gray-500 dark:text-gray-400">{children}</del>
          ),
          input: ({ checked, type }) => {
            if (type === 'checkbox') {
              return (
                <input 
                  type="checkbox" 
                  checked={checked || false} 
                  readOnly 
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              );
            }
            return null;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function ClearChatDialog({ onClear }: { onClear: () => void }) {
  const [open, setOpen] = useState(false);

  const handleClear = () => {
    onClear();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Chat
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clear Chat History</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to clear all chat messages? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClear}
            >
              Clear All
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChatSection() {
  const { user } = useGlobal();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAuthToken = async (): Promise<string | null> => {
    try {
      if (typeof window === 'undefined') return null;

      const { createSPAClient } = await import('@/lib/supabase/client');
      const supabase = createSPAClient();
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return null;
      }

      console.log('Session found:', !!session);
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    if (!user) {
      setError('Please log in to use the chat');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const token = await getAuthToken();

      if (!token) {
        throw new Error('Unable to get authentication token. Please refresh the page and try again.');
      }

      console.log('Sending request with token:', token.substring(0, 10) + '...');

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: input.trim()
            }
          ],
          temperature: 0.7,
          maxTokens: 1000
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed - please log in again');
        } else if (response.status === 403) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Subscription required to use AI chat');
        } else {
          const errorText = await response.text();
          throw new Error(`Failed to get AI response: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.content,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
  };

  const getInitials = (email: string | undefined): string => {
    if (!email) return 'U';
    return email.split('@')[0].charAt(0).toUpperCase();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>AI Chat Assistant</CardTitle>
          <CardDescription>
            {user ? `Chatting as ${user.email}` : 'Please log in to use the chat'}
          </CardDescription>
        </div>
        {messages.length > 0 && (
          <ClearChatDialog onClear={clearChat} />
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Chat Messages */}
        <div className="space-y-4 mb-6">
          {messages.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary-50 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Welcome to AI Chat!</h3>
                <p className="text-muted-foreground mt-1">
                  {user 
                    ? 'Start a conversation with our AI assistant. Ask questions, get help, or just chat!'
                    : 'Please log in to start chatting with our AI assistant.'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto p-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    message.role === 'user' ? 'bg-primary-600' : 'bg-gray-600'
                  }`}>
                    {message.role === 'user' ? 
                      getInitials(user?.email) : 
                      'AI'
                    }
                  </div>
                  
                  <div className={`flex-1 space-y-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {message.role === 'user' ? 'You' : 'AI Assistant'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={`inline-block px-4 py-2 rounded-lg max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-slate-900 text-white'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <MarkdownMessage content={message.content} />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center bg-gray-600 text-white text-sm font-medium">
                    AI
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">AI Assistant</span>
                      <span className="text-xs text-muted-foreground">Typing...</span>
                    </div>
                    <div className="inline-block px-4 py-2 rounded-lg bg-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={user ? "Type your message..." : "Please log in to chat"}
              className="min-h-[60px] resize-none"
              disabled={!user || loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && user) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <Button
              type="submit"
              disabled={!input.trim() || loading || !user}
              className="bg-primary-600 text-white hover:bg-primary-700 h-[60px] px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Send'
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {user 
              ? 'Powered by Nvidia NEMOTRON AI • Press Enter to send, Shift+Enter for new line'
              : 'Please log in to use the AI Chat feature'
            }
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

function SubscriptionRequiredCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <Shield className="h-5 w-5" />
          Premium Feature
        </CardTitle>
        <CardDescription>
          AI Chat is available for active subscribers only
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-300">Subscription Required</p>
            <p className="text-sm text-red-700 dark:text-red-400">
              Upgrade to a paid plan to access the AI Chat feature
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button asChild className="bg-primary-600 hover:bg-primary-700">
            <a href="/pricing">View Pricing Plans</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/app">Back to Dashboard</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ExamplePage() {
    const { user, isSubscribed, loading: globalLoading } = useGlobal();
    const searchParams = useSearchParams();

    // Dekriptovanje podataka iz URL-a
    const encryptedData = searchParams.get('data');
    const [pageData, setPageData] = useState<PageData | null>(null);

    useEffect(() => {
      if (encryptedData) {
        const decrypted = decryptObject(encryptedData);
        if (decrypted) {
          setPageData(decrypted);
        }
      }
    }, [encryptedData]);

    // Fallback na direktne parametre ako enkripcija nije dostupna
    const subscriptionStatus = searchParams.get('subscriptionStatus');
    const accountName = searchParams.get('accountName');
    const isSubscribedParam = searchParams.get('isSubscribed') === 'true';

    // Koristite enkriptovane podatke ako postoje, inače koristite direktne parametre
    const finalSubscriptionStatus = pageData?.subscriptionStatus || subscriptionStatus || 'none';
    const finalAccountName = pageData?.accountName || accountName || user?.email?.split('@')[0] || 'User';
    const finalIsSubscribed = pageData?.isSubscribed || isSubscribedParam;

    // Provjera da li korisnik može pristupiti AI chatu
    const canAccessChat = isSubscribed || finalIsSubscribed;

    if (globalLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header sa informacijama o accountu i subscriptionu */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                Welcome, {finalAccountName}!
                            </h2>
                            <p className="text-blue-700 dark:text-blue-300 text-sm">
                                Subscription Status: <span className="font-medium capitalize">{finalSubscriptionStatus}</span>
                            </p>
                            <p className="text-blue-600 dark:text-blue-400 text-sm">
                                Logged in as: {user?.email || 'Not logged in'}
                            </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            canAccessChat 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                            {canAccessChat ? 'Premium Access' : 'Free Tier'}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content - samo AI Chat */}
            {canAccessChat ? (
                <ChatSection />
            ) : (
                <SubscriptionRequiredCard />
            )}
        </div>
    );
}