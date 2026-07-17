import express from "express";
import fs from "fs/promises";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const DATABASE_FILE = path.join(process.cwd(), "database.json");

app.use(express.json());

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface Note {
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

// Initial realistic seeds reflecting Venezuelan realities
const SEED_NOTES: Note[] = [
  {
    id: "seed-1",
    title: "La resiliencia eléctrica en Maracaibo y las soluciones de energía alternativa",
    content: "En el estado Zulia, los apagones y fluctuaciones de voltaje siguen siendo parte de la rutina diaria. Los comerciantes de Maracaibo han tenido que adaptarse instalando pequeños paneles solares o plantas eléctricas compartidas para evitar que se dañe la mercancía, especialmente los productos refrigerados. Es un ejemplo de cómo los vecinos se organizan para mantener a flote la economía local a pesar de las adversidades.",
    author: "María G. Colmenares",
    category: "Servicios Públicos",
    state: "Zulia",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    supportCount: 42,
    comments: [
      {
        id: "c-1",
        author: "Carlos Rondón",
        content: "Así es, aquí en San Francisco pasamos por lo mismo. Las plantas solares comunitarias son la única opción viable a largo plazo.",
        createdAt: new Date(Date.now() - 1.8 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "c-2",
        author: "Beatriz Uzcátegui",
        content: "Muy buena nota. Refleja perfectamente lo que vivimos a diario.",
        createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    aiAnalysis: "El problema eléctrico en el estado Zulia tiene raíces estructurales de larga data que afectan tanto la producción industrial como la vida doméstica. Las soluciones comunitarias y comerciales de autogeneración representan un fenómeno de privatización informal y descentralización de facto de los servicios públicos, impulsado por la necesidad de subsistencia económica."
  },
  {
    id: "seed-2",
    title: "Mesas Técnicas de Agua en Petare: Organización vecinal para el suministro alterno",
    content: "Ante la falta constante de agua por tubería en los sectores altos de Petare, la comunidad ha reactivado con fuerza las Mesas Técnicas de Agua. Mediante un sistema de autogestión, los vecinos organizan la compra y distribución justa de camiones cisterna y han construido sistemas de recolección de lluvia para abastecer los hogares vulnerables y las escuelas de la zona.",
    author: "Juan Carlos Pérez",
    category: "Iniciativas Comunitarias",
    state: "Miranda",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    supportCount: 56,
    comments: [
      {
        id: "c-3",
        author: "Yelitza Blanco",
        content: "La organización comunitaria en Petare es un ejemplo para toda Caracas. ¡Gran reporte!",
        createdAt: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    aiAnalysis: "Las Mesas Técnicas de Agua y los sistemas de cosecha de agua de lluvia en sectores populares evidencian el surgimiento de infraestructuras comunitarias híbridas. Este tipo de autogestión alivia la crisis inmediata y fomenta la cohesión social, aunque también resalta la brecha en la cobertura estatal de infraestructura básica."
  },
  {
    id: "seed-3",
    title: "El impacto del pasaje urbano en el salario de los trabajadores de Caracas",
    content: "El incremento de la tarifa del pasaje mínimo en camionetas y el sistema Metro de Caracas presiona fuertemente el presupuesto de la familia promedio. Para una persona que vive en los valles del Tuy o en zonas periféricas como Guarenas y trabaja en el centro, el costo del transporte de ida y vuelta puede consumir más de la mitad de sus ingresos mensuales, obligando a buscar alternativas de teletrabajo o emprendimientos informales en sus comunidades.",
    author: "Anónimo",
    category: "Economía y Costo de Vida",
    state: "Distrito Capital",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    supportCount: 89,
    comments: [],
    aiAnalysis: "La inflación en las tarifas de transporte genera un fenómeno de inmovilidad social o 'localización' forzada de la economía, donde los trabajadores prefieren empleos de menor remuneración pero más cercanos a sus hogares para evitar el gasto de traslado. Esto ralentiza el flujo laboral metropolitano."
  },
  {
    id: "seed-4",
    title: "Ferias del Campo en Lara: Productores venden directo al consumidor para abaratar costos",
    content: "En Barquisimeto y El Tocuyo, grupos de agricultores locales han establecido las 'Ferias del Consumo Familiar'. Al eliminar a los intermediarios de la cadena de distribución, logran ofrecer verduras, hortalizas y frutas frescas a precios hasta un 40% menores que en los supermercados tradicionales, garantizando además la venta de su propia cosecha sin pérdidas.",
    author: "Elena Rodríguez",
    category: "Iniciativas Comunitarias",
    state: "Lara",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    supportCount: 65,
    comments: [
      {
        id: "c-4",
        author: "Marcos Torres",
        content: "Excelente iniciativa. El campo larense alimenta a toda Venezuela, debemos apoyar directamente a nuestros campesinos.",
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    aiAnalysis: "Los mercados de productores a consumidores en Lara representan un modelo eficiente de economía solidaria. Ayudan a mitigar los efectos de la inflación de alimentos y los altos costos del combustible de transporte interestatal, creando circuitos locales de producción y consumo resilientes."
  },
  {
    id: "seed-5",
    title: "Estudio sobre la huella hídrica y niveles de cloro residual en redes de agua potable",
    content: "Un grupo de ingenieros sanitarios de la Universidad de Carabobo realizó un muestreo en varias comunidades de Valencia y Naguanagua. El estudio determinó que aunque el agua cruda cumple con ciertos estándares antes del bombeo, el cloro residual libre en los grifos finales es menor al 0.2 mg/L recomendado en el 60% de los hogares analizados debido al deterioro de las tuberías secundarias. Recomiendan hervir el agua o filtrarla activamente antes de su consumo doméstico.",
    author: "Dr. Alberto Méndez (UC)",
    category: "Estudios Científicos y Análisis",
    state: "Carabobo",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    supportCount: 112,
    comments: [],
    aiAnalysis: "Los estudios de calidad microbiológica en redes de distribución local evidencian las consecuencias de la desinversión en el mantenimiento preventivo de acueductos urbanos. El bajo nivel de cloro residual activo incrementa la vulnerabilidad ante brotes hídricos, haciendo de los sistemas domésticos de filtración una necesidad sanitaria obligatoria."
  }
];

// Helper to load notes with caching for maximum performance
let cachedNotes: Note[] | null = null;

async function loadNotes(): Promise<Note[]> {
  if (cachedNotes !== null) {
    return cachedNotes;
  }
  try {
    const data = await fs.readFile(DATABASE_FILE, "utf-8");
    cachedNotes = JSON.parse(data) as Note[];
    return cachedNotes;
  } catch (error) {
    // If database doesn't exist, seed it
    await fs.mkdir(path.dirname(DATABASE_FILE), { recursive: true }).catch(() => {});
    await fs.writeFile(DATABASE_FILE, JSON.stringify(SEED_NOTES, null, 2), "utf-8");
    cachedNotes = [...SEED_NOTES];
    return cachedNotes;
  }
}

// Helper to save notes with in-memory caching and async non-blocking file write
async function saveNotes(notes: Note[]): Promise<void> {
  cachedNotes = notes;
  // Write to filesystem asynchronously without blocking the current request
  fs.writeFile(DATABASE_FILE, JSON.stringify(notes, null, 2), "utf-8")
    .catch(err => console.error("Error writing database.json:", err));
}

// Initialize Gemini Client safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({ apiKey });
    }
  }
  return aiClient;
}

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "venezuela2026";
}

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// Admin verification/login
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === getAdminPassword()) {
    return res.json({ success: true, token: getAdminPassword() });
  }
  return res.status(401).json({ error: "Contraseña de editor incorrecta. Inténtalo de nuevo." });
});

// 1. Get all notes with filtering
app.get("/api/notes", async (req, res) => {
  try {
    const { category, state, search } = req.query;
    let notes = await loadNotes();

    if (category) {
      notes = notes.filter(n => n.category.toLowerCase() === String(category).toLowerCase());
    }
    if (state) {
      notes = notes.filter(n => n.state.toLowerCase() === String(state).toLowerCase());
    }
    if (search) {
      const q = String(search).toLowerCase();
      notes = notes.filter(n => 
        n.title.toLowerCase().includes(q) || 
        n.content.toLowerCase().includes(q) ||
        n.state.toLowerCase().includes(q)
      );
    }

    // Sort by newest first
    notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(notes);
  } catch (error) {
    console.error("Error retrieving notes:", error);
    res.status(500).json({ error: "No se pudieron recuperar las notas." });
  }
});

// 2. Publish a new note with optional AI Contextualization (Admin Only)
app.post("/api/notes", async (req, res) => {
  try {
    const adminPasswordInput = req.headers["x-admin-password"] || req.body.adminPassword;
    if (adminPasswordInput !== getAdminPassword()) {
      return res.status(401).json({ error: "No tienes autorización para publicar. Esta es una sección de acceso restringido para editores autorizados." });
    }

    const { title, content, author, category, state, requestAIContext } = req.body;
    if (!title || !content || !category || !state) {
      return res.status(400).json({ error: "Faltan campos obligatorios para publicar la nota." });
    }

    const notes = await loadNotes();
    const newId = `note-${Date.now()}`;
    const newNote: Note = {
      id: newId,
      title,
      content,
      author: author || "Anónimo",
      category,
      state,
      createdAt: new Date().toISOString(),
      supportCount: 0,
      comments: []
    };

    // Run Gemini analysis if requested
    if (requestAIContext) {
      const ai = getGeminiClient();
      if (ai) {
        try {
          const prompt = `Analiza la siguiente nota sobre la realidad social en Venezuela en el ámbito de "${category}" en el estado "${state}". Proporciona un breve análisis objetivo, constructivo, técnico y sociológico de 2 a 3 líneas sobre las causas estructurales o el impacto de este fenómeno, evitando partidismos políticos y enfocándote en las soluciones de resiliencia social descritas o posibles.

Título de la nota: "${title}"
Contenido de la nota: "${content}"

Análisis breve (máximo 3 líneas en español de tono neutral y profesional):`;

          const aiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
          });

          if (aiResponse && aiResponse.text) {
            newNote.aiAnalysis = aiResponse.text.trim();
          }
        } catch (aiErr) {
          console.error("Error generating Gemini analysis:", aiErr);
          newNote.aiAnalysis = "Análisis de IA no disponible temporalmente debido a un error de conexión.";
        }
      } else {
        newNote.aiAnalysis = "Para activar el análisis sociológico de IA, configura una clave API en la pestaña de Secretos (GEMINI_API_KEY).";
      }
    }

    notes.push(newNote);
    await saveNotes(notes);
    res.status(201).json(newNote);
  } catch (error) {
    console.error("Error publishing note:", error);
    res.status(500).json({ error: "Error al publicar la nota." });
  }
});

