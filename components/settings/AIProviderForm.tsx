"use client";

import { useState } from "react";
import { saveOpenAIKey, saveGeminiKey, saveAIProvider } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Key, Eye, EyeOff, CheckCircle2, Sparkles, Zap } from "lucide-react";

type Provider = "openai" | "gemini";

export function AIProviderForm({
    hasOpenAI,
    hasGemini,
    activeProvider,
}: {
    hasOpenAI: boolean;
    hasGemini: boolean;
    activeProvider: Provider;
}) {
    const [openaiKey, setOpenaiKey] = useState("");
    const [geminiKey, setGeminiKey] = useState("");
    const [showOpenai, setShowOpenai] = useState(false);
    const [showGemini, setShowGemini] = useState(false);
    const [loadingOpenai, setLoadingOpenai] = useState(false);
    const [loadingGemini, setLoadingGemini] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<Provider>(activeProvider);
    const [savingProvider, setSavingProvider] = useState(false);

    const handleSelectProvider = async (p: Provider) => {
        if (p === selectedProvider) return;
        setSavingProvider(true);
        try {
            await saveAIProvider(p);
            setSelectedProvider(p);
            toast.success(`Provedor alterado para ${p === "openai" ? "OpenAI" : "Google Gemini"}!`);
        } catch {
            toast.error("Erro ao salvar preferência.");
        } finally {
            setSavingProvider(false);
        }
    };

    const handleSaveOpenAI = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = openaiKey.trim();
        if (!trimmed.startsWith("sk-") || trimmed.length < 20) {
            toast.error("Chave inválida. Deve começar com 'sk-'");
            return;
        }
        setLoadingOpenai(true);
        try {
            await saveOpenAIKey(trimmed);
            toast.success("Chave OpenAI salva com sucesso!");
            setOpenaiKey("");
        } catch {
            toast.error("Erro ao salvar chave.");
        } finally {
            setLoadingOpenai(false);
        }
    };

    const handleSaveGemini = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = geminiKey.trim();
        if (trimmed.length < 20) {
            toast.error("Chave inválida.");
            return;
        }
        setLoadingGemini(true);
        try {
            await saveGeminiKey(trimmed);
            toast.success("Chave Gemini salva com sucesso!");
            setGeminiKey("");
        } catch {
            toast.error("Erro ao salvar chave.");
        } finally {
            setLoadingGemini(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Provider selector */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">
                    Provedor Ativo para Respostas de IA
                </p>
                <div className="grid grid-cols-2 gap-3">
                    {/* OpenAI */}
                    <button
                        type="button"
                        onClick={() => handleSelectProvider("openai")}
                        disabled={savingProvider}
                        className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                            selectedProvider === "openai"
                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                    >
                        <Zap className={`h-6 w-6 ${selectedProvider === "openai" ? "text-primary-600" : "text-slate-400"}`} />
                        <span className={`text-sm font-bold ${selectedProvider === "openai" ? "text-primary-700 dark:text-primary-300" : "text-slate-600 dark:text-slate-400"}`}>
                            OpenAI GPT
                        </span>
                        <span className="text-[10px] text-slate-400">gpt-4o-mini</span>
                        {selectedProvider === "openai" && (
                            <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary-500" />
                        )}
                        {hasOpenAI && (
                            <span className="text-[9px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                Chave configurada
                            </span>
                        )}
                    </button>

                    {/* Gemini */}
                    <button
                        type="button"
                        onClick={() => handleSelectProvider("gemini")}
                        disabled={savingProvider}
                        className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                            selectedProvider === "gemini"
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                    >
                        <Sparkles className={`h-6 w-6 ${selectedProvider === "gemini" ? "text-blue-600" : "text-slate-400"}`} />
                        <span className={`text-sm font-bold ${selectedProvider === "gemini" ? "text-blue-700 dark:text-blue-300" : "text-slate-600 dark:text-slate-400"}`}>
                            Google Gemini
                        </span>
                        <span className="text-[10px] text-slate-400">gemini-2.0-flash</span>
                        {selectedProvider === "gemini" && (
                            <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-blue-500" />
                        )}
                        {hasGemini && (
                            <span className="text-[9px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                Chave configurada
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* OpenAI key form */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-primary-600">
                        <Key className="h-4 w-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">OpenAI API Key</h4>
                        <p className="text-xs text-slate-500">platform.openai.com/api-keys</p>
                    </div>
                    {hasOpenAI && (
                        <div className="ml-auto flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 dark:bg-green-900/10 px-2 py-1 rounded-full">
                            <CheckCircle2 className="h-3 w-3" /> Conectado
                        </div>
                    )}
                </div>
                <form onSubmit={handleSaveOpenAI} className="flex gap-2">
                    <div className="relative flex-1">
                        <Input
                            type={showOpenai ? "text" : "password"}
                            placeholder="sk-..."
                            value={openaiKey}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOpenaiKey(e.target.value)}
                            className="pr-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 h-11"
                        />
                        <button type="button" onClick={() => setShowOpenai(!showOpenai)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showOpenai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <Button type="submit" disabled={loadingOpenai || !openaiKey}
                        className="bg-primary-600 hover:bg-primary-700 text-white h-11 px-6 rounded-xl">
                        {loadingOpenai ? "Salvando..." : hasOpenAI ? "Atualizar" : "Salvar"}
                    </Button>
                </form>
            </div>

            {/* Gemini key form */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                        <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Google Gemini API Key</h4>
                        <p className="text-xs text-slate-500">aistudio.google.com/app/apikey</p>
                    </div>
                    {hasGemini && (
                        <div className="ml-auto flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 dark:bg-green-900/10 px-2 py-1 rounded-full">
                            <CheckCircle2 className="h-3 w-3" /> Conectado
                        </div>
                    )}
                </div>
                <form onSubmit={handleSaveGemini} className="flex gap-2">
                    <div className="relative flex-1">
                        <Input
                            type={showGemini ? "text" : "password"}
                            placeholder="AIza..."
                            value={geminiKey}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGeminiKey(e.target.value)}
                            className="pr-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 h-11"
                        />
                        <button type="button" onClick={() => setShowGemini(!showGemini)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showGemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <Button type="submit" disabled={loadingGemini || !geminiKey}
                        className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-6 rounded-xl">
                        {loadingGemini ? "Salvando..." : hasGemini ? "Atualizar" : "Salvar"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
