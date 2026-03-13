
import { getKnowledgeBases } from "@/actions/knowledge";
import { KnowledgeSidebar } from "@/components/dashboard/knowledge/KnowledgeSidebar";

export default async function KnowledgeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const bases = await getKnowledgeBases();

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            {/* GitBook Sidebar */}
            <KnowledgeSidebar bases={bases} />

            {/* GitBook Content Pane */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950">
                <div className="max-w-4xl mx-auto px-8 py-12">
                    {children}
                </div>
            </div>
        </div>
    );
}
