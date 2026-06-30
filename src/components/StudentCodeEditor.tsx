"use client";

import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Play, Send, CheckCircle, XCircle, AlertCircle, Maximize2, Minimize2, Copy, Trash2, Cpu, Code, Clock, Lock, Loader2, FileText } from "lucide-react";
import { submitCodingExercise } from "@/actions/submissions";

interface StudentCodeEditorProps {
    initialCode?: string;
    exerciseDescription?: string; // Keep this for now, but its rendering will be removed.
    testCases?: Array<{ input: string; output: string }>;
    similarityThreshold?: number;
    enablePlagiarism?: boolean;
    enableCopyPaste?: boolean;
    isLate?: boolean;
    onSuccess?: (grade: number) => void;
    dayId: string;
    userId: string;
    timeLimit?: number; // In minutes
    testStartedAt?: Date | string | null;
    isReadOnly?: boolean;
}

const pyodideWorkerCode = `
importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodideReadyPromise;

async function load() {
  self.pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
  });
  self.postMessage({ type: "loaded" });
}
pyodideReadyPromise = load();

self.onmessage = async (event) => {
  await pyodideReadyPromise;
  const { id, code, testCases } = event.data;
  
  try {
      let allOutput = "";
      let generatedOutputs = [];

      const isValidationMode = testCases && testCases.length > 0;
      const casesToRun = isValidationMode ? testCases : [{ input: event.data.userInput || "", output: "" }];

      for (let i = 0; i < casesToRun.length; i++) {
          const tc = casesToRun[i];
          
          let capturedOutput = "";
          let stdinQueue = tc.input ? tc.input.split("\\n") : [];
          
          let lastFlush = Date.now();
          let stdoutBuffer = "";

          self.onStdout = (text) => {
              capturedOutput += text;
              if (!isValidationMode) {
                  stdoutBuffer += text;
                  const now = Date.now();
                  if (now - lastFlush > 50) {
                      self.postMessage({ type: "stdout", id, text: stdoutBuffer });
                      stdoutBuffer = "";
                      lastFlush = now;
                  }
              }
          };

          if (!self.hasPatchedInput) {
              self.pyodide.runPython(\`
import sys
import builtins
import js

class JSStdout:
    def write(self, s):
        js.self.onStdout(s)
        return len(s)
    def flush(self):
        pass
    def isatty(self):
        return True

sys.stdout = JSStdout()
sys.stderr = JSStdout()

if not hasattr(builtins, "_original_input"):
    builtins._original_input = builtins.input

def input_mock(prompt=""):
    if prompt:
        sys.stdout.write(prompt)
        sys.stdout.flush()
    return builtins._original_input()

builtins.input = input_mock
              \`);
              self.hasPatchedInput = true;
          }

          self.pyodide.setStdin({
              stdin: () => {
                  if (stdinQueue.length === 0) return undefined;
                  const val = stdinQueue.shift();
                  const echo = val + "\\n";
                  capturedOutput += echo;
                  if (!isValidationMode) {
                      self.postMessage({ type: "stdout", id, text: echo });
                  }
                  return echo;
              }
          });

          try {
              const globals = self.pyodide.globals.get('dict')();
              globals.set("__name__", "__main__");
              await self.pyodide.runPythonAsync(code, { globals });
              globals.destroy();
              
              if (!isValidationMode && stdoutBuffer) {
                  self.postMessage({ type: "stdout", id, text: stdoutBuffer });
                  stdoutBuffer = "";
              }

              const actual = capturedOutput.trim();
              
              if (isValidationMode) {
                  const expected = tc.output ? tc.output.trim() : "";
                  const isMatch = actual === expected;
                  
                  allOutput += \`--- CASO DE PRUEBA \${i + 1}: \${isMatch ? "✅ PASÓ" : "❌ FALLÓ"} ---\\n\`;
                  if (!isMatch) {
                      allOutput += \`[Esperado]: \${expected || "(Vacio)"}\\n\`;
                      allOutput += \`[Obtenido]: \${actual || "(Sin salida)"}\\n\`;
                  } else {
                      allOutput += \`[Salida]: \${actual || "(Correcta)"}\\n\`;
                  }
                  allOutput += "\\n";
              } else {
                  allOutput += capturedOutput;
              }
              
              generatedOutputs.push(actual);
          } catch (err) {
              let msg = err.message;
              const isEOF = msg.includes("EOFError");
              
              if (isEOF && !isValidationMode) {
                  // Caso solicitado: Finalización elegante al agotarse la entrada
                  const quietMsg = "\\n\\n(Ejecución finalizada: se agotó la entrada)";
                  self.postMessage({ type: "stdout", id, text: quietMsg });
                  allOutput += capturedOutput + quietMsg;
                  generatedOutputs.push(capturedOutput.trim());
              } else {
                  // Errores normales o EOF en modo validación
                  const friendlyMsg = isEOF 
                    ? "⚠️ ERROR DE ENTRADA: Se solicitó un dato (input) pero la pestaña 'ENTRADA' está vacía."
                    : msg;
                    
                  if (isValidationMode) {
                      allOutput += "--- CASO DE PRUEBA " + (i + 1) + ": ⚠️ ERROR ---\\n";
                      allOutput += "[Error]: " + friendlyMsg + "\\n\\n";
                  } else {
                      allOutput += "\\nError: " + friendlyMsg + "\\n";
                      self.postMessage({ type: "stdout", id, text: "\\nError: " + friendlyMsg + "\\n" });
                  }
                  generatedOutputs.push(""); 
              }
          }
      }

      self.postMessage({ type: "result", id, allOutput, generatedOutputs });
  } catch (error) {
      self.postMessage({ type: "error", id, error: error.message });
  }
};
`;

