"use client";

import { useState } from "react";
import { saveAgentContext } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save, Bot } from "lucide-react";

export function AgentContextForm({ integration }: { integration: any }) {
    const [context, setContext] = useState(integration.agent_context || "");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { success } = await saveAgentContext(integration.id, context);
            if (success) {
                toast.success("Contexto do agente salvo com sucesso!");
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm mt-4">
            <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-primary-900/50 flex flex-shrink-0 items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-400" />
                </div>
                <h3 className="text-md font-semibold text-white">Personalidade da Assistente (Redes Sociais)</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
                Descreva como a sua inteligência artificial deve se portar, nome, tom de voz, persona, e qualificação exclusiva para quando for responder clientes no Instagram e Facebook.
            </p>
            <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Exemplo: Olá! Sou a Joana, especialista da [Nome da Marca]. Eu costumo ser bem brincalhona, usar emojis de brilho e sempre tentar vender as blusinhas de promoção. Use sempre o pronome FEMININO e diga que envio para todo Brasil..."
                className="w-full bg-slate-950/50 text-slate-100 border border-slate-800 rounded-xl p-3 min-h-[100px] text-sm focus:outline-none focus:border-primary-500 transition-colors"
                disabled={loading}
            />
            <div className="flex justify-end mt-3">
                <Button
                    onClick={handleSubmit}
                    disabled={loading || context === integration.agent_context}
                    className="bg-primary-600 hover:bg-primary-700 text-white gap-2"
                >
                    <Save className="h-4 w-4" />
                    {loading ? "Salvando..." : "Salvar Personalidade"}
                </Button>
            </div>
        </div>
    );
}
