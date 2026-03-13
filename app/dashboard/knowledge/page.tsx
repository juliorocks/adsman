
import { getKnowledgeBases, createKnowledgeBase } from "@/actions/knowledge";
import { Database, Plus, Search, FileText, Layout, BookOpen, Sparkles, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { AgentContextForm } from "@/components/dashboard/AgentContextForm";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

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

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Introduction Section */}
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5" />
                    Bem-vindo à sua Documentação de Marca
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                    Introdução
                </h1>
                <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                    Sua Base de Conhecimento centraliza todas as informações que sua IA utiliza para responder clientes, criar copies e manter o tom de voz da sua marca.
                </p>
                <div className="flex items-center gap-4 pt-4">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                {i}
                            </div>
                        ))}
                    </div>
                    <span className="text-sm text-slate-400 font-medium">Equipe utilizando {bases.length} bases ativas</span>
                </div>
            </div>

            {/* Quick Actions / Creation */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Adicionar Novo Documento</h2>
                        <p className="text-sm text-slate-500">Crie uma nova base para um cliente ou campanha específica.</p>
                    </div>

                    <form action={createKnowledgeBase as any} className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <input
                            type="text"
                            name="client_name"
                            placeholder="Nome do Cliente"
                            required
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all w-full sm:w-48 placeholder:text-slate-400 text-slate-900 dark:text-white"
                        />
                        <input
                            type="text"
                            name="name"
                            placeholder="Nome do Documento (Ex: Persona)"
                            required
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all w-full sm:w-64 placeholder:text-slate-400 text-slate-900 dark:text-white"
                        />
                        <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-200 dark:shadow-none py-6 px-6 gap-2">
                            <Plus className="h-4 w-4" /> Criar Documento
                        </Button>
                    </form>
                </div>
            </div>

            {/* AI Persona Section */}
            {integrations.length > 0 && (
                <section className="pt-8 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
                            Configuração da IA (Copiloto)
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        {integrations.map(intg => (
                            <AgentContextForm key={intg.id} integration={intg} />
                        ))}
                    </div>
                </section>
            )}

            {/* Tutorial Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-12">
                {[
                    { title: "Defina sua Persona", desc: "A IA precisa saber quem ela é ao responder um cliente.", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { title: "Suba seus PDFs", desc: "Manuais, tabelas de preço e catálogos ajudam nas respostas.", icon: Database, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { title: "Regras de Ouro", desc: "Crie documentos com o que a IA NUNCA deve falar.", icon: Layout, color: "text-amber-500", bg: "bg-amber-500/10" }
                ].map((item, i) => (
                    <div key={i} className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-primary-500/30 transition-all group">
                        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300", item.bg)}>
                            <item.icon className={cn("h-6 w-6", item.color)} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{item.title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
