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

    const handleApprove = async (interactionId: string) => {
        const record = records.find(r => r.id === interactionId);
        if (!record || record.status === "COMPLETED") return; // Safety

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

    const pending = records.filter(r => ["DRAFT", "FAILED", "PENDING"].includes(r.status));
    const completed = records.filter(r => ["COMPLETED", "IGNORED"].includes(r.status));

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
                                <div className="flex gap-4 items-start">
                                    <div className="flex-shrink-0">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                                            {record.context?.sender_pic ? (
                                                <img src={record.context.sender_pic} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold text-slate-400">
                                                    {(record.context?.sender_name?.[0] || record.platform?.[0])?.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                                {record.context?.sender_name || 'Usuário'}
                                            </span>
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded">
                                                {record.platform} • {record.interaction_type}
                                            </span>
                                            {record.status === 'FAILED' && (
                                                <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <AlertCircle className="h-2.5 w-2.5" /> Falha
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 italic mb-2">
                                            "{record.message}"
                                        </p>

                                        {record.context?.post_preview && (
                                            <a
                                                href={record.context.post_link || "#"}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex gap-3 items-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer"
                                            >
                                                {record.context.post_image && (
                                                    <img src={record.context.post_image} className="h-12 w-12 rounded object-cover flex-shrink-0" />
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Post Relacionado</p>
                                                        {record.context.post_link && <p className="text-[10px] text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">Ver no {record.platform}</p>}
                                                    </div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                                        {record.context.post_preview}
                                                    </p>
                                                </div>
                                            </a>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 whitespace-nowrap">
                                        {new Date(record.created_at).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute top-2 left-3 -translate-y-1/2 bg-white dark:bg-slate-900 px-1 text-[10px] font-bold text-primary-600 dark:text-primary-400 z-10 transition-colors">
                                        Sugestão da IA
                                    </div>
                                    <textarea
                                        className="w-full relative rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 pt-4 pb-2 px-3 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 transition-colors"
                                        value={record.status === 'PENDING' ? "O agente de IA está processando esta mensagem e criando uma resposta..." : (editedTexts[record.id] ?? record.ai_response ?? "")}
                                        onChange={(e: any) => setEditedTexts(prev => ({ ...prev, [record.id]: e.target.value }))}
                                        disabled={loadingMap[record.id] || record.status === 'PENDING'}
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
                                        className="bg-primary-600 hover:bg-primary-700 text-white"
                                        onClick={() => handleApprove(record.id)}
                                        disabled={loadingMap[record.id] || record.status === 'PENDING'}
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        {loadingMap[record.id] ? "Enviando..." : (record.status === 'PENDING' ? "Processando..." : "Aprovar e Enviar")}
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