// 3. Support / Verify a report (upvote)
app.post("/api/notes/:id/support", async (req, res) => {
  try {
    const { id } = req.params;
    const notes = await loadNotes();
    const index = notes.findIndex(n => n.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Nota no encontrada." });
    }

    notes[index].supportCount += 1;
    await saveNotes(notes);
    res.json({ id, supportCount: notes[index].supportCount });
  } catch (error) {
    console.error("Error supporting note:", error);
    res.status(500).json({ error: "Error al registrar apoyo." });
  }
});

// 4. Add comment to a report
app.post("/api/notes/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { author, content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "El contenido del comentario es requerido." });
    }

    const notes = await loadNotes();
    const index = notes.findIndex(n => n.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Nota no encontrada." });
    }

    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      author: author || "Anónimo",
      content,
      createdAt: new Date().toISOString()
    };

    notes[index].comments.push(newComment);
    await saveNotes(notes);
    res.status(201).json(newComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Error al publicar comentario." });
  }
});

// 5. Delete a note (Admin Only)
app.delete("/api/notes/:id", async (req, res) => {
  try {
    const adminPasswordInput = req.headers["x-admin-password"];
    if (adminPasswordInput !== getAdminPassword()) {
      return res.status(401).json({ error: "No tienes autorización para eliminar notas." });
    }

    const { id } = req.params;
    const notes = await loadNotes();
    const filteredNotes = notes.filter(n => n.id !== id);

    if (notes.length === filteredNotes.length) {
      return res.status(404).json({ error: "Nota no encontrada." });
    }

    await saveNotes(filteredNotes);
    res.json({ success: true, message: "Nota eliminada con éxito." });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Error al eliminar la nota." });
  }
});