export default function StudentCodeEditor({
    initialCode = "# Escribe aquí tu solución...",
    exerciseDescription,
    testCases = [],
    similarityThreshold = 0.9,
    enablePlagiarism = false,
    enableCopyPaste = false,
    isLate = false,
    onSuccess,
    dayId,
    userId,
    timeLimit,
    testStartedAt,
    isReadOnly = false,
}: StudentCodeEditorProps) {
    const [code, setCode] = useState(initialCode);
    const [output, setOutput] = useState("");
    const [outputsArray, setOutputsArray] = useState<string[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ status: 'success' | 'error' | 'pending' | 'ai-pending' | null, score: number | null, message?: string }>({ status: null, score: null });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPyodideLoading, setIsPyodideLoading] = useState(true);
    const [userInput, setUserInput] = useState("");
    const [activeTab, setActiveTab] = useState<'output' | 'input'>('output');

    const editorRef = useRef<any>(null);
    const workerRef = useRef<Worker | null>(null);
    const executionIdRef = useRef(0);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const autoSubmitTriggered = useRef(false);

    const codeRef = useRef(code);
    const outputsArrayRef = useRef(outputsArray);

    useEffect(() => { codeRef.current = code; }, [code]);
    useEffect(() => { outputsArrayRef.current = outputsArray; }, [outputsArray]);

    // Timer Logic
    useEffect(() => {
        if (!timeLimit || !testStartedAt) {
            setTimeLeft(null);
            return;
        }

        const start = new Date(testStartedAt).getTime();
        const limitMs = timeLimit * 60 * 1000;
        const end = start + limitMs;

        const updateTimer = () => {
            const now = Date.now();
            const remaining = Math.max(0, end - now);
            setTimeLeft(Math.floor(remaining / 1000));

            if (remaining <= 0 && !autoSubmitTriggered.current && !isSubmitting && !result.status) {
                autoSubmitTriggered.current = true;
                console.log("[TIMER] Time's up! Auto-submitting...");
                handleAutoSubmit();
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [timeLimit, testStartedAt, isSubmitting, result.status]);

    const handleAutoSubmit = async () => {
        setIsSubmitting(true);
        setResult({ status: 'pending', score: null });

        try {
            const res = await submitCodingExercise({
                userId,
                dayId,
                code: codeRef.current || " ", // Submit fresh code via ref
                outputs: outputsArrayRef.current 
            });
            console.log("Auto-submit result:", res);
        } catch (e) {
            console.error("Auto-submit error:", e);
        }
        
        window.location.reload(); // Force refresh to show success state
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Autosave logic
    useEffect(() => {
        const savedCode = localStorage.getItem(`autosave-${dayId}-${userId}`);
        if (savedCode && savedCode !== initialCode) {
            setCode(savedCode);
        }
    }, [dayId, userId, initialCode]);

    useEffect(() => {
        if (code === initialCode) return;
        const timer = setTimeout(() => {
            localStorage.setItem(`autosave-${dayId}-${userId}`, code);
        }, 1000); // 1 second debounce
        return () => clearTimeout(timer);
    }, [code, dayId, userId, initialCode]);

    const initWorker = () => {
        if (workerRef.current) workerRef.current.terminate();
        
        const blob = new Blob([pyodideWorkerCode], { type: "application/javascript" });
        const worker = new Worker(URL.createObjectURL(blob));
        workerRef.current = worker;

        worker.onmessage = (e) => {
            const { type, id, allOutput, generatedOutputs, error, text } = e.data;
            if (type === "loaded") {
                setIsPyodideLoading(false);
            } else if (type === "stdout" && id === executionIdRef.current) {
                setOutput(prev => prev + text);
            } else if (type === "result" && id === executionIdRef.current) {
                setOutput(allOutput);
                setOutputsArray(generatedOutputs || []);
                setIsExecuting(false);
            } else if (type === "error" && id === executionIdRef.current) {
                setOutput(prev => prev + `\n> Error General: ${error}`);
                setIsExecuting(false);
            }
        };

        return worker;
    };

    const stopWorker = () => {
        if (workerRef.current) {
            workerRef.current.terminate();
            setIsExecuting(false);
            setIsPyodideLoading(true);
            initWorker(); // Restart a clean worker
        }
    };

    // Initialize Web Worker
    useEffect(() => {
        initWorker();
        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    // Anti-Plagiarism logic - Configurable via Admin
    useEffect(() => {
        if (enableCopyPaste) return; // If enabled, we don't add restrictions

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            
            // Check if the target is inside the Monaco Editor
            const isInsideEditor = target.closest('.monaco-editor');

            if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
                if (isInsideEditor) {
                    e.preventDefault();
                    e.stopPropagation();
                    alert("El copiado y pegado está deshabilitado en el editor de código para este ejercicio.");
                }
            }
        };

        const handleContextMenu = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('.monaco-editor')) {
                e.preventDefault();
            }
        };

        const handlePaste = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            const isInsideEditor = target.closest('.monaco-editor');

            if (isInsideEditor) {
                e.preventDefault();
                e.stopPropagation();
                alert("Pegar código está deshabilitado en el editor.");
            }
        };

        // Use capture mode to intercept events before Monaco handles them
        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('contextmenu', handleContextMenu, true);
        window.addEventListener('paste', handlePaste, true);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('contextmenu', handleContextMenu, true);
            window.removeEventListener('paste', handlePaste, true);
        };
    }, [enableCopyPaste]);

    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor;
    };

    const handleExecute = (withTestCases: boolean = false) => {
        if (!workerRef.current || isPyodideLoading) {
            setOutput("Espere a que el motor de Python se inicie...");
            return;
        }

        setIsExecuting(true);
        setOutput("");
        setResult({ status: null, score: null });
        setOutputsArray([]);

        executionIdRef.current += 1;
        workerRef.current.postMessage({
            id: executionIdRef.current,
            code,
            testCases: withTestCases ? testCases : [],
            userInput: userInput
        });
        if (!withTestCases) setActiveTab('output');
    };

    const handleSubmit = async () => {
        if (outputsArray.length === 0 && !isExecuting) {
            alert("Primero ejecuta el código para correr los casos de prueba.");
            return;
        }

        setIsSubmitting(true);
        setResult({ status: 'pending', score: null });

        try {
            const res = await submitCodingExercise({
                userId,
                dayId,
                code,
                outputs: outputsArray
            });

            if (res.success && res.submission) {
                if (res.submission.status === 'PENDING') {
                    setResult({ 
                        status: 'ai-pending', 
                        score: null, 
                        message: (res.submission.feedback as any)?.text || "Entrega recibida. Procesando calificación..." 
                    });
                } else {
                    setResult({ status: 'success', score: res.similarity || 0 });
                    if (onSuccess) onSuccess(res.similarity || 0);
                }
            } else {
                setResult({ status: 'error', score: 0 });
            }
        } catch (e) {
            setResult({ status: 'error', score: 0 });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`flex flex-col bg-[#0a0e1a] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all ${isFullscreen ? 'fixed inset-0 z-[9999] rounded-none' : 'relative h-[650px]'}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#0d1322] border-b border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                        <Code size={18} className="text-sky-400" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">Python IDE</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            {isPyodideLoading ? (
                                <Loader2 size={10} className="text-sky-400 animate-spin" />
                            ) : (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            )}
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">
                                {isPyodideLoading ? "Iniciando Python 3.10..." : "Motor Python Activo • Real Runtime"}
                            </p>
                        </div>
                    </div>
                </div>

                {timeLeft !== null && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                        <Clock size={16} className={`${timeLeft < 60 ? "text-rose-500 animate-pulse" : "text-rose-400"}`} />
                        <span className={`text-sm font-black font-mono ${timeLeft < 60 ? "text-rose-500" : "text-white"}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                    <div className="h-6 w-[1px] bg-slate-800 mx-1"></div>
                    <button
                        onClick={() => isExecuting ? stopWorker() : handleExecute(false)}
                        disabled={isSubmitting || isPyodideLoading}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border active:scale-95 disabled:opacity-50 ${
                            isExecuting 
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20" 
                            : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                        }`}
                        title={isExecuting ? "Detener ejecución inmediata" : "Ejecuta tu código para ver la salida"}
                    >
                        {isExecuting ? <XCircle size={14} className="animate-pulse" /> : <Play size={14} />}
                        {isExecuting ? "Detener" : "Correr Código"}
                    </button>

                    {testCases.length > 0 && (
                        <button
                            onClick={() => handleExecute(true)}
                            disabled={isExecuting || isSubmitting || isPyodideLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border border-sky-500/20 active:scale-95 disabled:opacity-50"
                            title="Prueba tu código con casos configurados"
                        >
                            <Cpu size={14} />
                            Validar Casos
                        </button>
                    )}

                    <div className="h-6 w-[1px] bg-slate-800 mx-1"></div>
                    {!isReadOnly && (
                        <button
                            onClick={handleSubmit}
                            disabled={isExecuting || isSubmitting || isPyodideLoading || isLate}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-lg active:scale-95 ${isLate
                                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                    : "bg-sky-600 hover:bg-sky-500 text-white shadow-[0_0_20px_rgba(56,189,248,0.3)]"
                                }`}
                        >
                            {isSubmitting ? "Subiendo..." : isLate ? "Expirado" : "Enviar Lab"}
                            <Send size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row min-h-0">
                {/* Editor Area */}
                <div className="flex-1 flex flex-col min-h-[400px] relative border-r border-slate-800 bg-[#060810]">
                    <div className="flex-1 relative flex flex-col min-h-0">
                        <Editor
                            height="100%"
                            defaultLanguage="python"
                            theme="vs-dark"
                            value={code}
                            onChange={(val) => setCode(val || "")}
                            onMount={handleEditorDidMount}
                            options={{
                                fontSize: 13,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 20 },
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                cursorBlinking: "expand",
                                lineNumbersMinChars: 3,
                                glyphMargin: false,
                                folding: true,
                                lineHeight: 22,
                                readOnly: isReadOnly,
                            }}
                        />
                        {enablePlagiarism && (
                            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                                <Lock size={12} className="text-amber-500" />
                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">No Copy enabled</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Console Area */}
                <div className="w-full md:w-80 flex flex-col bg-[#0d1322]">
                    <div className="flex items-center px-1 bg-[#0d1322] border-b border-slate-800">
                        <button 
                            onClick={() => setActiveTab('output')}
                            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === 'output' ? 'text-sky-400 bg-sky-500/5 border-b-2 border-sky-500' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Cpu size={14} />
                            Salida
                        </button>
                        <button 
                            onClick={() => setActiveTab('input')}
                            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === 'input' ? 'text-amber-400 bg-amber-500/5 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <FileText size={14} />
                            Entrada
                        </button>
                        <button onClick={() => { setOutput(""); setOutputsArray([]); }} className="p-3 text-slate-500 hover:text-white transition-colors">
                            <Trash2 size={12} />
                        </button>
                    </div>

                    <div className="flex-1 font-mono text-xs bg-black/40 flex flex-col min-h-0">
                        {activeTab === 'output' ? (
                            <div className="flex-1 p-6 overflow-y-auto">
                                {!output && !result.status && (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale">
                                        <AlertCircle size={28} className="mb-4 text-slate-600" />
                                        <p className="text-[10px] text-slate-500 leading-relaxed uppercase font-black tracking-wider">
                                            Presiona "Correr Código" para ver la<br />salida de tu programa.
                                        </p>
                                    </div>
                                )}

                                {output && (
                                    <div className="animate-in fade-in duration-300">
                                        <pre className="text-sky-400 whitespace-pre-wrap leading-relaxed">{output}</pre>
                                    </div>
                                )}

                                {result.status && result.status !== 'ai-pending' && (
                                    <div className={`mt-6 p-4 rounded-xl border animate-in slide-in-from-bottom-2 duration-500 ${result.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
                                        }`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            {result.status === 'success' ? (
                                                <CheckCircle size={18} className="text-emerald-400" />
                                            ) : (
                                                <XCircle size={18} className="text-rose-400" />
                                            )}
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${result.status === 'success' ? 'text-emerald-400' : 'text-rose-400'
                                                }`}>
                                                {result.status === 'success' ? 'Laboratorio Superado' : 'Error en Validación'}
                                            </span>
                                        </div>
                                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider leading-relaxed mb-4">
                                            {result.status === 'success'
                                                ? 'Tu código se ejecutó y la salida coincide con lo esperado.'
                                                : 'La salida de tu programa es diferente a lo esperado por el profesor.'}
                                        </p>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">SIMILITUD</span>
                                            <span className={`text-lg font-black ${result.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {result.score}%
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {result.status === 'ai-pending' && (
                                    <div className="mt-6 p-6 rounded-2xl bg-sky-500/10 border border-sky-500/20 animate-in zoom-in-95 duration-500">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center">
                                                <Send size={18} className="text-sky-400 animate-pulse" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-white uppercase tracking-widest">Entrega Recibida</h4>
                                                <p className="text-[9px] text-sky-400 font-black uppercase tracking-wider mt-0.5">Modo: Revisión IA Diferida</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-black/40 rounded-xl border border-slate-800">
                                            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                                                {result.message}
                                            </p>
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                            <span>Estado</span>
                                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 uppercase tracking-wider">En cola de calificación</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col p-4 bg-black/20 divide-y divide-slate-800">
                                <div className="pb-4">
                                    <div className="flex items-center gap-2 mb-3 text-amber-400/70">
                                        <FileText size={12} />
                                        <span className="text-[9px] font-black uppercase tracking-wider">Entrada de Usuario (input())</span>
                                    </div>
                                    <textarea
                                        value={userInput}
                                        readOnly={isReadOnly}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        placeholder="Escribe aquí los datos que usará input(). Usa una línea por cada llamada a input()."
                                        className="w-full h-40 bg-[#05070f] border border-slate-800 rounded-lg p-3 text-slate-300 resize-none focus:outline-none focus:border-amber-500/30 font-mono text-xs leading-5"
                                    />
                                </div>
                                <div className="pt-4">
                                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                                        <p className="text-[9px] text-amber-500/60 leading-relaxed font-semibold">
                                            💡 <span className="font-bold">¿Cómo usarlo?</span> Cada línea que escribas aquí simula una entrada de teclado para tu script. Si tu código pide nombre y edad, escribe el nombre en la línea 1 y la edad en la línea 2.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer of console */}
                    <div className="p-4 bg-[#0d1322] border-t border-slate-800">
                        <div className="flex items-center justify-between mb-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Estado del Motor</span>
                            <span className={isPyodideLoading ? "text-amber-500 animate-pulse" : "text-emerald-500"}>
                                {isPyodideLoading ? "Cargando..." : "Listo"}
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div
                                className={`h-full transition-all duration-1000 ${isPyodideLoading ? 'bg-amber-500 w-1/2' : 'bg-emerald-500 w-full'}`}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
