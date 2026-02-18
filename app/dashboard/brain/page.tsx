
import { getBusinessContext } from "@/lib/data/brain";
import { addBusinessFact, removeBusinessFact } from "@/actions/brain";

export default async function BrainPage() {
    const context = await getBusinessContext();

    const categories = [
        { id: 'brand', label: 'Identidade da Marca' },
        { id: 'product', label: 'Produtos e Serviços' },
        { id: 'audience', label: 'Público-Alvo' },
        { id: 'competitor', label: 'Concorrência' },
        { id: 'links', label: 'Links Importantes' },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Cérebro da Empresa</h1>
                    <p className="text-slate-400">Ensine sua IA sobre seu negócio para obter análises mais precisas.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat) => {
                    const items = context.filter(c => c.category === cat.id);
                    return (
                        <div key={cat.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col h-full">
                            <h3 className="font-semibold text-lg text-white mb-4 flex items-center gap-2">
                                {cat.label}
                                <span className="bg-slate-800 text-xs px-2 py-1 rounded-full text-slate-400">
                                    {items.length}
                                </span>
                            </h3>

                            <div className="flex-1 space-y-3 mb-4 overflow-y-auto max-h-[300px]">
                                {items.length === 0 ? (
                                    <p className="text-sm text-slate-500 italic">Nenhum dado adicionado.</p>
                                ) : (
                                    items.map((item) => (
                                        <div key={item.id} className="group flex justify-between items-start gap-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition">
                                            <p className="text-sm text-slate-300 break-words">{item.content}</p>
                                            <form action={removeBusinessFact.bind(null, item.id)}>
                                                <button className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition">
                                                    ✕
                                                </button>
                                            </form>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form action={addBusinessFact} className="mt-auto pt-4 border-t border-slate-800">
                                <input type="hidden" name="category" value={cat.id} />
                                <div className="flex gap-2">
                                    <input
                                        name="content"
                                        placeholder={`Adicione fato sobre ${cat.label}...`}
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded text-sm transition font-medium">
                                        +
                                    </button>
                                </div>
                            </form>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
