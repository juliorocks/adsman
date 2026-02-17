
"use client";

import React, { useState, useEffect } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./SortableItem";
import {
    DollarSign,
    MousePointerClick,
    Target,
    TrendingUp,
    BarChart3,
    Activity,
    Percent,
    ShoppingCart,
    Settings2,
    Users,
    MessageCircle,
    CheckSquare,
    Coins,
    Contact2,
    History
} from "lucide-react";
import { MetricCard } from "./MetricCard";
import { Button } from "@/components/ui/button";

const METRIC_CONFIG: Record<string, any> = {
    spend: { title: "Gasto Total", icon: DollarSign, format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
    impressions: { title: "Impressões", icon: Target, format: (v: number) => v.toLocaleString('pt-BR') },
    clicks: { title: "Cliques", icon: MousePointerClick, format: (v: number) => v.toLocaleString('pt-BR') },
    roas: { title: "ROAS Estimado", icon: TrendingUp, format: (v: number) => `${v}x` },
    cpc: { title: "CPC Médio", icon: Activity, format: (v: number) => `R$ ${v.toFixed(2)}` },
    ctr: { title: "CTR", icon: Percent, format: (v: number) => `${v}%` },
    cpm: { title: "CPM", icon: BarChart3, format: (v: number) => `R$ ${v.toFixed(2)}` },
    conversions: { title: "Conversões", icon: ShoppingCart, format: (v: number) => typeof v === 'number' ? v.toLocaleString('pt-BR') : v },
    leads: { title: "Leads", icon: Users, format: (v: number) => v.toLocaleString('pt-BR') },
    conversations: { title: "Conversas", icon: MessageCircle, format: (v: number) => v.toLocaleString('pt-BR') },
    results: { title: "Resultados", icon: CheckSquare, format: (v: number) => v.toLocaleString('pt-BR') },
    cpa: { title: "CPA Médio", icon: Coins, format: (v: number) => `R$ ${v.toFixed(2)}` },
    top_gender: { title: "Gênero Principal", icon: Contact2, format: (v: string) => v },
    top_age: { title: "Idade Principal", icon: History, format: (v: string) => v },
};

const DEFAULT_LAYOUT = ['spend', 'impressions', 'clicks', 'roas', 'cpc', 'ctr', 'results', 'cpa'];

export function DraggableGrid({ metrics }: { metrics: any }) {
    const [layout, setLayout] = useState<string[]>([]);
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [visibleMetrics, setVisibleMetrics] = useState<Set<string>>(new Set());

    useEffect(() => {
        const savedLayout = localStorage.getItem('dashboard_layout');
        const savedVisible = localStorage.getItem('dashboard_visible');

        if (savedLayout) {
            setLayout(JSON.parse(savedLayout));
        } else {
            setLayout([...DEFAULT_LAYOUT]);
        }

        if (savedVisible) {
            setVisibleMetrics(new Set(JSON.parse(savedVisible)));
        } else {
            setVisibleMetrics(new Set(DEFAULT_LAYOUT));
        }
    }, []);

    const savePreferences = (newLayout: string[], newVisible: string[]) => {
        localStorage.setItem('dashboard_layout', JSON.stringify(newLayout));
        localStorage.setItem('dashboard_visible', JSON.stringify(newVisible));
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = layout.indexOf(active.id as string);
            const newIndex = layout.indexOf(over.id as string);
            const newLayout = arrayMove(layout, oldIndex, newIndex);
            setLayout(newLayout);
            savePreferences(newLayout, Array.from(visibleMetrics));
        }
    }

    const toggleMetric = (id: string) => {
        const next = new Set(visibleMetrics);
        if (next.has(id)) {
            next.delete(id);
        } else {
            if (next.size >= 8) return; // Enforce limit
            next.add(id);
        }
        setVisibleMetrics(next);

        // Add to layout if not there
        let nextLayout = [...layout];
        if (!nextLayout.includes(id)) {
            nextLayout.push(id);
            setLayout(nextLayout);
        }
        savePreferences(nextLayout, Array.from(next));
    };

    if (layout.length === 0) return null;

    const limitReached = visibleMetrics.size >= 8;

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 text-slate-500 hover:text-primary-600 transition-colors ${isCustomizing ? 'bg-primary-50 text-primary-600 border border-primary-100' : ''}`}
                    onClick={() => setIsCustomizing(!isCustomizing)}
                >
                    <Settings2 className="h-4 w-4" />
                    Personalizar Dash
                </Button>
            </div>

            {isCustomizing && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl mb-6 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Escolha as métricas visíveis:</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${limitReached ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                            {visibleMetrics.size}/8 selecionados
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {Object.keys(METRIC_CONFIG).map(id => {
                            const isSelected = visibleMetrics.has(id);
                            const disabled = !isSelected && limitReached;
                            return (
                                <button
                                    key={id}
                                    disabled={disabled}
                                    onClick={() => toggleMetric(id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${isSelected
                                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200'
                                        : disabled
                                            ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-primary-400'
                                        }`}
                                >
                                    {METRIC_CONFIG[id].title}
                                </button>
                            );
                        })}
                    </div>
                    {limitReached && (
                        <p className="mt-3 text-[10px] text-orange-500 font-medium px-2 italic">
                            Limite de 8 cards atingido. Desmarque um para habilitar outros.
                        </p>
                    )}
                </div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={layout}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {layout.filter(id => visibleMetrics.has(id)).map((id) => {
                            const config = METRIC_CONFIG[id];
                            return (
                                <SortableItem key={id} id={id}>
                                    <MetricCard
                                        title={config.title}
                                        value={config.format(metrics[id] || 0)}
                                        subValue={id === 'roas' ? `(R$ ${(metrics.total_revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})` : undefined}
                                        description="Período selecionado"
                                        trend="up"
                                        icon={config.icon}
                                    />
                                </SortableItem>
                            );
                        })}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
