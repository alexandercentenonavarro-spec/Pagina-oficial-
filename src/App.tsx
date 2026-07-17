import React, { useState, useEffect, useRef } from "react";
import { Note, Stats, VENEZUELAN_STATES, CATEGORIES } from "./types";
import NoteCard from "./components/NoteCard";
import ReportForm from "./components/ReportForm";
import RealitiesAdvisor from "./components/RealitiesAdvisor";
import DashboardStats from "./components/DashboardStats";
import { 
  Search, 
  Plus, 
  Filter, 
  Sparkles, 
  X, 
  Newspaper, 
  AlertCircle, 
  TrendingUp, 
  Zap, 
  HeartPulse, 
  MessageSquare, 
  Users,
  Layers,
  Lock,
  Unlock,
  LogOut,
  Key
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, byState: {}, byCategory: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [selectedState, setSelectedState] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "support" | "comments">("recent");

  // Interactive UI controls
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [showConfirmDeleteAll, setShowConfirmDeleteAll] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Admin authentication states
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem("vr_admin_password") || "");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => !!localStorage.getItem("vr_admin_password"));
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Contraseña incorrecta.");
      }
      localStorage.setItem("vr_admin_password", loginPassword);
      setAdminPassword(loginPassword);
      setIsAdminLoggedIn(true);
      setShowLoginModal(false);
      setLoginPassword("");
    } catch (err: any) {
      setLoginError(err.message || "Error al iniciar sesión.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("vr_admin_password");
    setAdminPassword("");
    setIsAdminLoggedIn(false);
    setShowPublishForm(false);
  };

  // Ref to track the current fetch request ID to prevent race conditions
  const lastFetchId = useRef(0);

  // Fetch all notes and stats on load & filter change
  const fetchData = async (overrideState?: string, overrideCategory?: string, overrideSearch?: string) => {
    const fetchId = ++lastFetchId.current;
    setLoading(true);
    try {
      const notesUrl = new URL("/api/notes", window.location.origin);
      
      const stateVal = overrideState !== undefined ? overrideState : selectedState;
      const catVal = overrideCategory !== undefined ? overrideCategory : selectedCategory;
      const searchVal = overrideSearch !== undefined ? overrideSearch : searchQuery;

      if (stateVal) notesUrl.searchParams.set("state", stateVal);
      if (catVal) notesUrl.searchParams.set("category", catVal);
      if (searchVal) notesUrl.searchParams.set("search", searchVal);

      const [notesRes, statsRes] = await Promise.all([
        fetch(notesUrl.toString()),
        fetch("/api/stats")
      ]);

      if (!notesRes.ok || !statsRes.ok) {
        throw new Error("No se pudo conectar con el servidor.");
      }

      const notesData = await notesRes.json();
      const statsData = await statsRes.json();

      if (fetchId === lastFetchId.current) {
        setNotes(notesData);
        setStats(statsData);
        setError("");
      }
    } catch (err) {
      if (fetchId === lastFetchId.current) {
        console.error("Error fetching data:", err);
        setError("No se pudieron cargar los datos de la plataforma. Verifica tu servidor.");
      }
    } finally {
      if (fetchId === lastFetchId.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // If search query is empty, fetch immediately for instant feedback
    if (!searchQuery) {
      fetchData();
      return;
    }

    // Debounce the text search query to avoid spamming requests
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [selectedState, selectedCategory, searchQuery]);

  // Keep search submit handler for accessibility (e.g. hitting Enter)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleClearFilters = () => {
    setSelectedState("");
    setSelectedCategory("");
    setSearchQuery("");
    fetchData("", "", "");
  };

  // Publish report handler
  const handlePublishNote = async (data: {
    title: string;
    content: string;
    author: string;
    category: string;
    state: string;
    requestAIContext: boolean;
  }) => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-admin-password": adminPassword
      },
      body: JSON.stringify({ ...data, adminPassword })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Error al publicar la nota.");
    }

    // Reset filters to "All" to make sure the newly published note is visible immediately!
    setSelectedState("");
    setSelectedCategory("");
    setSearchQuery("");
    
    // Refresh data with overrides
    await fetchData("", "", "");
    setShowPublishForm(false);
  };

  // Support / Upvote report handler
  const handleSupportNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/notes/${noteId}/support`, {
        method: "POST"
      });
      if (res.ok) {
        // Update state locally for responsive feedback
        setNotes(prev => prev.map(n => {
          if (n.id === noteId) {
            return { ...n, supportCount: n.supportCount + 1 };
          }
          return n;
        }));
        // Update stats summary count too
        setStats(prev => ({
          ...prev,
          total: prev.total
        }));
      }
    } catch (err) {
      console.error("Error supporting note:", err);
    }
  };

  // Delete report handler (Admin Only)
  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
        headers: {
          "x-admin-password": adminPassword
        }
      });
      if (res.ok) {
        // Update state locally
        setNotes(prev => prev.filter(n => n.id !== noteId));
        // Refresh general stats to be synchronized
        const statsRes = await fetch("/api/stats");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } else {
        const data = await res.json();
        alert(data.error || "No se pudo eliminar la nota.");
      }
    } catch (err) {
      console.error("Error deleting note:", err);
      alert("Error de conexión al eliminar la nota.");
    }
  };

  // Delete all reports handler (Admin Only)
  const handleDeleteAllNotes = async () => {
    setIsDeletingAll(true);
    try {
      const res = await fetch("/api/notes-all", {
        method: "DELETE",
        headers: {
          "x-admin-password": adminPassword
        }
      });
      if (res.ok) {
        setNotes([]);
        setStats({ total: 0, byState: {}, byCategory: {} });
        setShowConfirmDeleteAll(false);
      } else {
        const data = await res.json();
        alert(data.error || "No se pudieron eliminar las notas.");
      }
    } catch (err) {
      console.error("Error deleting all notes:", err);
      alert("Error de conexión al eliminar todas las notas.");
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Add Comment handler
  const handleAddComment = async (noteId: string, author: string, content: string) => {
    const res = await fetch(`/api/notes/${noteId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, content })
    });

    if (!res.ok) {
      throw new Error("No se pudo añadir el comentario.");
    }

    const newComment = await res.json();
    
    // Update local state smoothly
    setNotes(prev => prev.map(n => {
      if (n.id === noteId) {
        return { ...n, comments: [...n.comments, newComment] };
      }
      return n;
    }));
  };

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
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-sky-100/10 relative overflow-hidden">
      {/* Top Banner Message "Venezuela Libre" */}
      <div className="bg-gradient-to-r from-amber-400 via-blue-600 to-red-500 text-white text-xs py-1.5 px-4 font-display font-extrabold text-center tracking-widest shadow-xs relative z-50 flex items-center justify-center gap-2">
        <span className="hidden sm:inline">★ ★ ★</span>
        <span className="uppercase tracking-widest text-[11px] font-black drop-shadow-[0_1px_2.5px_rgba(0,0,0,0.65)]">
          🇻🇪 ¡Venezuela Libre! 🇻🇪
        </span>
        <span className="hidden sm:inline">★ ★ ★</span>
      </div>

      {/* Decorative glowing gradient blobs with celestial sky blue tones */}
      <div className="absolute top-0 left-1/4 w-[550px] h-[550px] bg-gradient-to-tr from-sky-400/25 to-indigo-400/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2 z-0" />
      <div className="absolute top-1/3 right-10 w-[650px] h-[650px] bg-gradient-to-br from-cyan-300/25 to-blue-300/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-1/4 left-[-100px] w-[550px] h-[550px] bg-gradient-to-tr from-sky-300/20 to-teal-300/20 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Premium Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Venezuela High-End Minimalist Emblem Flag */}
            <div className="flex flex-col gap-0.5 w-6 h-4 rounded overflow-hidden shadow-xs border border-slate-100 shrink-0">
              <div className="bg-amber-400 h-1/3"></div>
              <div className="bg-blue-600 h-1/3 relative flex items-center justify-center">
                <span className="absolute text-[4px] text-white">★</span>
              </div>
              <div className="bg-red-500 h-1/3"></div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                  Venezuela Real
                </h1>
                <span className="bg-gradient-to-r from-amber-400/15 via-blue-500/10 to-red-500/15 text-blue-900 font-display font-black text-[9px] px-2.5 py-0.5 rounded-full border border-blue-200/40 shadow-3xs flex items-center gap-1 select-none animate-pulse shrink-0">
                  <span className="text-amber-500">★</span>
                  <span>Venezuela Libre</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Plataforma Ciudadana de Realidades Sociales</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAdminLoggedIn ? (
              <>
                <span className="hidden md:inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-teal-100">
                  <Unlock className="w-3 h-3 text-teal-600" />
                  Editor: Alexandercentenonavarro@gmail.com
                </span>
                
                <button
                  id="btn-publish-toggle"
                  onClick={() => setShowPublishForm(!showPublishForm)}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  {showPublishForm ? (
                    <>
                      <X className="w-4 h-4" />
                      <span className="hidden sm:inline">Cerrar Editor</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Publicar Nota</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowConfirmDeleteAll(true)}
                  className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 rounded-xl text-xs font-semibold border border-rose-200/50 transition-all cursor-pointer"
                  title="Eliminar todas las notas de la plataforma"
                >
                  <X className="w-4 h-4 text-rose-600" />
                  <span className="hidden sm:inline">Eliminar Todo</span>
                </button>

                <button
                  onClick={handleAdminLogout}
                  title="Cerrar Sesión de Editor"
                  className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-200"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Acceso Editor</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Intro Banner */}
        <div className="mb-8 p-6 sm:p-8 bg-white rounded-2xl border border-slate-100 shadow-3xs relative overflow-hidden">
          <div className="absolute -right-12 -top-12 p-16 opacity-5 pointer-events-none">
            <Newspaper className="w-64 h-64 text-slate-900" />
          </div>
          <div className="max-w-3xl relative z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100/60 mb-3">
              <Sparkles className="w-3 h-3 text-indigo-500 fill-indigo-200" />
              Observatorio Social Colaborativo
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-800 leading-tight">
              Visibilizando la realidad cotidiana de Venezuela
            </h2>
            <p className="text-slate-600 text-sm mt-2 leading-relaxed">
              Un espacio abierto y público para reportar, verificar y analizar objetivamente los desafíos socioeconómicos, servicios públicos y las extraordinarias iniciativas de organización y resiliencia comunitaria en cada rincón del país.
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form and Feed */}
          <div className="lg:col-span-2 space-y-8">
            <AnimatePresence>
              {showPublishForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <ReportForm onPublish={handlePublishNote} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Módulo: Notas Informativas */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-lg transition-all overflow-hidden relative z-10">
              {/* Module Header */}
              <div className="p-6 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 border-b border-slate-100 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-xs shrink-0">
                      <Newspaper className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-base sm:text-lg text-slate-800 tracking-tight">
                        Módulo: Notas Informativas
                      </h3>
                      <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                        Información verificada, periodismo comunitario y testimonios de la realidad social
                      </p>
                    </div>
                  </div>

                  {/* Ordering filter inside module */}
                  <div className="flex items-center gap-1 flex-wrap sm:flex-nowrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                      Ordenar:
                    </span>
                    <button
                      onClick={() => setSortBy("recent")}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        sortBy === "recent"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                      }`}
                    >
                      Recientes
                    </button>
                    <button
                      onClick={() => setSortBy("support")}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        sortBy === "support"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                      }`}
                    >
                      Más Apoyadas
                    </button>
                    <button
                      onClick={() => setSortBy("comments")}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        sortBy === "comments"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                      }`}
                    >
                      Comentadas
                    </button>
                  </div>
                </div>

                {/* Sub-Filters and Search inside the module */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3.5 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                      <Filter className="w-3.5 h-3.5" />
                      Filtrar por:
                    </span>

                    {/* State filter inside module */}
                    <select
                      id="filter-state"
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-3xs cursor-pointer"
                    >
                      <option value="">Todos los estados</option>
                      {VENEZUELAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    {/* Category filter inside module */}
                    <select
                      id="filter-category"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-3xs cursor-pointer"
                    >
                      <option value="">Todas las categorías</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Search bar inside module */}
                  <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64 shrink-0">
                    <input
                      type="text"
                      placeholder="Buscar notas informativas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-10 text-slate-800 shadow-3xs"
                    />
                    <button
                      type="submit"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Module Feed Area */}
              <div className="p-6 bg-slate-50/15">
                {/* Active filters inside module */}
                {(selectedState || selectedCategory || searchQuery) && (
                  <div className="flex items-center justify-between bg-indigo-50/40 p-3 mb-5 rounded-xl border border-indigo-100/50 text-xs text-indigo-900">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold">Filtros activos:</span>
                      {selectedState && (
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">Estado: {selectedState}</span>
                      )}
                      {selectedCategory && (
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">Ámbito: {selectedCategory}</span>
                      )}
                      {searchQuery && (
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">Búsqueda: "{searchQuery}"</span>
                      )}
                    </div>
                    <button
                      onClick={handleClearFilters}
                      className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                    >
                      Limpiar todo
                    </button>
                  </div>
                )}

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 animate-pulse">
                        <div className="flex justify-between items-center">
                          <div className="h-4 bg-slate-200 rounded-md w-1/4"></div>
                          <div className="h-4 bg-slate-200 rounded-md w-1/6"></div>
                        </div>
                        <div className="h-6 bg-slate-200 rounded-md w-3/4"></div>
                        <div className="space-y-2">
                          <div className="h-3 bg-slate-200 rounded-md"></div>
                          <div className="h-3 bg-slate-200 rounded-md w-5/6"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-red-700 text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                    <p className="text-sm font-semibold">{error}</p>
                    <button
                      onClick={fetchData}
                      className="text-xs bg-white text-red-700 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium"
                    >
                      Reintentar cargar
                    </button>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="p-12 bg-white rounded-2xl border border-slate-100 text-center space-y-3">
                    <p className="text-slate-400 text-sm italic">No se encontraron notas informativas con los criterios actuales.</p>
                    <button
                      onClick={handleClearFilters}
                      className="text-xs text-indigo-600 font-bold hover:underline"
                    >
                      Ver todas las publicaciones
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {[...notes]
                      .sort((a, b) => {
                        if (sortBy === "recent") {
                          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                        }
                        if (sortBy === "support") {
                          return b.supportCount - a.supportCount;
                        }
                        if (sortBy === "comments") {
                          return b.comments.length - a.comments.length;
                        }
                        return 0;
                      })
                      .map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onSupport={handleSupportNote}
                          onAddComment={handleAddComment}
                          onDelete={handleDeleteNote}
                          isAdminLoggedIn={isAdminLoggedIn}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: AI Advisor & Stats */}
          <div className="lg:col-span-1 space-y-8">
            {/* Realities Advisor (Gemini) */}
            <div>
              <RealitiesAdvisor />
            </div>

            {/* General Dashboard stats summary */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100/50">
                  <Layers className="w-4 h-4" />
                </span>
                <h3 className="font-display font-extrabold text-sm text-slate-800">
                  Resumen Analítico Nacional
                </h3>
              </div>
              <DashboardStats stats={stats} />
            </div>
          </div>
        </div>
      </main>

      {/* Elegant informative footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-16 py-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-semibold text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Venezuela Real — Observatorio Oficial Ciudadano de Realidades Nacionales
            </p>
            <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
              Plataforma libre para la documentación, análisis y visualización de la realidad comunitaria, servicios públicos y resiliencia en Venezuela. Optimizada para la indexación y búsqueda pública en Google Search.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <a 
              href="/sitemap.xml" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-amber-400 transition-colors font-mono font-medium flex items-center gap-1"
            >
              <span>📄 Sitemap.xml</span>
            </a>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <a 
              href="/robots.txt" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-amber-400 transition-colors font-mono font-medium flex items-center gap-1"
            >
              <span>🤖 Robots.txt</span>
            </a>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <button
              onClick={() => {
                if (isAdminLoggedIn) {
                  handleAdminLogout();
                } else {
                  setShowLoginModal(true);
                }
              }}
              className="hover:text-sky-300 font-semibold underline transition-colors cursor-pointer"
            >
              {isAdminLoggedIn ? "Cerrar Sesión de Editor" : "Acceso de Editor"}
            </button>
          </div>
        </div>
      </footer>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100/50">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm text-slate-800">
                      Acceso de Editor Autorizado
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">Alexandercentenonavarro@gmail.com</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    setLoginError("");
                    setLoginPassword("");
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Para publicar notas, historias o estudios científicos, debes ingresar tu contraseña privada de editor.
                </p>

                <div className="space-y-1.5">
                  <label htmlFor="admin-pass-field" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Contraseña del Portal
                  </label>
                  <input
                    id="admin-pass-field"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-mono"
                    autoFocus
                  />
                </div>

                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-200/50 text-red-700 text-xs rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginModal(false);
                      setLoginError("");
                      setLoginPassword("");
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isLoggingIn ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Verificando...
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        Acceder
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showConfirmDeleteAll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm text-slate-900">
                      Eliminar Todas las Notas
                    </h3>
                    <p className="text-[10px] text-rose-600 font-semibold uppercase tracking-wider mt-0.5">Acción Crítica</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfirmDeleteAll(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  ¿Estás absolutamente seguro de que deseas eliminar <strong className="text-rose-700 font-bold">TODAS</strong> las notas y reportes publicados en la plataforma?
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/50 italic">
                  Esta acción vaciará completamente el canal informativo y reiniciará las estadísticas. No se puede deshacer.
                </p>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmDeleteAll(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteAllNotes}
                    disabled={isDeletingAll}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isDeletingAll ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Eliminando...
                      </>
                    ) : (
                      <>
                        Eliminar Todo
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
