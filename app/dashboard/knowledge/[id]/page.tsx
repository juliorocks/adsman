import { getKnowledgeBaseById, getKnowledgeSources, deleteKnowledgeBase } from "@/actions/knowledge";
import { Folder, ArrowLeft, Layers, Calendar, Clock, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SourcesManager } from "@/components/dashboard/knowledge/SourcesManager";
import { EditBaseForm } from "@/components/dashboard/knowledge/EditBaseForm";

export const dynamic = 'force-dynamic';

export default async function EditKnowledgeBasePage({ params }: { params: { id: string } }) {
    const base = await getKnowledgeBaseById(params.id);

    if (!base) {
        notFound();
    }

    const sources = await getKnowledgeSources(params.id);

    async function handleDelete() {
        "use server";
        await deleteKnowledgeBase(params.id);
        redirect("/dashboard/knowledge");
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Context Header */}
            <div className="space-y-6 pb-8 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold text-xs uppercase tracking-widest">
                        <Folder className="h-3.5 w-3.5" />
                        {base.client_name}
                    </div>

                    <form action={handleDelete}>
                        <Button type="submit" variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 gap-2">
                            <Trash2 className="h-4 w-4" />
                            Apagar Documento
                        </Button>
                    </form>
                </div>

                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                        {base.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400 pt-2">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            Criado em {new Date(base.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            Última atualização {new Date(base.updated_at || base.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-500 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            <Sparkles className="h-3.5 w-3.5" />
                            Ativo para IA
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 gap-12">
                {/* Manual Text Context Section - Main Focus */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            Conteúdo do Documento
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <EditBaseForm baseId={base.id} initialContent={base.content || ""} />
                    </div>
                </section>

                {/* Cloud & URL Sources Section */}
                <section className="space-y-6 pt-10 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Layers className="h-6 w-6 text-blue-500" />
                            Fontes de Conhecimento
                        </h2>
                        <p className="text-slate-500 max-w-xl">Anexe arquivos em PDF ou URLs de sites para que o robô tenha ainda mais contexto sobre este cliente.</p>
                    </div>
                    <SourcesManager knowledgeBaseId={base.id} initialSources={sources || []} />
                </section>
            </div>
        </div>
    );
}
