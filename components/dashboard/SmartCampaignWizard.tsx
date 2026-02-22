
"use client";

import { useRef, useState } from "react";
import { Bot, Sparkles, Target, DollarSign, Image as ImageIcon, CheckCircle2, ChevronRight, Loader2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSmartCampaignAction, uploadMediaAction } from "@/actions/campaign";
import { generateCreativeIdeasAction } from "@/actions/creatives";

const OBJECTIVES = [
    { id: 'OUTCOME_SALES', label: 'Vendas', icon: DollarSign, description: 'Encontre pessoas com alta probabilidade de comprar seu produto.' },
    { id: 'OUTCOME_LEADS', label: 'Leads', icon: Target, description: 'Colete contatos para o seu negócio.' },
    { id: 'OUTCOME_TRAFFIC', label: 'Tráfego', icon: Target, description: 'Envie pessoas para um site ou app.' },
    { id: 'OUTCOME_AWARENESS', label: 'Reconhecimento', icon: Sparkles, description: 'Alcance o maior número de pessoas possível.' },
];

export function SmartCampaignWizard() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        objective: '',
        goal: '',
        budget: '50',
        linkUrl: '',
    });
    const [images, setImages] = useState<File[]>([]);
    const [aiSuggestions, setAiSuggestions] = useState<{
        headlines: string[];
        primary_texts: string[];
        image_prompts: string[];
    } | null>(null);

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleGenerateAI = async () => {
        setGeneratingAI(true);
        setError(null);
        try {
            const result = await generateCreativeIdeasAction(formData.goal);
            if (result.success && result.data) {
                setAiSuggestions(result.data);
            } else {
                setError(result.error || "Não foi possível gerar sugestões agora.");
            }
        } catch (err: any) {
            setError("Erro ao conectar com a IA.");
        } finally {
            setGeneratingAI(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const targetedFiles = images.slice(0, 10);
            const mediaReferences: { type: 'IMAGE' | 'VIDEO', ref: string }[] = [];

            for (let i = 0; i < targetedFiles.length; i++) {
                const file = targetedFiles[i];
                const isVideo = file.type.startsWith('video/');

                // Show status update
                setError(`Enviando ${isVideo ? 'vídeo' : 'imagem'} ${i + 1} de ${targetedFiles.length}...`);

                try {
                    let base64 = "";
                    if (isVideo) {
                        base64 = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = (e) => resolve((e.target?.result as string).split(',')[1] || '');
                            reader.onerror = () => reject(new Error('Failed to read video file'));
                            reader.readAsDataURL(file);
                        });
                    } else {
                        base64 = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                const imgElement = new Image();
                                imgElement.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    let width = imgElement.width;
                                    let height = imgElement.height;
                                    const MAX_SIZE = 1080;
                                    if (width > height) {
                                        if (width > MAX_SIZE) {
                                            height *= MAX_SIZE / width;
                                            width = MAX_SIZE;
                                        }
                                    } else {
                                        if (height > MAX_SIZE) {
                                            width *= MAX_SIZE / height;
                                            height = MAX_SIZE;
                                        }
                                    }
                                    canvas.width = width;
                                    canvas.height = height;
                                    const ctx = canvas.getContext('2d');
                                    ctx?.drawImage(imgElement, 0, 0, width, height);
                                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                                    resolve(compressedDataUrl.split(',')[1] || '');
                                };
                                imgElement.onerror = () => reject(new Error('Failed to load image element'));
                                imgElement.src = e.target?.result as string;
                            };
                            reader.onerror = () => reject(new Error('Failed to read file'));
                            reader.readAsDataURL(file);
                        });
                    }

                    // Individual upload per file to avoid 413 error
                    const uploadResult = await uploadMediaAction({
                        type: isVideo ? 'VIDEO' : 'IMAGE',
                        data: base64
                    });

                    if (uploadResult.success && uploadResult.ref) {
                        mediaReferences.push({ type: uploadResult.type as any, ref: uploadResult.ref });
                    } else {
                        console.error(`Upload failed for ${file.name}:`, uploadResult.error);
                    }
                } catch (err) {
                    console.error("Media processing/upload failed:", file.name, err);
                }
            }

            setError(null);

            const result = await createSmartCampaignAction({
                objective: formData.objective,
                goal: formData.goal,
                budget: formData.budget,
                linkUrl: formData.linkUrl,
                mediaReferences,
            });

            if (!result) {
                setError("Erro: O servidor não retornou uma resposta. Tente novamente.");
                return;
            }

            if (result.success) {
                nextStep();
            } else {
                setError(`###UI-VER-201###: ${result.error || "Ocorreu um erro ao criar a campanha."} (Data: ${JSON.stringify(formData)})`);
            }
        } catch (err: any) {
            setError(`###UI-CATCH-201###: ${err.message || "Erro de conexão com o servidor."} (Data: ${JSON.stringify(formData)})`);
        } finally {
            setLoading(false);
        }
    };

    if (step === 4) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Campanha Criada com Sucesso!</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        Sua campanha inteligente foi enviada para o Meta Ads em rascunho.
                        Nossos agentes já estão monitorando para otimizar o lançamento.
                    </p>
                </div>
                <Button onClick={() => window.location.href = '/dashboard'} className="bg-primary-600 hover:bg-primary-700 text-white">
                    Voltar para o Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Progress Bar */}
            <div className="flex items-center justify-between px-2">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 dark:shadow-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                            }`}>
                            {s}
                        </div>
                        {s < 3 && <div className={`h-1 w-24 mx-2 rounded ${step > s ? 'bg-primary-600' : 'bg-slate-100 dark:bg-slate-800'}`} />}
                    </div>
                ))}
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    {error}
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Step 1: Objective */}
                {step === 1 && (
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                                O que você quer alcançar?
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400">Escolha o objetivo principal da sua campanha inteligente.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {OBJECTIVES.map((obj) => (
                                <button
                                    key={obj.id}
                                    onClick={() => { setFormData({ ...formData, objective: obj.id }); nextStep(); }}
                                    className={`flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800 group ${formData.objective === obj.id ? 'border-primary-600 dark:border-primary-500 bg-primary-50/50 dark:bg-primary-900/10' : 'border-slate-100 dark:border-slate-700'
                                        }`}
                                >
                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${formData.objective === obj.id ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                                        }`}>
                                        <obj.icon className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-slate-900 dark:text-white">{obj.label}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{obj.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: AI Config */}
                {step === 2 && (
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Configuração Inteligente</h3>
                            <p className="text-slate-500 dark:text-slate-400">Dê as instruções para a nossa IA configurar seu público e copies.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">O que você está vendendo/promovendo?</label>
                                <textarea
                                    placeholder="Ex: Venda de sapatos femininos de luxo para o público do Rio de Janeiro..."
                                    className="w-full h-24 p-3 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                                    value={formData.goal}
                                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                                />
                                <p className="text-xs text-slate-400 dark:text-slate-500 italic flex items-center gap-1">
                                    <Bot className="h-3 w-3" />
                                    Nossa IA usará isso para definir segmentação e interesses automaticamente.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">URL de Destino (sua Landing Page)</label>
                                <input
                                    type="url"
                                    placeholder="https://suapagina.com.br"
                                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                                    value={formData.linkUrl}
                                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                                />
                                <p className="text-xs text-slate-400 dark:text-slate-500 italic">Para onde as pessoas serão direcionadas ao clicar no anúncio.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Orçamento Diário (Estimado)</label>
                                <div className="flex items-center gap-4">
                                    <span className="text-slate-400 dark:text-slate-500">R$ 20</span>
                                    <input
                                        type="range"
                                        min="20"
                                        max="500"
                                        step="10"
                                        className="flex-1 accent-primary-600 cursor-pointer"
                                        value={formData.budget}
                                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                    />
                                    <span className="font-bold text-primary-600 dark:text-primary-400">R$ {formData.budget}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between pt-6">
                            <Button variant="ghost" onClick={prevStep} className="dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800">Voltar</Button>
                            <Button onClick={nextStep} disabled={!formData.goal} className="bg-primary-600 hover:bg-primary-700 text-white">
                                Próximo: Criativos <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Creatives */}
                {step === 3 && (
                    <div className="p-8 space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Criativos da Campanha</h3>
                                <p className="text-slate-500 dark:text-slate-400">Suba suas imagens ou deixe nossa IA cuidar da estratégia.</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleGenerateAI}
                                disabled={generatingAI}
                                className="border-primary-200 dark:border-primary-900/50 hover:bg-primary-50 dark:hover:bg-primary-900/10 text-primary-600 dark:text-primary-400 gap-2"
                            >
                                {generatingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                Gerar Sugestões com IA
                            </Button>
                        </div>

                        {/* AI Suggestions Panel */}
                        {aiSuggestions && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Bot className="h-3 w-3" />
                                        Títulos Sugeridos
                                    </h4>
                                    <div className="space-y-2">
                                        {aiSuggestions.headlines.map((h, i) => (
                                            <div key={i} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm">
                                                {h}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Sparkles className="h-3 w-3" />
                                        Textos Principais
                                    </h4>
                                    <div className="space-y-2">
                                        {aiSuggestions.primary_texts.map((t, i) => (
                                            <div key={i} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 shadow-sm italic leading-relaxed">
                                                "{t}"
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {aiSuggestions.image_prompts?.[0] && (
                                    <div className="md:col-span-2 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Sugestão de Visual:</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-500 italic">{aiSuggestions.image_prompts[0]}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-6">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple
                                accept="image/*,video/*"
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setImages([...images, ...Array.from(e.target.files)]);
                                    }
                                }}
                            />

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center space-y-4 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/10 dark:hover:bg-primary-900/10 transition-colors cursor-pointer group"
                            >
                                <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full mx-auto flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-all">
                                    <ImageIcon className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">Suba suas imagens (opcional)</p>
                                    <p className="text-sm text-slate-400 dark:text-slate-500">A IA também pode usar as sugestões acima se você não tiver imagens agora.</p>
                                </div>
                            </div>

                            {images.length > 0 && (
                                <div className="grid grid-cols-1 gap-2">
                                    {images.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                {file.type.startsWith('video/') ? (
                                                    <div className="h-4 w-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                                        <Sparkles className="h-2 w-2 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                ) : (
                                                    <ImageIcon className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                                                )}
                                                <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{file.name}</span>
                                            </div>
                                            <button
                                                onClick={() => setImages(images.filter((_, i) => i !== idx))}
                                                className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                            <Button variant="ghost" onClick={prevStep} disabled={loading} className="dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800">Voltar</Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="bg-primary-600 hover:bg-primary-700 text-white min-w-[140px]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Criando...
                                    </>
                                ) : 'Publicar Campanha'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
