
"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, Target, DollarSign, Image as ImageIcon, CheckCircle2, ChevronRight, Loader2, AlertCircle, X, Box, Activity, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSmartCampaignAction, uploadMediaAction, getFacebookPagesAction, updatePreferredIdentityAction, uploadMediaFromUrlAction } from "@/actions/campaign";
import { GoogleDriveSelector } from "./GoogleDriveSelector";
import { generateCreativeIdeasAction, generateCreativeImageAction } from "@/actions/creatives";
import { getKnowledgeBases } from "@/actions/knowledge";

const OBJECTIVES = [
    { id: 'OUTCOME_SALES', label: 'Vendas', icon: DollarSign, description: 'Encontre pessoas com alta probabilidade de comprar seu produto.' },
    { id: 'OUTCOME_LEADS', label: 'Leads', icon: Target, description: 'Colete contatos para o seu negócio.' },
    { id: 'OUTCOME_TRAFFIC', label: 'Tráfego', icon: Target, description: 'Envie pessoas para um site ou app.' },
    { id: 'OUTCOME_AWARENESS', label: 'Reconhecimento', icon: Sparkles, description: 'Alcance o maior número de pessoas possível.' },
];

const AGENTS = [
    { id: 'strategist', name: 'STRATEGIST', img: '/robots/strategist.png', glow: 'text-blue-400', eye: 'bg-emerald-400' },
    { id: 'creative', name: 'CREATIVE', img: '/robots/creative.png', glow: 'text-purple-400', eye: 'bg-fuchsia-400' },
    { id: 'auditor', name: 'AUDITOR', img: '/robots/auditor.png', glow: 'text-orange-500', eye: 'bg-yellow-400' },
];

const RobotBlink = ({ color }: { color: string }) => (
    <div className="absolute inset-0 pointer-events-none z-30">
        <motion.div
            className={`absolute top-[38%] left-[32%] w-[12%] h-[6%] rounded-full ${color} mix-blend-screen blur-[1px]`}
            animate={{ scaleY: [1, 1, 0, 1], opacity: [0.8, 0.8, 0, 0.8] }}
            transition={{ duration: 5, repeat: Infinity, times: [0, 0.9, 0.92, 1], ease: "easeInOut" }}
        />
        <motion.div
            className={`absolute top-[38%] right-[32%] w-[12%] h-[6%] rounded-full ${color} mix-blend-screen blur-[1px]`}
            animate={{ scaleY: [1, 1, 0, 1], opacity: [0.8, 0.8, 0, 0.8] }}
            transition={{ duration: 5, repeat: Infinity, times: [0, 0.9, 0.92, 1], ease: "easeInOut" }}
        />
    </div>
);

