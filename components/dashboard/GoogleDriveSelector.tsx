
"use client";

import { useState, useEffect } from "react";
import { getGoogleDriveFilesAction } from "@/actions/google-drive";
import { Loader2, FileIcon, ImageIcon, VideoIcon, Search, Database, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface GoogleFile {
    id: string;
    name: string;
    mimeType: string;
    thumbnailLink?: string;
    webContentLink?: string;
    size?: string;
}

interface GoogleDriveSelectorProps {
    onSelect: (file: GoogleFile) => void;
    onClose: () => void;
}

export function GoogleDriveSelector({ onSelect, onClose }: GoogleDriveSelectorProps) {
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState<GoogleFile[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchFiles = async () => {
            setLoading(true);
            const result = await getGoogleDriveFilesAction();
            if (result.success && result.files) {
                const validFiles = (result.files as any[]).filter(f => f.id && f.name).map(f => ({
                    id: f.id as string,
                    name: f.name as string,
                    mimeType: f.mimeType as string,
                    thumbnailLink: f.thumbnailLink as string | undefined,
                    webContentLink: f.webContentLink as string | undefined,
                    size: f.size as string | undefined
                }));
                setFiles(validFiles);
            } else {
                setError(result.error || "Falha ao carregar arquivos do Drive");
            }
            setLoading(false);
        };
        fetchFiles();
    }, []);

    const filteredFiles = files.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Database className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white uppercase tracking-wider text-xs">Seletor Cloud</h3>
                            <p className="text-slate-400 text-[10px]">Acesse seus ativos diretamente do Google Drive</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-500 hover:text-white">
                        <ExternalLink className="w-4 h-4 rotate-45" />
                    </Button>
                </div>

                <div className="p-4 bg-slate-800/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Pesquisar ativos no drive..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="max-h-[400px] min-h-[300px] overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            <p className="text-slate-400 text-xs animate-pulse">Consultando pipeline do Google...</p>
                        </div>
                    ) : error ? (
                        <div className="py-10 text-center space-y-4">
                            <p className="text-red-400 text-sm">{error}</p>
                            <Button onClick={() => window.location.href = '/dashboard/settings'} variant="outline" className="border-slate-800 text-xs">
                                Conectar Google Drive
                            </Button>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="text-slate-500 text-sm">Nenhum criativo encontrado.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {filteredFiles.map((file) => (
                                <button
                                    key={file.id}
                                    onClick={() => onSelect(file)}
                                    className="group relative bg-slate-800/30 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all text-left"
                                >
                                    <div className="aspect-square bg-slate-950 flex items-center justify-center relative">
                                        {file.thumbnailLink ? (
                                            <img src={file.thumbnailLink.replace('=s220', '=s400')} alt={file.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                        ) : file.mimeType.includes('video') ? (
                                            <VideoIcon className="w-10 h-10 text-slate-700" />
                                        ) : (
                                            <ImageIcon className="w-10 h-10 text-slate-700" />
                                        )}
                                        <div className="absolute top-2 right-2 p-1 rounded-full bg-slate-900/80 backdrop-blur-sm border border-white/5">
                                            {file.mimeType.includes('video') ? <VideoIcon className="w-3 h-3 text-purple-400" /> : <ImageIcon className="w-3 h-3 text-blue-400" />}
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <p className="text-[10px] font-medium text-slate-300 truncate">{file.name}</p>
                                        <p className="text-[9px] text-slate-500 uppercase tracking-tighter mt-1">{(parseInt(file.size || '0') / (1024 * 1024)).toFixed(1)} MB</p>
                                    </div>
                                    <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} className="text-slate-400 text-xs">Cancelar</Button>
                    <Button disabled className="bg-slate-800 text-white text-xs gap-2">
                        <CheckCircle2 className="w-3 h-3" /> Selecionar Ativos
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
