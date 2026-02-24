"use client";

import { useState } from "react";
import { updateKnowledgeBase } from "@/actions/knowledge";
import { Button } from "@/components/ui/button";
import { Bot, Save, Loader2 } from "lucide-react";

interface EditBaseFormProps {
    baseId: string;
    initialContent: string;
}

export function EditBaseForm({ baseId, initialContent }: EditBaseFormProps) {
    const [content, setContent] = useState(initialContent || "");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("content", content);

            const result = await updateKnowledgeBase(baseId, formData);
            if (result?.success) {
                alert("Anotações salvas com sucesso!");
            } else {
                alert(result?.error || "Erro ao salvar anotações.");
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("Erro inesperado ao salvar.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <Bot className="h-4 w-4 text-emerald-400" />
                        Anotações Fixo / Fatos da Empresa
                    </label>
                    <p className="text-xs text-slate-500 hidden sm:block">Textos adicionados aqui servem como regras mestre absolutas.</p>
                </div>

                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-[300px] bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-primary-500 font-mono resize-y"
                    placeholder="Ex: Não vender para menores de 18. O tom de voz da marca é sempre agressivo, jovial. A garantia nunca deve ser o foco principal do anúncio..."
                />

                <div className="flex justify-end pt-4">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary-600 hover:bg-primary-700 text-white gap-2"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {saving ? "Salvando..." : "Salvar Anotações"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
