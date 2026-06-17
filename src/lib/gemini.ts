import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
    console.error("CRITICAL: GOOGLE_AI_API_KEY is missing in environment variables.");
}
const genAI = new GoogleGenerativeAI(apiKey || "");

const SYSTEM_PROMPT = `
Eres el evaluador automático de DM Trader. Tu objetivo es proveer feedback constructivo sobre programación.
SIEMPRE debes responder en este formato JSON exacto. El campo "nota" es OBLIGATORIO y debe ser un número del 0 al 100:
{ 
  "nota": 100, 
  "feedback_positivo": ["punto 1", "punto 2"],
  "mejoras": ["mejora 1", "mejora 2"],
  "comentario": "resumen general",
  "resumen_codigo": "resumen técnico"
}
Si encuentras un error o no puedes acceder al repositorio, pon nota 0 y explica el error en el campo 'comentario', pero MANTÉN EL FORMATO JSON.

Matriz de Evaluación Progresiva (Sistemas de 6 Niveles)
Instrucción para el Evaluador: Dependiendo del nivel seleccionado para la tarea, la evaluación deberá ajustar su severidad, su tono y su nivel de exigencia técnica.
`;

export async function gradeSubmission(
    fileName: string,
    content: string | Buffer,
    mimeType?: string,
    severity: number = 1,
    instructions?: string,
    repoMetadata?: any
) {
    try {
        const severityPrompts: Record<number, string> = {
            // ... (severity prompts stay the same)
        };
        const currentSeverityPrompt = severityPrompts[severity as keyof typeof severityPrompts] || severityPrompts[0];

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash", 
            systemInstruction: SYSTEM_PROMPT + "\nCRITERIO DE EVALUACIÓN ACTUAL:\n" + currentSeverityPrompt,
            generationConfig: {
                temperature: 0.0,
            },
            tools: [{ googleSearch: {} } as any]
        }, { apiVersion: "v1beta" });

        let prompt = `Archivo a evaluar: ${fileName}\nPor favor, califica la entrega del estudiante basándote en el nivel de exigencia indicado.`;

        if (instructions) {
            prompt += `\n\n=== ENUNCIADM Y RÚBRICA DE EVALUACIÓN (FUENTE DE VERDAD) ===\n${instructions}\n===========================================================\nUtiliza este enunciado como el criterio ABSOLUTO para evaluar si el estudiante cumplió con lo solicitado.\n`;
        }

        if (repoMetadata) {
            prompt += `\n\n=== METADATOS DEL REPOSITORIO (GitHub) ===\n${JSON.stringify(repoMetadata, null, 2)}\n===========================================\nUsa estos metadatos para validar la autoría y la estructura del proyecto. Si necesitas ver el código fuente detallado para aplicar la rúbrica anterior, utiliza tu herramienta de búsqueda para navegar por el repositorio en GitHub.\n`;
        }

        const parts: any[] = [{ text: prompt }];

        if (mimeType === "application/pdf") {
            parts.push({
                inlineData: {
                    data: (content as Buffer).toString("base64"),
                    mimeType: "application/pdf"
                }
            });
        } else {
            // For code files, we send as text
            parts.push({ text: `CONTENIDM DEL ARCHIVO RECIBIDO:\n${content.toString()}` });
        }

        console.log(`AI Request for ${fileName} (${mimeType || 'text'})`);

        let result;
        let retries = 0;
        const maxRetries = 4; // Allow up to 4 retries for heavy traffic (Wait times: 2s, 4s, 8s, 16s = ~30s max wait)

        while (retries <= maxRetries) {
            try {
                result = await model.generateContent(parts);
                break; // Success, exit retry loop
            } catch (apiError: any) {
                const isRateLimit = apiError.message?.includes("429") || apiError.status === 429;

                if (isRateLimit && retries < maxRetries) {
                    retries++;
                    const waitTime = Math.pow(2, retries) * 1000; // 2s, 4s, 8s, 16s
                    console.warn(`[Anti-Crash] Quota exceeded. Retrying in ${waitTime / 1000}s (Attempt ${retries}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                } else {
                    // Propagate other errors or if we run out of retries
                    throw apiError;
                }
            }
        }

        if (!result) throw new Error("Generative API failed after max retries");

        const response = await result.response;
        let text = response.text();

        console.log("Raw Response from AI:", text);

        // Robust JSON extraction
        const extractJson = (input: string) => {
            try {
                // Try direct parse
                return JSON.parse(input);
            } catch (e) {
                // Try markdown block
                const match = input.match(/```json\s*([\s\S]*?)\s*```/) || input.match(/```\s*([\s\S]*?)\s*```/);
                if (match && match[1]) {
                    try { return JSON.parse(match[1]); } catch (e2) { /* continue */ }
                }

                // Try finding the first '{' and last '}'
                const firstBrace = input.indexOf('{');
                const lastBrace = input.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1) {
                    try { return JSON.parse(input.substring(firstBrace, lastBrace + 1)); } catch (e3) { /* continue */ }
                }
                
                return null;
            }
        };

        const parsed = extractJson(text);

        if (parsed) {
            // Normalization
            if (parsed.score !== undefined && parsed.nota === undefined) parsed.nota = parsed.score;
            if (parsed.grade !== undefined && parsed.nota === undefined) parsed.nota = parsed.grade;
            if (parsed.punteo !== undefined && parsed.nota === undefined) parsed.nota = parsed.punteo;
            if (parsed.calificacion !== undefined && parsed.nota === undefined) parsed.nota = parsed.calificacion;

            // Force number
            if (parsed.nota !== undefined && parsed.nota !== null) {
                parsed.nota = Number(parsed.nota);
            }

            // BACKWARDS COMPATIBILITY: Ensure 'text' exists for simpler UI components
            if (!parsed.text) {
                const positives = Array.isArray(parsed.feedback_positivo) ? parsed.feedback_positivo.join(". ") : "";
                const improvements = Array.isArray(parsed.mejoras) ? parsed.mejoras.join(". ") : "";
                const comment = parsed.comentario || "";
                parsed.text = `${comment}\n\nAspectos Positivos: ${positives}\n\nAspectos de Mejora: ${improvements}`.trim();
            }
            return parsed;
        } else {
            console.error("Critical: AI returned non-JSON content:", text);
            // Fallback for UI safety
            return {
                nota: 0,
                feedback_positivo: [],
                mejoras: ["La IA no pudo procesar la entrega correctamente."],
                comentario: `Error de formato en la respuesta de la IA. Mensaje original: ${text.substring(0, 200)}...`,
                resumen_codigo: "FALLO_IA",
                text: "Error al procesar la entrega. Por favor intenta calificar nuevamente."
            };
        }
    } catch (error) {
        console.error("Error grading with Gemini:", error);
        throw error;
    }
}

export async function generateTechNewsAI() {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: "Eres el editor en jefe de un portal tecnológico de élite. Tu misión es proporcionar información real y precisa en formato JSON estrictamente válido.",
            tools: [{ googleSearch: {} } as any]
        }, { apiVersion: "v1beta" });

        // Obtenemos la fecha exacta de hoy para forzar a la IA a buscar en esa fecha
        const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const prompt = `ACTIVA TU HERRAMIENTA DE BÚSQUEDA DE GOOGLE AHORA MISMO.
        Busca las noticias tecnológicas más importantes de HOY (${today}).
        No inventes respuestas. Usa la web.
        
        TODM EN ESPAÑOL.
        Genera un JSON con 4 noticias MUNDIALES de altísimo impacto sobre: IA, Desarrollo de Software, SpaceTech o Big Tech.
        
        REGLAS PARA search_url:
        - Crea una URL de búsqueda en Google News con los términos exactos de la noticia.
        - Formato: https://www.google.com/search?q=[SITIO+ORIGEN]+[TITULO+CORTO]&tbm=nws
        
        JSON Structure:
        { "news": [{ "title": "Título corto y real", "summary": "Resumen", "date": "HOY", "source": "Xataka", "search_url": "https://www.google.com/search?q=Xataka+Apple+Vision+Pro&tbm=nws", "image_keyword": "tech glowing blue", "grad": "from-blue-600/30 to-transparent" }] }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        if (text.includes("```json")) {
            text = text.split("```json")[1].split("```")[0];
        } else if (text.includes("```")) {
            text = text.split("```")[1].split("```")[0];
        }
        
        const parsed = JSON.parse(text);
        if (!parsed.news || !Array.isArray(parsed.news)) throw new Error("Estructura JSON inválida: Falta array 'news'");
        return parsed.news;
    } catch (error: any) {
        console.error("Error generating news with AI:", error);
        throw new Error("Fallo de Modelo AI: " + (error.message || "Error Desconocido"));
    }
}

export async function analyzePlagiarismSimilarity(codeA: string, codeB: string, studentA: string, studentB: string) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: "Eres un experto en auditoría de código y detección de plagio. Tu misión es analizar dos fragmentos de código y explicar de forma técnica y argumentada por qué existe una alta similitud entre ellos. Debes detectar si hay patrones de lógica idénticos, estructuras de control sospechosamente similares o nombres de variables compartidos. Responde en español.",
            generationConfig: {
                temperature: 0.2,
            }
        }, { apiVersion: "v1beta" });

        const prompt = `Analiza los siguientes dos códigos y explica los puntos clave de similitud.
Estudiante A: ${studentA}
Estudiante B: ${studentB}

CÓDIGO A:
${codeA}

CÓDIGO B:
${codeB}

Genera un informe breve de máximo 3 párrafos explicando los motivos técnicos del plagio.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error analyzing plagiarism with AI:", error);
        return "El análisis automático no está disponible en este momento debido a un error técnico.";
    }
}
