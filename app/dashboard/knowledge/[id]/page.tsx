import { getKnowledgeBaseById, getKnowledgeSources } from "@/actions/knowledge";
import { Folder, ArrowLeft, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SourcesManager } from "@/components/dashboard/knowledge/SourcesManager";
import { EditBaseForm } from "@/components/dashboard/knowledge/EditBaseForm";

export const dynamic = 'force-dynamic';

export default async function EditKnowledgeBasePage({ params }: { params: { id: string } }) {
    const base = await getKnowledgeBaseById(params.id);

    if (!base) {
        notFound();
    }

    const sources = await getKnowledgeSources(params.id);

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
            <div className="mb-4">
                <EditBaseForm baseId={base.id} initialContent={base.content || ""} />
            </div>
        </div>
    );
}
