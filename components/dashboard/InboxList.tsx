"use client";

import { useState } from "react";
import { approveAndSendInteraction, ignoreInteraction } from "@/actions/interactions";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp, Trash2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export function InboxList({ records }: { records: any[] }) {
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
    const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});

    const handleApprove = async (interactionId: string, currentStatus: string) => {
        if (currentStatus === "COMPLETED") return; // Safety

        const textToApprove = editedTexts[interactionId] || records.find(r => r.id === interactionId)?.ai_response || "";

        setLoadingMap(prev => ({ ...prev, [interactionId]: true }));
        try {
            const { success, error } = await approveAndSendInteraction(interactionId, textToApprove);
            if (success) {
                toast.success("Resposta enviada com sucesso!");
            } else {
                toast.error(`Erro ao enviar: ${error}`);
            }
        } finally {
            setLoadingMap(prev => ({ ...prev, [interactionId]: false }));
        }
    };

    const handleIgnore = async (interactionId: string) => {
        setLoadingMap(prev => ({ ...prev, [interactionId]: true }));
        try {
            const { success } = await ignoreInteraction(interactionId);
            if (success) {
                toast.info("Interação descartada.");
            }
        } finally {
            setLoadingMap(prev => ({ ...prev, [interactionId]: false }));
        }
    };

    const pending = records.filter(r => r.status === "DRAFT" || r.status === "FAILED");
    const completed = records.filter(r => r.status === "COMPLETED");

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <MessageSquare className="h-5 w-5 text-primary-600" />
                    Copiloto de Atendimento ({pending.length} Pendentes)
                </h2>

                {pending.length === 0 && (
                    <div className="p-8 border rounded-xl border-dashed flex flex-col items-center justify-center text-slate-500 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-400">
                        <ThumbsUp className="h-8 w-8 mb-2 opacity-20" />
                        <p>Nenhuma mensagem aguardando revisão. Você está em dia!</p>
                    </div>
                )}

                <div className="space-y-4">
                    <AnimatePresence>
                        {pending.map((record) => (
                            <motion.div
                                key={record.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                                className="border rounded-xl p-5 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-4"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-full">
                                                {record.platform} • {record.interaction_type}
                                            </span>
                                            {record.status === 'FAILED' && (
                                                <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" /> Falhou no Envio
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200 line-clamp-2">
                                            "{record.message}"
                                        </p>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        {new Date(record.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="relative">
                                    <div className="absolute top-2 left-3 -translate-y-1/2 bg-white dark:bg-slate-900 px-1 text-[10px] font-bold text-primary-600 dark:text-primary-400 z-10 transition-colors">
                                        Sugestão da IA
                                    </div>
                                    <textarea
                                        className="w-full relative rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 pt-4 pb-2 px-3 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 transition-colors"
                                        value={editedTexts[record.id] ?? record.ai_response ?? ""}
                                        onChange={(e: any) => setEditedTexts(prev => ({ ...prev, [record.id]: e.target.value }))}
                                        disabled={loadingMap[record.id]}
                                    />
                                </div>
                                {record.error_log && record.status === 'FAILED' && (
                                    <p className="text-xs text-red-500">
                                        Erro da API: {record.error_log}
                                    </p>
                                )}

                                <div className="flex gap-2 justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-slate-500"
                                        onClick={() => handleIgnore(record.id)}
                                        disabled={loadingMap[record.id]}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" /> Descartar
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-primary-600 hover:bg-primary-700"
                                        onClick={() => handleApprove(record.id, record.status)}
                                        disabled={loadingMap[record.id]}
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        {loadingMap[record.id] ? "Enviando..." : "Aprovar e Enviar"}
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {completed.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold mb-4 text-slate-700 dark:text-slate-300">Histórico Recente</h3>
                    <div className="space-y-3 opacity-70">
                        {completed.map(record => (
                            <div key={record.id} className="border border-slate-200 dark:border-slate-800 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                                <div className="flex gap-2 items-center mb-1">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span className="text-slate-500 dark:text-slate-400 text-xs">Aprovado e Enviado em {new Date(record.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="text-slate-600 dark:text-slate-300 flex flex-col gap-1 mt-2">
                                    <p><strong className="text-slate-800 dark:text-slate-100">Cliente:</strong> "{record.message}"</p>
                                    <p><strong className="text-primary-600 dark:text-primary-400">Sua Marca:</strong> {record.ai_response}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
