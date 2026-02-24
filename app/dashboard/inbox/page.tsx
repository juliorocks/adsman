import { getInteractions } from "@/actions/interactions";
import { InboxList } from "@/components/dashboard/InboxList";

export const dynamic = 'force-dynamic';

export default async function InboxPage() {
    let records: any[] = [];
    try {
        records = await getInteractions();
    } catch (e) {
        console.error("InboxPage: Error loading interactions:", e);
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Caixa de Entrada Inteligente</h1>
            <p className="text-slate-500 mb-8">
                Revise, edite e aprove as respostas humanizadas elaboradas pelos seus Agentes de IA nas redes sociais.
            </p>
            <InboxList records={records} />
        </div>
    );
}
