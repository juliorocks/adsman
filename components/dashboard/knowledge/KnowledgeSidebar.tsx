
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Folder, FileText, Plus, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface KnowledgeBase {
    id: string;
    name: string;
    client_name: string;
}

export function KnowledgeSidebar({ bases }: { bases: KnowledgeBase[] }) {
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState("");

    // Grouping by Client
    const grouped = bases.reduce((acc, curr) => {
        const client = curr.client_name || "Sem Cliente";
        if (!acc[client]) acc[client] = [];
        acc[client].push(curr);
        return acc;
    }, {} as Record<string, KnowledgeBase[]>);

    const filteredGrouped = Object.entries(grouped).reduce((acc, [client, docs]) => {
        const filteredDocs = docs.filter(doc => (
            doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.toLowerCase().includes(searchQuery.toLowerCase())
        ));
        if (filteredDocs.length > 0) acc[client] = filteredDocs;
        return acc;
    }, {} as Record<string, KnowledgeBase[]>);

    return (
        <aside className="w-80 flex-shrink-0 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 flex flex-col h-full">
            {/* Header / Search */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Knowledge Base</h2>
                    <Link href="/dashboard/knowledge">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary-500">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Pesquisar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm shadow-slate-200/50 dark:shadow-none"
                    />
                </div>
            </div>

            {/* Navigation List */}
            <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="space-y-6">
                    {Object.entries(filteredGrouped).map(([client, docs]) => (
                        <div key={client} className="space-y-1">
                            <div className="flex items-center gap-2 px-3 py-1 mb-1 group">
                                <Folder className="h-3.5 w-3.5 text-blue-500/70 group-hover:text-blue-500 transition-colors" />
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-500 transition-colors">
                                    {client}
                                </span>
                            </div>

                            <div className="space-y-0.5">
                                {docs.map((doc) => {
                                    const isActive = pathname.includes(doc.id);
                                    return (
                                        <Link
                                            key={doc.id}
                                            href={`/dashboard/knowledge/${doc.id}`}
                                            className={cn(
                                                "group flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200",
                                                isActive
                                                    ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold border border-primary-500/20"
                                                    : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                            )}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileText className={cn("h-4 w-4 flex-shrink-0 transition-colors", isActive ? "text-primary-500" : "text-slate-400 group-hover:text-slate-500")} />
                                                <span className="truncate">{doc.name}</span>
                                            </div>
                                            {isActive && <div className="h-1.5 w-1.5 rounded-full bg-primary-500 shadow-sm" />}
                                            {!isActive && <ChevronRight className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {Object.keys(filteredGrouped).length === 0 && (
                        <div className="text-center py-10 px-4">
                            <p className="text-sm text-slate-400 italic">Nenhum resultado para "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            </nav>

            {/* Footer / Info */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-200/50 dark:shadow-none">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-2">Estatísticas</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black">{bases.length}</span>
                        <span className="text-xs opacity-80">Documentos</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
