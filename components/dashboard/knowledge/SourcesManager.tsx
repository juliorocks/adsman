"use client";

import { useState } from "react";
import { GoogleDriveSelector } from "@/components/dashboard/GoogleDriveSelector";
import { addKnowledgeSource, deleteKnowledgeSource, triggerKnowledgeSync } from "@/actions/knowledge";
import { Cloud, Link as LinkIcon, FileText, Trash2, Plus, RefreshCw, UploadCloud, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Source {
    id: string;
    source_type: 'GOOGLE_DRIVE' | 'URL' | 'TEXT';
    source_ref: string;
    metadata: any;
    sync_status: string;
    last_synced_at: string | null;
}

interface SourcesManagerProps {
    knowledgeBaseId: string;
    initialSources: Source[];
}

export function SourcesManager({ knowledgeBaseId, initialSources }: SourcesManagerProps) {
    const [sources, setSources] = useState<Source[]>(initialSources);
    const [isDriveOpen, setIsDriveOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // URL State
    const [isAddingUrl, setIsAddingUrl] = useState(false);
    const [urlInput, setUrlInput] = useState("");

    const handleDriveSelect = async (file: any) => {
        setIsDriveOpen(false);
        setLoading(true);
        try {
            const res = await addKnowledgeSource(
                knowledgeBaseId,
                'GOOGLE_DRIVE',
                file.id,
                { name: file.name, mimeType: file.mimeType }
            );

            if (res.success && res.data) {
                setSources([res.data, ...sources]);
            } else {
                alert(res.error || "Erro ao adicionar arquivo do Drive");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddUrl = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!urlInput.trim()) return;

        setLoading(true);
        try {
            const res = await addKnowledgeSource(
                knowledgeBaseId,
                'URL',
                urlInput,
                { url: urlInput }
            );

            if (res.success && res.data) {
                setSources([res.data, ...sources]);
                setUrlInput("");
                setIsAddingUrl(false);
            } else {
                alert(res.error || "Erro ao adicionar URL");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Remover esta fonte de conhecimento?")) return;

        setLoading(true);
        try {
            const res = await deleteKnowledgeSource(id, knowledgeBaseId);
            if (res.success) {
                setSources(sources.filter(s => s.id !== id));
            } else {
                alert(res.error || "Erro ao deletar fonte");
            }
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SYNCED':
                return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Sincronizado</span>;
            case 'SYNCING':
                return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Sincronizando</span>;
            case 'FAILED':
                return <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Falhou</span>;
            default:
                return <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">Pendente</span>;
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'GOOGLE_DRIVE': return <Cloud className="w-5 h-5 text-blue-400" />;
            case 'URL': return <LinkIcon className="w-5 h-5 text-purple-400" />;
            default: return <FileText className="w-5 h-5 text-emerald-400" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-2 rounded-xl">
                <Button
                    onClick={() => setIsDriveOpen(true)}
                    variant="ghost"
                    className="flex-1 bg-slate-950/50 hover:bg-slate-800 text-slate-300 gap-2 border border-slate-800 rounded-lg py-6"
                    disabled={loading}
                >
                    <Cloud className="w-5 h-5 text-blue-400" />
                    Adicionar do Google Drive
                </Button>

                <Button
                    onClick={() => setIsAddingUrl(!isAddingUrl)}
                    variant="ghost"
                    className="flex-1 bg-slate-950/50 hover:bg-slate-800 text-slate-300 gap-2 border border-slate-800 rounded-lg py-6"
                    disabled={loading}
                >
                    <LinkIcon className="w-5 h-5 text-purple-400" />
                    Adicionar URL / Site
                </Button>
            </div>

            {isAddingUrl && (
                <form onSubmit={handleAddUrl} className="flex gap-2 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <input
                        type="url"
                        placeholder="https://site-do-cliente.com"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        required
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                    />
                    <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-500 text-white rounded-lg px-6">
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Salvar URL'}
                    </Button>
                </form>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-950/50 p-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <UploadCloud className="w-4 h-4 text-slate-400" />
                        Fontes Vinculadas
                        <span className="bg-slate-800 text-xs px-2 py-0.5 rounded-full text-slate-400 ml-2">
                            {sources.length}
                        </span>
                    </div>
                </div>

                <div className="divide-y divide-slate-800">
                    {sources.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm italic">
                            Nenhuma fonte de dados conectada ainda. Adicione PDFs do Drive ou URLs de sites.
                        </div>
                    ) : (
                        sources.map(source => (
                            <div key={source.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-800 flex-shrink-0">
                                        {getIcon(source.source_type)}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-white truncate max-w-xs">{source.metadata?.name || source.metadata?.url || 'Documento'}</h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            {getStatusBadge(source.sync_status)}
                                            {source.last_synced_at && (
                                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                    Atualizado: {new Date(source.last_synced_at).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                            setLoading(true);
                                            try {
                                                const res = await triggerKnowledgeSync(knowledgeBaseId);
                                                if (res.success) {
                                                    alert("Lendo todas as fontes. Pode levar 1-2 minutos para atualizar.");
                                                    window.location.reload();
                                                } else {
                                                    alert(res.error);
                                                }
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        disabled={loading}
                                        className="h-8 text-xs border-slate-700 text-slate-300 hover:text-white"
                                    >
                                        <RefreshCw className={`w-3 h-3 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sincronizar Agora
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(source.id)}
                                        disabled={loading}
                                        className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {isDriveOpen && (
                <GoogleDriveSelector
                    onSelect={handleDriveSelect}
                    onClose={() => setIsDriveOpen(false)}
                />
            )}
        </div>
    );
}
