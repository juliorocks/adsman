import { getCompletedInteractions } from "@/actions/interactions";
import { CheckCircle2, MinusCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function HistoricoPage() {
    let records: any[] = [];
    try {
        records = await getCompletedInteractions(1, 100);
    } catch (e) {
        console.error("HistoricoPage: Error loading interactions:", e);
    }

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/inbox"
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para Caixa de Entrada
                </Link>
            </div>

            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Histórico de Respostas</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Todas as respostas já enviadas ou descartadas ({records.length} registros).
                </p>
            </div>

            {records.length === 0 ? (
                <div className="p-8 border rounded-xl border-dashed flex flex-col items-center justify-center text-slate-500 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-400">
                    <p>Nenhuma resposta enviada ainda.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {records.map(record => (
                        <div key={record.id} className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl bg-white dark:bg-slate-900 text-sm">
                            <div className="flex gap-2 items-center mb-2">
                                {record.status === 'COMPLETED' ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                ) : (
                                    <MinusCircle className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                )}
                                <span className="text-slate-500 dark:text-slate-400 text-xs">
                                    {record.status === 'COMPLETED' ? 'Enviado' : 'Descartado'} em{' '}
                                    {new Date(record.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                                <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                    {record.platform} • {record.interaction_type}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 pl-6">
                                <p className="text-slate-600 dark:text-slate-400">
                                    <strong className="text-slate-800 dark:text-slate-100">
                                        {record.context?.sender_name || 'Cliente'}:
                                    </strong>{' '}
                                    "{record.message}"
                                </p>
                                {record.ai_response && (
                                    <p className="text-slate-600 dark:text-slate-300">
                                        <strong className="text-primary-600 dark:text-primary-400">Resposta:</strong>{' '}
                                        {record.ai_response}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