// 5b. Delete all notes (Admin Only)
app.delete("/api/notes-all", async (req, res) => {
  try {
    const adminPasswordInput = req.headers["x-admin-password"];
    if (adminPasswordInput !== getAdminPassword()) {
      return res.status(401).json({ error: "No tienes autorización para eliminar todas las notas." });
    }

    await saveNotes([]);
    res.json({ success: true, message: "Todas las notas han sido eliminadas." });
  } catch (error) {
    console.error("Error deleting all notes:", error);
    res.status(500).json({ error: "Error al eliminar todas las notas." });
  }
});

// 5. Get aggregate statistics by State and Category
app.get("/api/stats", async (req, res) => {
  try {
    const notes = await loadNotes();
    
    // Count by state
    const byState: Record<string, number> = {};
    // Count by category
    const byCategory: Record<string, number> = {};

    notes.forEach(note => {
      byState[note.state] = (byState[note.state] || 0) + 1;
      byCategory[note.category] = (byCategory[note.category] || 0) + 1;
    });

    res.json({
      total: notes.length,
      byState,
      byCategory
    });
  } catch (error) {
    console.error("Error compiling stats:", error);
    res.status(500).json({ error: "Error al compilar estadísticas." });
  }
});

// 6. Interactive Venezuelan Realities Advisor / Assistant Chat
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Mensaje vacío." });
    }

    const notes = await loadNotes();
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        reply: "Para chatear con el Asistente Social de Venezuela Real, necesitas configurar tu clave de API GEMINI_API_KEY en la pestaña de Secretos/Ajustes del entorno de AI Studio."
      });
    }

    // Context from reports
    const reportSummary = notes.slice(0, 5).map(n => 
      `- [${n.state}] ${n.title} (Categoría: ${n.category}): "${n.content.substring(0, 150)}..."`
    ).join("\n");

    const systemPrompt = `Eres "Asistente Venezuela Real", un asesor experto en realidades sociales, sociología, resiliencia comunitaria y economía cotidiana de Venezuela.
Tu objetivo es responder de manera sumamente empática, objetiva, constructiva y profesional.
Brindas información confiable sobre desafíos diarios (servicios de electricidad, agua, pasajes, inflación) e iniciativas de apoyo mutuo en las comunidades venezolanas.
Evita el partidismo político, el lenguaje de confrontación o descalificaciones. Concéntrate en el análisis objetivo y las lecciones de organización comunitaria.

Aquí tienes un resumen de algunos reportes recientes publicados en la plataforma para darte contexto real y fresco:
${reportSummary}

Responde de forma clara y directa en español. Si te preguntan sobre datos o análisis de problemas específicos, explica amigablemente el contexto sociopolítico o socioeconómico con respeto y objetividad, animando a la cooperación y solidaridad ciudadana.`;

    // Construct history for Gemini API (making sure it's the official generateContent schema)
    // Structure contents with system instructions inside the main prompt or systemInstruction config parameter
    const contents = [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nPregunta o mensaje del usuario: "${message}"` }]
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    res.json({ reply: response.text || "No se pudo generar una respuesta." });
  } catch (error) {
    console.error("Error in AI Chat:", error);
    res.status(500).json({ error: "El Asistente de IA está experimentando dificultades técnicas." });
  }
});

// 7. Robots.txt for Search Engines / Googlebot
app.get("/robots.txt", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.type("text/plain");
  res.send(`User-agent: *
Allow: /
Sitemap: ${baseUrl}/sitemap.xml
Host: ${req.get("host")}
`);
});

// 8. Sitemap.xml dynamic generator
app.get("/sitemap.xml", async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.type("application/xml");
  
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/#reports</loc>
    <changefreq>always</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/#ai-advisor</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;

  res.send(sitemapXml);
});

// -------------------------------------------------------------
// VITE INTEGRATION MIDDLEWARE
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
