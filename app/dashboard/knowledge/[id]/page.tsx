import { getKnowledgeBaseById, updateKnowledgeBase, getKnowledgeSources } from "@/actions/knowledge";
import { Database, Folder, Save, ArrowLeft, Bot, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SourcesManager } from "@/components/dashboard/knowledge/SourcesManager";

export const dynamic = 'force-dynamic';

export default async function EditKnowledgeBasePage({ params }: { params: { id: string } }) {
    const base = await getKnowledgeBaseById(params.id);

    if (!base) {
        notFound();
    }

    const sources = await getKnowledgeSources(params.id);

    // Server Action Wrapper for updating
    const handleUpdate = updateKnowledgeBase.bind(null, base.id);

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/knowledge">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <div className="flex items-center gap-2 text-primary-500 font-medium text-sm mb-1">
                        <Folder className="h-4 w-4" />
                        {base.client_name}
                    </div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        {base.name}
                    </h1>
                </div>
            </div>

            {/* Cloud & URL Sources Section */}
            <div className="mb-8">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-blue-400" />
                    Arquivos e Páginas Web
                </h2>
                <SourcesManager knowledgeBaseId={base.id} initialSources={sources || []} />
            </div>

            {/* Manual Text Context Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                <form action={handleUpdate as any} className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <Bot className="h-4 w-4 text-emerald-400" />
                            Anotações Fixo / Fatos da Empresa
                        </label>
                        <p className="text-xs text-slate-500 hidden sm:block">Textos adicionados aqui servem como regras mestre absolutas.</p>
                    </div>

                    <textarea
                        name="content"
                        defaultValue={base.content}
                        className="w-full h-[300px] bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-primary-500 font-mono resize-y"
                        placeholder="Ex: Não vender para menores de 18. O tom de voz da marca é sempre agressivo, jovial. A garantia nunca deve ser o foco principal do anúncio..."
                    />

                    <div className="flex justify-end pt-4">
                        <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white gap-2">
                            <Save className="h-4 w-4" /> Salvar Anotações
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
