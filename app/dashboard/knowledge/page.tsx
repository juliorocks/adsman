import { getKnowledgeBases, createKnowledgeBase, deleteKnowledgeBase } from "@/actions/knowledge";
import { Database, Folder, FileText, Plus, Search, Trash2, ArrowRight, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { AgentContextForm } from "@/components/dashboard/AgentContextForm";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export default async function KnowledgeBasesPage() {
    let bases: any[] = [];
    let integrations: any[] = [];
    try {
        const supabase = await createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        let user = supabaseUser;
        const devSession = cookies().get("dev_session");
        if (!user && devSession) user = { id: "de70c0de-ad00-4000-8000-000000000000" } as any;

        if (user) {
            bases = await getKnowledgeBases();

            const db = user.id === "de70c0de-ad00-4000-8000-000000000000"
                ? createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
                : supabase;

            const { data: intgData } = await db
                .from("integrations")
                .select("id, platform, preferred_instagram_id, preferred_page_id, agent_context")
                .eq("user_id", user.id)
                .eq("platform", "meta")
                .eq("status", "active")
                .limit(1);

            integrations = intgData || [];
        }
    } catch (e) {
        console.error("KnowledgePage: Error loading bases/integrations:", e);
    }

    // Grouping by Client
    const grouped = bases.reduce((acc, curr) => {
        const client = curr.client_name || "Sem Cliente";
        if (!acc[client]) acc[client] = [];
        acc[client].push(curr);
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                        <Database className="h-8 w-8 text-primary-500" />
                        Bases de Conhecimento
                    </h1>
                    <p className="text-slate-400">Gerencie todo o contexto dos seus clientes, copy, avatares e regras de negócio para a IA utilizar.</p>
                </div>

                {/* Form to Create New Local Base */}
                <form action={createKnowledgeBase as any} className="flex flex-col md:flex-row gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl w-full md:w-auto shadow-sm">
                    <input
                        type="text"
                        name="client_name"
                        placeholder="Nome do Cliente/Pasta"
                        required
                        className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 w-full md:w-40"
                    />
                    <input
                        type="text"
                        name="name"
                        placeholder="Nome do Documento (Ex: Persona)"
                        required
                        className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 w-full md:w-60"
                    />
                    <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg gap-2">
                        <Plus className="h-4 w-4" /> Nova Base
                    </Button>
                </form>
            </div>

            {/* AI Agents Identity Section (New Feature) */}
            {integrations.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Bot className="h-6 w-6 text-primary-500" />
                        Identidade dos Agentes (Social)
                    </h2>
                    <div className="grid grid-cols-1 gap-6">
                        {integrations.map(intg => (
                            <AgentContextForm key={intg.id} integration={intg} />
                        ))}
                    </div>
                </div>
            )}

            <div className="pt-4 border-t border-slate-800">
                <h2 className="text-xl font-bold tracking-tight text-white mb-6 flex items-center gap-2">
                    <Folder className="h-6 w-6 text-primary-500" />
                    Pastas de Contexto Geral
                </h2>

                {Object.keys(grouped).length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="h-20 w-20 bg-slate-800 rounded-full flex items-center justify-center">
                            <Folder className="h-10 w-10 text-slate-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Nenhuma base encontrada</h3>
                            <p className="text-slate-400 max-w-sm mx-auto mt-2">Crie sua primeira pasta de cliente preenchendo o formulário acima. Depois você poderá inserir os PDFs e textos lá dentro.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {(Object.entries(grouped) as [string, any[]][]).map(([clientName, clientBases]) => (
                            <div key={clientName} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                                {/* Folder Header */}
                                <div className="bg-slate-950/50 p-4 border-b border-slate-800 flex items-center gap-3">
                                    <Folder className="h-5 w-5 text-blue-400" />
                                    <h2 className="text-lg font-bold text-white">{clientName}</h2>
                                    <span className="bg-slate-800 text-xs px-2 py-0.5 rounded-full text-slate-400">
                                        {clientBases.length} arquivos
                                    </span>
                                </div>

                                {/* Files Table */}
                                <div className="divide-y divide-slate-800">
                                    {clientBases.map((base: any) => (
                                        <div key={base.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 h-8 w-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <FileText className="h-4 w-4 text-slate-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-semibold text-white">{base.name}</h3>
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                                        {base.content ? (base.content.substring(0, 100) + '...') : 'Nenhum contexto inserido ainda. Clique para editar.'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Link href={`/dashboard/knowledge/${base.id}`}>
                                                    <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 group">
                                                        Acessar Contexto
                                                        <ArrowRight className="ml-2 h-4 w-4 text-slate-500 group-hover:text-primary-400 transition-colors" />
                                                    </Button>
                                                </Link>

                                                <form action={deleteKnowledgeBase.bind(null, base.id) as any}>
                                                    <Button type="submit" variant="ghost" size="icon" className="text-slate-500 hover:bg-red-950 hover:text-red-400" title="Apagar Rascunho">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </form>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
