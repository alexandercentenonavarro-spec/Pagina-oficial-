import React from "react";
import { Stats } from "../types";
import { BarChart3, Map, Layout, Sparkles, TrendingUp, Zap, HeartPulse, MessageSquare, Users, BookOpen } from "lucide-react";

interface DashboardStatsProps {
  stats: Stats;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  // Safe extraction of categories and states
  const totalReports = stats?.total || 0;
  const categoriesList = stats?.byCategory ? Object.entries(stats.byCategory) : [];
  const statesList = stats?.byState ? Object.entries(stats.byState) : [];

  // Sort states by count (descending) and take top 4
  const topStates = [...statesList]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Economía y Costo de Vida":
        return "bg-amber-500";
      case "Servicios Públicos":
        return "bg-sky-500";
      case "Salud y Educación":
        return "bg-emerald-500";
      case "Historias de Vida":
        return "bg-rose-500";
      case "Iniciativas Comunitarias":
        return "bg-purple-500";
      case "Estudios Científicos y Análisis":
        return "bg-teal-500";
      default:
        return "bg-slate-400";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Economía y Costo de Vida":
        return <TrendingUp className="w-3.5 h-3.5 text-amber-500" />;
      case "Servicios Públicos":
        return <Zap className="w-3.5 h-3.5 text-sky-500" />;
      case "Salud y Educación":
        return <HeartPulse className="w-3.5 h-3.5 text-emerald-500" />;
      case "Historias de Vida":
        return <MessageSquare className="w-3.5 h-3.5 text-rose-500" />;
      case "Iniciativas Comunitarias":
        return <Users className="w-3.5 h-3.5 text-purple-500" />;
      case "Estudios Científicos y Análisis":
        return <BookOpen className="w-3.5 h-3.5 text-teal-500" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Grid container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total reports */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Reportado</span>
            <h4 className="font-display text-3xl font-bold text-slate-800 mt-1">{totalReports}</h4>
            <p className="text-[10px] text-slate-500 mt-1">Notas informativas del pueblo</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Layout className="w-6 h-6" />
          </div>
        </div>

        {/* Top active state */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estados Activos</span>
            <h4 className="font-display text-xl font-bold text-slate-800 mt-2">
              {statesList.length > 0 ? `${statesList.length} Estados` : "Cargando..."}
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">Con reportes sobre su realidad</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Map className="w-6 h-6" />
          </div>
        </div>

        {/* Principal issue */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enfoque Social</span>
            <h4 className="font-display text-base font-bold text-slate-800 mt-2 line-clamp-1">
              {categoriesList.length > 0 
                ? [...categoriesList].sort((a, b) => b[1] - a[1])[0][0] 
                : "Multidisciplinario"
              }
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">Ámbito con mayor participación</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Distribution visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Categories breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs">
          <h5 className="font-display font-bold text-sm text-slate-800 mb-4 flex items-center gap-1.5">
            Distribución por Ámbitos
          </h5>
          <div className="space-y-3.5">
            {categoriesList.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No hay suficientes datos disponibles.</p>
            ) : (
              categoriesList.map(([catName, count]) => {
                const percentage = totalReports > 0 ? Math.round((count / totalReports) * 100) : 0;
                return (
                  <div key={catName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium flex items-center gap-1.5">
                        {getCategoryIcon(catName)}
                        {catName}
                      </span>
                      <span className="text-slate-500 font-mono font-semibold">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${getCategoryColor(catName)}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top States breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs">
          <h5 className="font-display font-bold text-sm text-slate-800 mb-4 flex items-center gap-1.5">
            Estados con Mayor Registro
          </h5>
          <div className="space-y-3">
            {topStates.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Esperando primeros registros.</p>
            ) : (
              topStates.map(([stateName, count]) => {
                const percentage = totalReports > 0 ? Math.round((count / totalReports) * 100) : 0;
                return (
                  <div key={stateName} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                      <span className="text-xs font-semibold text-slate-700">{stateName}</span>
                    </div>
                    <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 border border-slate-100 rounded-md text-slate-600">
                      {count} {count === 1 ? 'reporte' : 'reportes'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
