"use client";

import { useState, useEffect, useCallback } from "react";
import { getGoogleDriveFilesAction } from "@/actions/google-drive";
import { Loader2, ImageIcon, VideoIcon, Search, Database, ExternalLink, CheckCircle2, FolderIcon, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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

    // Navigation State
    const [currentFolder, setCurrentFolder] = useState({ id: 'root', name: 'Meu Drive' });
    const [pathHistory, setPathHistory] = useState<Array<{ id: string, name: string }>>([]);

    const fetchFiles = useCallback(async (folderId: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await getGoogleDriveFilesAction(folderId);
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
        } catch (err: any) {
            setError(err.message || "Erro de conexão com Google Drive");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFiles(currentFolder.id);
    }, [currentFolder.id, fetchFiles]);

    const handleNavigate = (folder: { id: string, name: string }) => {
        setPathHistory(prev => [...prev, currentFolder]);
        setCurrentFolder(folder);
        setSearchQuery("");
    };

    const handleBack = () => {
        if (pathHistory.length === 0) return;
        const newHistory = [...pathHistory];
        const lastFolder = newHistory.pop()!;
        setPathHistory(newHistory);
        setCurrentFolder(lastFolder);
        setSearchQuery("");
    };

    const handleItemClick = (file: GoogleFile) => {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
            handleNavigate({ id: file.id, name: file.name });
        } else {
            onSelect(file);
        }
    };

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
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shadow-inner">
                            <Database className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white uppercase tracking-wider text-xs">Seletor Cloud</h3>
                            <p className="text-slate-400 text-[10px]">Gerencie seus ativos diretamente do Google Drive</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-500 hover:text-white hover:bg-slate-800 rounded-full">
                        <ExternalLink className="w-4 h-4 rotate-45" />
                    </Button>
                </div>

                {/* Sub-Header: Navigation & Search */}
                <div className="px-6 py-4 bg-slate-900/30 border-b border-slate-800 space-y-4">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                        {pathHistory.length > 0 && (
                            <button
                                onClick={handleBack}
                                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors mr-1"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <div className="flex items-center text-[10px] whitespace-nowrap">
                            <span
                                className={`transition-colors cursor-pointer ${pathHistory.length === 0 ? 'text-blue-400 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
                                onClick={() => {
                                    setCurrentFolder({ id: 'root', name: 'Meu Drive' });
                                    setPathHistory([]);
                                }}
                            >
                                MEU DRIVE
                            </span>
                            {pathHistory.map((folder, idx) => (
                                <div key={folder.id} className="flex items-center">
                                    <ChevronRight className="w-3 h-3 mx-1 text-slate-700" />
                                    <span
                                        className="text-slate-500 hover:text-slate-300 transition-colors uppercase cursor-pointer"
                                        onClick={() => {
                                            const newHistory = pathHistory.slice(0, idx);
                                            setPathHistory(newHistory);
                                            setCurrentFolder(folder);
                                        }}
                                    >
                                        {folder.name.length > 15 ? folder.name.substring(0, 15) + '...' : folder.name}
                                    </span>
                                </div>
                            ))}
                            {pathHistory.length > 0 && (
                                <div className="flex items-center">
                                    <ChevronRight className="w-3 h-3 mx-1 text-slate-700" />
                                    <span className="text-blue-400 font-bold uppercase truncate max-w-[120px]">
                                        {currentFolder.name}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder={currentFolder.id === 'root' ? "Pesquisar em todo o Drive..." : `Pesquisar em ${currentFolder.name}...`}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 min-h-[400px] custom-scrollbar bg-slate-900/20">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <div className="relative">
                                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                                <Database className="w-5 h-5 text-blue-400 absolute inset-0 m-auto" />
                            </div>
                            <div className="text-center">
                                <p className="text-slate-300 font-medium text-xs">Acessando API do Google Drive</p>
                                <p className="text-slate-500 text-[10px] mt-1 animate-pulse">Sincronizando pipeline de arquivos...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="py-16 text-center space-y-6">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                                <ExternalLink className="w-8 h-8 text-red-500/50" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm">Problema de Conexão</h4>
                                <p className="text-red-400/80 text-[11px] mt-2 px-10 leading-relaxed">{error}</p>
                            </div>
                            <Button
                                onClick={() => window.location.href = '/dashboard/settings'}
                                variant="outline"
                                className="border-slate-800 hover:bg-slate-800 text-xs px-8 rounded-xl transition-all"
                            >
                                Reconectar Google Drive
                            </Button>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="py-24 text-center space-y-3 opacity-40">
                            <Search className="w-12 h-12 text-slate-600 mx-auto" />
                            <p className="text-slate-400 text-xs font-medium italic">Nenhum criativo ou pasta encontrada aqui.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                            {filteredFiles.map((file) => {
                                const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                                return (
                                    <button
                                        key={file.id}
                                        onClick={() => handleItemClick(file)}
                                        className="group relative bg-slate-800/20 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/50 hover:bg-slate-800/40 transition-all text-left shadow-sm flex flex-col"
                                    >
                                        <div className="aspect-square bg-slate-950 flex items-center justify-center relative overflow-hidden">
                                            {isFolder ? (
                                                <div className="flex flex-col items-center gap-2 group-hover:scale-110 transition-transform duration-300">
                                                    <FolderIcon className="w-14 h-14 text-blue-500/40 fill-blue-500/5" />
                                                </div>
                                            ) : file.thumbnailLink ? (
                                                <img
                                                    src={file.thumbnailLink.replace('=s220', '=s400')}
                                                    alt={file.name}
                                                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                                                />
                                            ) : file.mimeType.includes('video') ? (
                                                <VideoIcon className="w-12 h-12 text-slate-800" />
                                            ) : (
                                                <ImageIcon className="w-12 h-12 text-slate-800" />
                                            )}

                                            {/* Type Badge */}
                                            <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-900/90 backdrop-blur-md border border-white/5 shadow-xl">
                                                {isFolder ? (
                                                    <FolderIcon className="w-3 h-3 text-blue-400" />
                                                ) : file.mimeType.includes('video') ? (
                                                    <VideoIcon className="w-3 h-3 text-purple-400" />
                                                ) : (
                                                    <ImageIcon className="w-3 h-3 text-emerald-400" />
                                                )}
                                            </div>

                                            {/* Selection Overlay */}
                                            {!isFolder && (
                                                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                                                    <span className="text-[9px] font-bold text-white bg-blue-600 px-3 py-1 rounded-full shadow-lg">SELECIONAR</span>
                                                </div>
                                            )}
                                            {isFolder && (
                                                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </div>

                                        <div className="p-3 border-t border-slate-800/50 bg-slate-900/40">
                                            <p className="text-[10px] font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                                                {file.name}
                                            </p>
                                            <div className="flex items-center justify-between mt-1.5">
                                                <span className="text-[8px] text-slate-500 font-mono tracking-tighter uppercase">
                                                    {isFolder ? 'Pasta' : (parseInt(file.size || '0') / (1024 * 1024)).toFixed(1) + ' MB'}
                                                </span>
                                                {isFolder && <ChevronRight className="w-2.5 h-2.5 text-slate-700 group-hover:text-blue-500 transition-colors" />}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <p className="text-[10px] text-slate-500 italic">Formatos suportados: MP4, MOV, PNG, JPG</p>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose} className="text-slate-400 text-xs hover:bg-slate-800 rounded-xl px-6">Cancelar</Button>
                        <Button disabled className="bg-slate-800 border border-slate-700 text-slate-500 text-xs gap-2 px-6 rounded-xl cursor-not-allowed">
                            <CheckCircle2 className="w-3 h-3" /> Selecionar Ativos
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
