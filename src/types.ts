export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  state: string;
  createdAt: string;
  supportCount: number;
  comments: Comment[];
  aiAnalysis?: string;
}

export interface Stats {
  total: number;
  byState: Record<string, number>;
  byCategory: Record<string, number>;
}

export const VENEZUELAN_STATES = [
  "Amazonas",
  "Anzoátegui",
  "Apure",
  "Aragua",
  "Barinas",
  "Bolívar",
  "Carabobo",
  "Cojedes",
  "Delta Amacuro",
  "Distrito Capital",
  "Falcón",
  "Guárico",
  "Lara",
  "Mérida",
  "Miranda",
  "Monagas",
  "Nueva Esparta",
  "Portuguesa",
  "Sucre",
  "Táchira",
  "Trujillo",
  "La Guaira",
  "Yaracuy",
  "Zulia"
];

export const CATEGORIES = [
  "Economía y Costo de Vida",
  "Servicios Públicos",
  "Salud y Educación",
  "Historias de Vida",
  "Iniciativas Comunitarias",
  "Estudios Científicos y Análisis"
];

export const CATEGORY_COLORS: Record<string, string> = {
  "Economía y Costo de Vida": "bg-amber-50 text-amber-700 border-amber-200",
  "Servicios Públicos": "bg-sky-50 text-sky-700 border-sky-200",
  "Salud y Educación": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Historias de Vida": "bg-rose-50 text-rose-700 border-rose-200",
  "Iniciativas Comunitarias": "bg-purple-50 text-purple-700 border-purple-200",
  "Estudios Científicos y Análisis": "bg-teal-50 text-teal-700 border-teal-200",
};

export const CATEGORY_ICONS: Record<string, string> = {
  "Economía y Costo de Vida": "TrendingUp",
  "Servicios Públicos": "Zap",
  "Salud y Educación": "HeartPulse",
  "Historias de Vida": "MessageSquare",
  "Iniciativas Comunitarias": "Users",
  "Estudios Científicos y Análisis": "BookOpen",
};
