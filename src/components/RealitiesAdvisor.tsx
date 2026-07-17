import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, User, RefreshCw, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
}

const PRESET_QUESTIONS = [
  "¿Cómo afecta la inflación la compra de la canasta básica?",
  "¿Qué soluciones comunitarias de agua existen en Venezuela?",
  "Háblame sobre la resiliencia de los emprendedores en el Zulia.",
  "¿Cómo organizan los productores larenses las ferias de hortalizas?"
];

export default function RealitiesAdvisor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "¡Hola! Soy tu Asistente de Venezuela Real. Puedo analizar sociológicamente los reportes comunitarios, explicarte tendencias socioeconómicas cotidianas (canasta básica, servicios, transporte) y compartir ejemplos inspiradores de organización social venezolana. ¿Qué te gustaría consultar hoy?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      sender: "user",
      text: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend })
      });

      const data = await response.json();
      const aiMsg: Message = {
        id: `msg-${Date.now()}-ai`,
        sender: "ai",
        text: data.reply || data.error || "Disculpa, no logré procesar tu solicitud."
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          sender: "ai",
          text: "Ups, hubo un error de red. Por favor, verifica tu conexión."
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handlePresetClick = (q: string) => {
    handleSend(q);
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-white">Asistente Venezuela Real</h3>
            <span className="text-[10px] text-indigo-300 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Consultor de Contexto Social
            </span>
          </div>
        </div>
        <button 
          onClick={() => setMessages([messages[0]])}
          title="Reiniciar chat"
          className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.sender === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`p-1.5 rounded-lg border text-xs shrink-0 ${
              m.sender === "user" 
                ? "bg-slate-800 text-slate-200 border-slate-700" 
                : "bg-indigo-950/40 text-indigo-100 border-indigo-900/60"
            }`}>
              {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-400" />}
            </div>
            <div className={`p-3.5 rounded-xl text-xs leading-relaxed max-w-[80%] ${
              m.sender === "user" 
                ? "bg-slate-800 text-slate-100 rounded-tr-none" 
                : "bg-slate-800/40 text-slate-300 rounded-tl-none border border-slate-800/60"
            }`}>
              {m.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-950/40 border border-indigo-900/60 text-xs text-indigo-400 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 bg-slate-800/30 rounded-xl rounded-tl-none text-xs flex items-center gap-1 text-slate-400 border border-slate-800/40">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preset questions */}
      {messages.length === 1 && (
        <div className="mb-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            Preguntas sugeridas de la realidad:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESET_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetClick(q)}
                className="text-left text-[11px] p-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 hover:border-slate-700 transition-all leading-snug cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="relative mt-auto">
        <input
          type="text"
          placeholder="Pregúntame sobre la canasta básica, luz, agua..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full bg-slate-800/80 text-white placeholder-slate-400 text-xs px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all pr-12"
        />
        <button
          type="submit"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
