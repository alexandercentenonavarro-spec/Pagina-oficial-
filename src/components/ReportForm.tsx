import React, { useState } from "react";
import { VENEZUELAN_STATES, CATEGORIES } from "../types";
import { Sparkles, PenTool, Check, Info } from "lucide-react";

interface ReportFormProps {
  onPublish: (data: {
    title: string;
    content: string;
    author: string;
    category: string;
    state: string;
    requestAIContext: boolean;
  }) => Promise<void>;
}

export default function ReportForm({ onPublish }: ReportFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [state, setState] = useState(VENEZUELAN_STATES[9]); // Defaults to Distrito Capital (Caracas)
  const [requestAIContext, setRequestAIContext] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!title.trim() || !content.trim()) {
      setError("Por favor, completa el título y el contenido del reporte.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onPublish({
        title: title.trim(),
        content: content.trim(),
        author: author.trim() || "Anónimo",
        category,
        state,
        requestAIContext
      });

      // Reset form
      setTitle("");
      setContent("");
      setAuthor("");
      setSuccess(true);
      
      // Auto dismiss success banner
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError("Error al enviar la publicación. Por favor intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs relative">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <PenTool className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-slate-800">Publicar una Realidad o Nota</h2>
          <p className="text-xs text-slate-500">Comparte lo que ocurre en tu estado de forma respetuosa y objetiva.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            ¡Tu reporte ha sido publicado exitosamente!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* State */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Estado de Venezuela</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              {VENEZUELAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ámbito / Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Título del Reporte</label>
          <input
            type="text"
            placeholder="Ej. Falta de transporte en el norte o Ferias de comida los domingos..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción de la Realidad</label>
          <textarea
            rows={4}
            placeholder="Describe detalladamente la situación, impacto cotidiano, resiliencia comunitaria o soluciones que se están tomando en tu zona..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
          />
        </div>

        {/* Author */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Firma / Autor (Opcional)</label>
          <input
            type="text"
            placeholder="Ej. Vecino de la Parroquia, María S., etc. (Vacío para Anónimo)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* AI Analysis opt-in */}
        <div className="flex items-start gap-2.5 p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100/40">
          <input
            type="checkbox"
            id="ai-context"
            checked={requestAIContext}
            onChange={(e) => setRequestAIContext(e.target.checked)}
            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="ai-context" className="cursor-pointer select-none">
            <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 fill-indigo-200" />
              Solicitar Análisis Sociológico de IA (Gemini)
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              Si marcas esta opción, el sistema usará Gemini para redactar un análisis técnico de 2-3 líneas acerca del contexto socioeconómico o soluciones asociadas a este reporte.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm disabled:opacity-50 transition-colors shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-1.5"
        >
          {isSubmitting ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin text-white" />
              Publicando y Analizando con Gemini...
            </>
          ) : (
            "Publicar Nota"
          )}
        </button>
      </form>
    </div>
  );
}
