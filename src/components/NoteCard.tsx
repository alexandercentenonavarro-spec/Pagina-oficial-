import React, { useState } from "react";
import { Note } from "../types";
import { 
  Zap, 
  TrendingUp, 
  HeartPulse, 
  MessageSquare, 
  Users, 
  MapPin, 
  Calendar, 
  Sparkles, 
  Send,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NoteCardProps {
  key?: React.Key;
  note: Note;
  onSupport: (id: string) => void | Promise<void>;
  onAddComment: (id: string, author: string, content: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isAdminLoggedIn?: boolean;
}

export default function NoteCard({ note, onSupport, onAddComment, onDelete, isAdminLoggedIn }: NoteCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [hasSupported, setHasSupported] = useState(false);

  // Map category to icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Economía y Costo de Vida":
        return <TrendingUp className="w-4 h-4" />;
      case "Servicios Públicos":
        return <Zap className="w-4 h-4" />;
      case "Salud y Educación":
        return <HeartPulse className="w-4 h-4" />;
      case "Historias de Vida":
        return <MessageSquare className="w-4 h-4" />;
      case "Iniciativas Comunitarias":
        return <Users className="w-4 h-4" />;
      case "Estudios Científicos y Análisis":
        return <BookOpen className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  // Map category to styling classes
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Economía y Costo de Vida":
        return "bg-amber-50 text-amber-700 border-amber-200/60";
      case "Servicios Públicos":
        return "bg-sky-50 text-sky-700 border-sky-200/60";
      case "Salud y Educación":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      case "Historias de Vida":
        return "bg-rose-50 text-rose-700 border-rose-200/60";
      case "Iniciativas Comunitarias":
        return "bg-purple-50 text-purple-700 border-purple-200/60";
      case "Estudios Científicos y Análisis":
        return "bg-teal-50 text-teal-700 border-teal-200/60";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/60";
    }
  };

  const handleSupportClick = () => {
    if (!hasSupported) {
      onSupport(note.id);
      setHasSupported(true);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) {
      setCommentError("El comentario no puede estar vacío.");
      return;
    }
    setCommentError("");
    setIsSubmittingComment(true);
    try {
      await onAddComment(note.id, commentAuthor.trim(), commentContent.trim());
      setCommentContent("");
      setCommentAuthor("");
    } catch (err) {
      setCommentError("Error al publicar el comentario.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formattedDate = new Date(note.createdAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <motion.article 
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      id={`note-card-${note.id}`}
      className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between"
    >
      {/* Top Meta info */}
      <div className="p-6 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(note.category)}`}>
              {getCategoryIcon(note.category)}
              {note.category}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {note.state}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDate}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-display text-xl font-bold text-slate-800 leading-snug mb-3 hover:text-indigo-600 transition-colors">
          {note.title}
        </h3>

        {/* Content */}
        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line mb-4">
          {note.content}
        </p>

        {/* Author info */}
        <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100/80 pt-3">
          <span className="font-medium text-slate-700">Por: {note.author}</span>
        </div>
      </div>

      {/* AI Analysis Section (Gemini) */}
      {note.aiAnalysis && (
        <div className="mx-6 mb-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50/70 to-purple-50/70 border border-indigo-100/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
            <Sparkles className="w-12 h-12 text-indigo-600" />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Contexto Sociológico IA
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-sans italic">
            "{note.aiAnalysis}"
          </p>
        </div>
      )}

      {/* Action footer */}
      <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button 
            id={`btn-support-${note.id}`}
            onClick={handleSupportClick}
            className={`flex items-center gap-2 py-1.5 px-3.5 rounded-lg text-xs font-medium transition-all ${
              hasSupported 
                ? "bg-indigo-600 text-white" 
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${hasSupported ? "fill-white" : ""}`} />
            <span>
              {hasSupported ? "¡Apoyado!" : "Apoyar realidad"} ({note.supportCount})
            </span>
          </button>

          {isAdminLoggedIn && onDelete && (
            <button
              id={`btn-delete-${note.id}`}
              onClick={() => {
                if (window.confirm("¿Estás seguro de que deseas eliminar esta nota informativa? Esta acción no se puede deshacer.")) {
                  onDelete(note.id);
                }
              }}
              className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-250 transition-colors cursor-pointer"
              title="Eliminar Nota"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar</span>
            </button>
          )}
        </div>

        <button 
          id={`btn-comments-toggle-${note.id}`}
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium py-1.5"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Comentarios ({note.comments.length})</span>
          {showComments ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable comments drawer */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-slate-100 bg-slate-50/50 overflow-hidden"
          >
            <div className="p-6 pt-4 space-y-4">
              {/* Comment list */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {note.comments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-2">
                    No hay comentarios todavía. Sé el primero en aportar.
                  </p>
                ) : (
                  note.comments.map(c => (
                    <div key={c.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-xs text-slate-700">{c.author}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(c.createdAt).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {c.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Comment input form */}
              <form onSubmit={handleCommentSubmit} className="pt-3 border-t border-slate-200/60">
                {commentError && (
                  <p className="text-xs text-red-500 mb-2">{commentError}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Tu nombre o apodo (opcional)"
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    className="sm:col-span-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Escribe tu comentario o aporte..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="sm:col-span-2 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingComment}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {isSubmittingComment ? "Publicando..." : "Comentar"}
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
