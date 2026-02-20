
import { PenTool } from "lucide-react";
import { generateCreativeIdeas } from "@/lib/agents/creative";
import { CreativeCard } from "../CreativeCard";

export async function CreativeStudioSection() {
    let creativeIdeas: any[] = [];
    try {
        creativeIdeas = await generateCreativeIdeas();
    } catch (error) {
        console.error("CreativeStudioSection error:", error);
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <PenTool className="h-5 w-5 text-purple-400" />
                Sugestões do Estúdio Criativo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {creativeIdeas.map((c: any) => (
                    <CreativeCard key={c.id} creative={c} />
                ))}
            </div>
            {creativeIdeas.length === 0 && (
                <div className="p-8 rounded-[24px] bg-slate-900/50 border border-slate-800 text-center text-slate-500 italic">
                    Nenhuma sugestão criativa no momento.
                </div>
            )}
        </div>
    );
}
