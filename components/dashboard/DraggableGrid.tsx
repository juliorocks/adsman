
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
    Settings2
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
    conversions: { title: "Conversões", icon: ShoppingCart, format: (v: number) => v.toLocaleString('pt-BR') },
};

const DEFAULT_LAYOUT = ['spend', 'impressions', 'clicks', 'roas', 'cpc', 'ctr'];

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
            setLayout(DEFAULT_LAYOUT);
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

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 text-slate-500 hover:text-primary-600 transition-colors ${isCustomizing ? 'bg-primary-50 text-primary-600' : ''}`}
                    onClick={() => setIsCustomizing(!isCustomizing)}
                >
                    <Settings2 className="h-4 w-4" />
                    Personalizar Dash
                </Button>
            </div>

            {isCustomizing && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6 animate-in fade-in slide-in-from-top-2">
                    <p className="text-sm font-semibold text-slate-700 mb-3 px-2">Escolha as métricas visíveis:</p>
                    <div className="flex flex-wrap gap-2">
                        {Object.keys(METRIC_CONFIG).map(id => (
                            <button
                                key={id}
                                onClick={() => toggleMetric(id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${visibleMetrics.has(id)
                                        ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-200'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-primary-300'
                                    }`}
                            >
                                {METRIC_CONFIG[id].title}
                            </button>
                        ))}
                    </div>
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
