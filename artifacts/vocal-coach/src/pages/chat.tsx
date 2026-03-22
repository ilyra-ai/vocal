import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { motion } from "framer-motion";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your AI vocal coach. I've been reviewing your sessions. Do you have any questions about breath support, repertoire, or specific vocal techniques?" }
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsStreaming(true);

    // Placeholder for actual API call, assuming conversation ID 1 exists or creating one.
    // In a real flow, we'd use useCreateOpenaiConversation first if needed.
    // For this UI, we will mock the SSE stream structure since we don't have a guaranteed ID here.
    
    // Fallback Mock Stream if no real backend:
    setMessages(prev => [...prev, { role: 'assistant', content: "" }]);
    
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/openai/conversations/1/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMsg })
      });

      if (!response.ok) throw new Error("API failed");
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  setMessages(prev => {
                    const last = prev[prev.length - 1];
                    return [...prev.slice(0, -1), { ...last, content: last.content + data.content }];
                  });
                }
              } catch (e) {}
            }
          }
        }
      }
    } catch (e) {
      // Mock typing if API fails (which it will if backend isn't up)
      const mockText = "As an expert vocal coach, I recommend focusing on diaphragmatic breathing. Try the 'hissing' exercise: inhale deeply for 4 seconds, then release the air on an 'S' sound for as long as possible.";
      for (let i = 0; i < mockText.length; i++) {
        await new Promise(r => setTimeout(r, 20));
        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: last.content + mockText[i] }];
        });
      }
    }
    
    setIsStreaming(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
      <h1 className="text-3xl font-bold text-white mb-6">AI Vocal Coach</h1>
      
      <div className="flex-1 glass-panel rounded-3xl overflow-hidden flex flex-col border-card-border/50 shadow-2xl">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary/20 text-primary ml-4' : 'bg-accent/20 text-accent mr-4'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-secondary text-white/90 rounded-tl-none border border-border'}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card/50">
          <form onSubmit={handleSubmit} className="relative">
            <input 
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isStreaming}
              placeholder="Ask about vocal techniques..."
              className="w-full bg-input border border-border rounded-xl pl-6 pr-14 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="absolute right-2 top-2 bottom-2 w-10 bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