function AgentSquadOverlay({ activeMessage }: { activeMessage: { agent: string, text: string } | null }) {
    if (!activeMessage || !activeMessage.agent) return null;

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-end bg-slate-950 overflow-hidden rounded-2xl border border-slate-800">
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
            </div>

            {/* Neural Scanner Line */}
            <motion.div
                animate={{ y: ["0%", "100%", "0%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-x-0 h-px bg-primary-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-40 pointer-events-none"
            />

            {/* Header Status */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase whitespace-nowrap">Orquestração em Tempo Real</span>
            </div>

            {/* Robot Squad */}
            <div className="relative w-full flex justify-center items-end gap-2 px-6 pb-20 z-10 max-w-lg mx-auto">
                {AGENTS.map((agent) => {
                    const isActive = activeMessage.agent === agent.id;
                    return (
                        <div key={agent.id} className="relative w-1/3 flex flex-col items-center">
                            {/* Label */}
                            <div className={`mb-2 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 z-20`}>
                                <span className={`text-[7px] font-black tracking-widest uppercase ${agent.glow}`}>{agent.name}</span>
                            </div>

                            {/* Sprite */}
                            <motion.div
                                className="relative w-16 h-16"
                                animate={{
                                    y: isActive ? [-4, 4, -4] : [-2, 2, -2],
                                    rotate: isActive ? [-1, 1, -1] : 0
                                }}
                                transition={{ duration: isActive ? 1.5 : 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <img src={agent.img} alt={agent.name} className="w-full h-full object-contain" />
                                <RobotBlink color={agent.eye} />
                                {isActive && (
                                    <motion.div
                                        initial={{ scale: 1, opacity: 0.5 }}
                                        animate={{ scale: 1.5, opacity: 0 }}
                                        transition={{ duration: 1.2, repeat: Infinity }}
                                        className="absolute inset-0 rounded-full border border-white/20"
                                    />
                                )}
                            </motion.div>

                            {/* Speech Bubble */}
                            <AnimatePresence mode="wait">
                                {isActive && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                        className="absolute bottom-full mb-20 w-40 z-50 pointer-events-none"
                                    >
                                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-2xl">
                                            <div className="flex items-center gap-1.5 mb-1 opacity-50">
                                                <Activity className="w-2.5 h-2.5 text-green-400" />
                                                <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Ativo</span>
                                            </div>
                                            <p className="text-[10px] font-medium text-white leading-tight">
                                                {activeMessage.text}
                                            </p>
                                        </div>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Conveyor Belt */}
            <div className="absolute bottom-0 w-full h-16 bg-slate-900 border-t border-slate-800 flex items-center shadow-[inset_0_10px_30px_rgba(0,0,0,0.5)] z-20">
                <motion.div
                    className="flex w-[200%] h-full opacity-10"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                >
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="w-[5%] border-r border-slate-700 h-full skew-x-12" />
                    ))}
                </motion.div>

                {/* Moving Packages */}
                <div className="absolute inset-0 flex items-center">
                    {[1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute"
                            initial={{ left: "-10%" }}
                            animate={{ left: "110%" }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: i * 2.5 }}
                        >
                            <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center rotate-12 shadow-lg">
                                <Box className="w-4 h-4 text-slate-500" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function SmartCampaignWizard() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [generatingImage, setGeneratingImage] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        objective: '',
        goal: '',
        knowledgeBaseId: '', // Added Knowledge Base
        budget: '50',
        linkUrl: '',
        pageId: '',
        instagramId: '',
        status: 'PAUSED' as 'ACTIVE' | 'PAUSED',
    });
    const [images, setImages] = useState<File[]>([]);
    const [cloudFiles, setCloudFiles] = useState<{ id: string, name: string, url: string, type: 'IMAGE' | 'VIDEO' }[]>([]);
    const [showDriveSelector, setShowDriveSelector] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<{
        headlines: string[];
        primary_texts: string[];
        image_prompts: string[];
    } | null>(null);
    const [activeMessage, setActiveMessage] = useState<{ agent: string, text: string } | null>(null);
    const [availablePages, setAvailablePages] = useState<any[]>([]);
    const [activeAccount, setActiveAccount] = useState<{ id: string, name: string } | null>(null);
    const [loadingPages, setLoadingPages] = useState(false);

    // Knowledge Bases State
    const [knowledgeBases, setKnowledgeBases] = useState<any[]>([]);

    useEffect(() => {
        const loadKB = async () => {
            try {
                const kbs = await getKnowledgeBases();
                setKnowledgeBases(kbs);
            } catch (e) {
                console.error(e);
            }
        };
        loadKB();
    }, []);

    useEffect(() => {
        if (step === 2 && availablePages.length === 0) {
            handleFetchPages();
        }
    }, [step]);

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleFetchPages = async () => {
        setLoadingPages(true);
        try {
            const result = await getFacebookPagesAction() as any;
            if (result.success && result.data) {
                setAvailablePages(result.data);
                if (result.accountName) {
                    setActiveAccount({ id: result.accountId, name: result.accountName });
                }

                // Auto-selection Strategy
                let newPageId = '';
                let newIgId = '';

                // 1. Priority: Use preferred IDs from DB (if valid)
                if (result.preferredPageId) {
                    newPageId = result.preferredPageId;
                    newIgId = result.preferredInstagramId || '';
                    console.log(`GAGE: Using preferred identity: ${newPageId}`);
                }
                // 2. Fallback: If only one page exists, auto-select it
                else if (result.data.length === 1) {
                    newPageId = result.data[0].id;
                    newIgId = result.data[0].connected_instagram_account?.id || '';
                    console.log(`GAGE: Auto-selecting only available page: ${newPageId}`);
                }

                if (newPageId) {
                    setFormData(prev => ({
                        ...prev,
                        pageId: newPageId,
                        instagramId: newIgId
                    }));
                } else {
                    // Reset if current selection is invalid for new list
                    setFormData(prev => {
                        const isValid = result.data.some((p: any) => p.id === prev.pageId);
                        if (!isValid) return { ...prev, pageId: '', instagramId: '' };
                        return prev;
                    });
                }
            }
        } catch (err) {
            console.error("Error fetching pages:", err);
        } finally {
            setLoadingPages(false);
        }
    };

    const handleGenerateAI = async () => {
        setGeneratingAI(true);
        setError(null);
        try {
            const result = await generateCreativeIdeasAction(formData.goal, formData.knowledgeBaseId);
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

    const handleGenerateImage = async (prompt: string) => {
        setGeneratingImage(true);
        setError(null);
        try {
            const result = await generateCreativeImageAction(prompt);
            if (result.success && result.url) {
                setCloudFiles(prev => [...prev, {
                    id: `dalle-${Date.now()}`,
                    name: 'DALL-E Generated Image.png',
                    url: result.url as string,
                    type: 'IMAGE'
                }]);
            } else {
                setError(result.error || "Não foi possível gerar a imagem agora.");
            }
        } catch (err: any) {
            setError("Erro ao se comunicar com DALL-E 3.");
        } finally {
            setGeneratingImage(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const targetedFiles = images.slice(0, 10);
            const mediaReferences: { type: 'IMAGE' | 'VIDEO', ref: string }[] = [];

            setActiveMessage({ agent: 'strategist', text: 'Analizando os KPIs de destino e preparando a rota de distribuição neural...' });
            await new Promise(r => setTimeout(r, 2000));

            // Process Local Files
            for (let i = 0; i < targetedFiles.length; i++) {
                const file = targetedFiles[i];
                const isVideo = file.type.startsWith('video/');

                const messages = isVideo
                    ? [
                        { agent: 'creative', text: `Codificando vídeo "${file.name}" para alto impacto visual...` },
                        { agent: 'strategist', text: `Sincronizando metadados de mídia com o pipeline do Meta...` }
                    ]
                    : [
                        { agent: 'creative', text: `Otimizando brilho e contraste da imagem "${file.name}"...` },
                        { agent: 'creative', text: `Comprimindo asset para carregamento ultrarrápido no feed...` }
                    ];

                setActiveMessage(messages[0]);

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

                    setActiveMessage(messages[1]);

                    const uploadResult = await uploadMediaAction({
                        type: isVideo ? 'VIDEO' : 'IMAGE',
                        data: base64
                    });

                    if (uploadResult && uploadResult.success && uploadResult.ref) {
                        mediaReferences.push({ type: uploadResult.type as any, ref: uploadResult.ref });
                    } else {
                        const errorMsg = uploadResult?.error || "Falha na resposta do servidor (provavelmente arquivo muito grande).";
                        console.error(`Media upload failed for ${file.name}:`, errorMsg);
                        throw new Error(`Erro ao subir "${file.name}": ${errorMsg}`);
                    }
                } catch (err) {
                    console.error("Media processing/upload failed:", file.name, err);
                }
            }

            // Process Cloud Files
            for (let i = 0; i < cloudFiles.length; i++) {
                const cloudFile = cloudFiles[i];
                setActiveMessage({
                    agent: 'creative',
                    text: `Importando "${cloudFile.name}" via Pipeline Cloud (Google Drive)...`
                });

                const result = await uploadMediaFromUrlAction({
                    type: cloudFile.type,
                    url: cloudFile.url,
                    fileId: cloudFile.id
                });

                if (result.success && result.ref) {
                    mediaReferences.push({ type: result.type as any, ref: result.ref });
                } else {
                    throw new Error(`Cloud Import Falhou: ${result.error}`);
                }
            }

            setActiveMessage({ agent: 'auditor', text: 'Executando auditoria técnica nos criativos e checando compliance de marca...' });
            await new Promise(r => setTimeout(r, 2000));

            setActiveMessage({ agent: 'strategist', text: 'Solicitando autorização de voo para os servidores do Meta Ads. Quase lá!' });

            const result = await createSmartCampaignAction({
                objective: formData.objective,
                goal: formData.goal,
                knowledgeBaseId: formData.knowledgeBaseId,
                budget: formData.budget,
                linkUrl: formData.linkUrl,
                pageId: formData.pageId,
                instagramId: formData.instagramId,
                status: formData.status,
                mediaReferences,
            });

            if (result.success) {
                setActiveMessage({ agent: 'auditor', text: 'Operação concluída. Campanha implantada com sucesso no ambiente de produção.' });
                await new Promise(r => setTimeout(r, 1000));
                nextStep();
            } else {
                setError(result.error || "Ocorreu um erro ao criar a campanha.");
            }
        } catch (err: any) {
            setError(err.message || "Erro de conexão com o servidor.");
        } finally {
            setLoading(false);
            setActiveMessage(null);
        }
    };

    if (step === 5) {
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
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 dark:shadow-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                            }`}>
                            {s}
                        </div>
                        {s < 4 && <div className={`h-1 w-16 mx-1 rounded ${step > s ? 'bg-primary-600' : 'bg-slate-100 dark:bg-slate-800'}`} />}
                    </div>
                ))}
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    {error}
                </div>
            )}

            <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[460px]">
                <AnimatePresence>
                    {activeMessage && <AgentSquadOverlay activeMessage={activeMessage} />}
                </AnimatePresence>

                <AnimatePresence>
                    {showDriveSelector && (
                        <GoogleDriveSelector
                            onClose={() => setShowDriveSelector(false)}
                            onSelect={(file) => {
                                setCloudFiles([...cloudFiles, {
                                    id: file.id,
                                    name: file.name,
                                    url: file.webContentLink || '',
                                    type: file.mimeType.includes('video') ? 'VIDEO' : 'IMAGE'
                                }]);
                                setShowDriveSelector(false);
                            }}
                        />
                    )}
                </AnimatePresence>
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

                {/* Step 2: Identity Selection (CRITICAL FIX) */}
                {step === 2 && (
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Bot className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                                Confirme sua Identidade
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400">Em qual página do Facebook e Instagram este anúncio será veiculado?</p>
                        </div>

                        {activeAccount && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                        <Database className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Conta Ativa (do Dashboard)</p>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{activeAccount.name}</p>
                                    </div>
                                </div>
                                <div className="text-[10px] font-bold text-slate-400">
                                    {activeAccount.id}
                                </div>
                            </div>
                        )}

                        {availablePages.length === 0 && !loadingPages ? (
                            <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
                                <Activity className="h-10 w-10 text-slate-300 mx-auto" />
                                <div className="space-y-1">
                                    <p className="text-slate-900 dark:text-white font-bold">Nenhuma Página vinculada encontrada</p>
                                    <p className="text-sm text-slate-500 max-w-xs mx-auto">Esta conta de anúncios não possui permissão ou vínculo com páginas do Facebook. Verifique no Meta Business Manager.</p>
                                </div>
                                <Button variant="outline" onClick={handleFetchPages} className="mt-4">
                                    Tentar Recarregar
                                </Button>
                            </div>
                        ) : loadingPages ? (
                            <div className="p-12 flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                                <p className="text-slate-500">Buscando suas páginas autorizadas...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-3">
                                    {availablePages.map((page) => (
                                        <button
                                            key={page.id}
                                            onClick={() => {
                                                setFormData({
                                                    ...formData,
                                                    pageId: page.id,
                                                    instagramId: page.connected_instagram_account?.id || ''
                                                });
                                                updatePreferredIdentityAction(page.id, page.connected_instagram_account?.id);
                                            }}
                                            className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${formData.pageId === page.id ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-900/10' : 'border-slate-100 dark:border-slate-800'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500">
                                                    {page.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">{page.name}</p>
                                                    <p className="text-xs text-slate-500">Instagram: {page.connected_instagram_account ? 'Conectado' : 'Não vinculado'}</p>
                                                </div>
                                            </div>
                                            {formData.pageId === page.id && <CheckCircle2 className="h-5 w-5 text-primary-600" />}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Atenção: A escolha errada da identidade resultará em anúncios veiculados na página errada.
                                </p>
                            </div>
                        )}

                        <div className="flex justify-between pt-6">
                            <Button variant="ghost" onClick={prevStep}>Voltar</Button>
                            <Button onClick={nextStep} disabled={!formData.pageId} className="bg-primary-600 hover:bg-primary-700 text-white">
                                Próximo: Configuração <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: AI Config */}
                {step === 3 && (
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

                            <div className="space-y-3 p-4 bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/50 rounded-xl">
                                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <Database className="h-4 w-4 text-primary-500" />
                                    Base de Conhecimento RAG (Opcional)
                                </label>
                                <select
                                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white dark:bg-slate-950 dark:text-white font-medium text-sm"
                                    value={formData.knowledgeBaseId}
                                    onChange={(e) => setFormData({ ...formData, knowledgeBaseId: e.target.value })}
                                >
                                    <option value="" className="text-slate-500">Ex: Sem regras pré -definidas</option>
                                    {knowledgeBases.map((kb) => (
                                        <option key={kb.id} value={kb.id}>{kb.client_name} - {kb.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Conecte o "cérebro" deste cliente. A IA lerá seus PDFs e URLs antes de propor copies e imagens.
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

                            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status Inicial da Campanha</label>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: formData.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.status === 'ACTIVE' ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        {formData.status === 'ACTIVE' ? 'Criar e já Publicar (Ativa)' : 'Criar como Rascunho (Pausada)'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 dark:text-slate-500 italic">Se ativo, a campanha irá para validação do Meta e começará a rodar imediatamente.</p>
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

                {/* Step 4: Creatives */}
                {step === 4 && (
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
                                    <div className="md:col-span-2 space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                                                <ImageIcon className="h-3 w-3" /> Prompt do Visual (DALL-E)
                                            </p>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleGenerateImage(aiSuggestions.image_prompts[0])}
                                                disabled={generatingImage}
                                                className="h-8 text-xs bg-primary-50 hover:bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:hover:bg-primary-900/40 dark:text-primary-400 dark:border-primary-800 shrink-0"
                                            >
                                                {generatingImage ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Sparkles className="h-3 w-3 mr-2" />}
                                                Gerar Imagem com IA (DALL-E 3)
                                            </Button>
                                        </div>
                                        <textarea
                                            value={aiSuggestions.image_prompts[0]}
                                            onChange={(e) => setAiSuggestions({ ...aiSuggestions, image_prompts: [e.target.value] })}
                                            className="w-full text-sm text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                                            placeholder="Descreva a imagem que deseja gerar..."
                                        />
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
                                        const newFiles = Array.from(e.target.files);
                                        const tooLarge = newFiles.filter(f => f.size > 14.5 * 1024 * 1024); // Relaxed for images
                                        if (tooLarge.length > 0) {
                                            setError(`Os seguintes arquivos são muito grandes e podem falhar: ${tooLarge.map(f => f.name).join(', ')}. Considere carregar via Google Drive.`);
                                        }
                                        setImages([...images, ...newFiles]);
                                    }
                                }}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center space-y-3 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/10 dark:hover:bg-primary-900/10 transition-colors cursor-pointer group"
                                >
                                    <div className="h-12 w-12 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full mx-auto flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-all">
                                        <ImageIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Upload Manual</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Selecione arquivos do seu dispositivo</p>
                                    </div>
                                </div>

                                <div
                                    onClick={() => setShowDriveSelector(true)}
                                    className="border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-2xl p-8 text-center space-y-3 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/10 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group"
                                >
                                    <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 text-blue-400 dark:text-blue-500 rounded-full mx-auto flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all">
                                        <Database className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Google Drive / Vault</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
                                            Recomendado para vídeos HD <Sparkles className="h-2 w-2 text-blue-400" />
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {(images.length > 0 || cloudFiles.length > 0) && (
                                <div className="grid grid-cols-1 gap-2">
                                    {images.map((file, idx) => (
                                        <div key={`local-${idx}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
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
                                    {cloudFiles.map((file, idx) => {
                                        const isDalle = file.id.startsWith('dalle');
                                        return (
                                            <div key={`cloud-${idx}`} className={`flex p-3 rounded-lg border ${isDalle ? 'bg-purple-50/30 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800 flex-col gap-4' : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800 items-center justify-between'}`}>
                                                {isDalle ? (
                                                    <>
                                                        <div className="flex items-center justify-between w-full">
                                                            <div className="flex items-center gap-2">
                                                                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                                <span className="text-sm font-bold text-purple-900 dark:text-purple-300">Arte Gerada (DALL-E 3)</span>
                                                            </div>
                                                            <button
                                                                onClick={() => setCloudFiles(cloudFiles.filter((_, i) => i !== idx))}
                                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                        <div className="w-full relative aspect-square rounded-lg overflow-hidden border border-purple-200 dark:border-purple-800 shadow-sm">
                                                            <img src={file.url} alt="Gerada por IA" className="object-cover w-full h-full" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <Database className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                                            <span className="text-sm text-blue-900 dark:text-blue-300 truncate">{file.name}</span>
                                                            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full uppercase font-black tracking-tighter">CLOUD</span>
                                                        </div>
                                                        <button
                                                            onClick={() => setCloudFiles(cloudFiles.filter((_, i) => i !== idx))}
                                                            className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
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
