import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, X } from "lucide-react";
import { generateContent } from '@/lib/api';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { RainbowButton } from './ui/rainbow-button';

export function AIChatBox() {
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Dışarı tıklamayı dinleyen fonksiyon
    const handleClickOutside = (event: MouseEvent) => {
      if (chatBoxRef.current && !chatBoxRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Event listener'ı ekle
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup fonksiyonu
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    setUserMessage(message);
    setMessage('');
    setResponse('');
    
    try {
      const aiResponse = await generateContent(message);
      setResponse(aiResponse);
    } catch (error) {
      console.error('AI yanıt hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50" ref={chatBoxRef}>
      {/* Chat Trigger Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group relative inline-flex w-12 h-12 p-0 cursor-pointer items-center justify-center rounded-full border-0",
          "bg-gradient-to-r from-purple-600/90 via-blue-500/90 to-purple-600/90 bg-[size:400%_400%]",
          "hover:from-purple-500 hover:via-blue-400 hover:to-purple-500",
          "before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-purple-600/20 before:via-transparent before:to-blue-600/20",
          "before:transition-all before:duration-300 before:ease-out before:opacity-0 hover:before:opacity-100",
          "dark:from-purple-500/90 dark:via-blue-400/90 dark:to-purple-500/90",
          "dark:hover:from-purple-400 dark:hover:via-blue-300 dark:hover:to-purple-400",
          "transition-all duration-200 hover:scale-110",
          "animate-[gradient_8s_ease-in-out_infinite]",
          isOpen && "bg-primary hover:bg-primary/90"
        )}
      >
        {isOpen ? (
          <X className="h-5 w-5 text-white" />
        ) : (
          <Sparkles className="h-5 w-5 text-white animate-pulse" />
        )}
      </Button>

      {/* Chat Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-16 right-0"
          >
            <Card className="w-[350px] shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">AI Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {(userMessage || response) && (
                    <div className="bg-muted p-4 rounded-lg text-sm space-y-2 max-h-[300px] overflow-y-auto">
                      {userMessage && (
                        <div className="flex flex-col gap-2 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">You</span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{userMessage}</p>
                        </div>
                      )}
                      {response && (
                        <>
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="font-medium">AI Assistant</span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{response}</p>
                        </>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <Textarea
                      placeholder="Ask me anything..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[80px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />
                    <RainbowButton 
                      type="submit" 
                      disabled={isLoading || !message.trim()}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Send'
                      )}
                    </RainbowButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 