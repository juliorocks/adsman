
"use client";

import React, { useState, useMemo } from "react";
import { BarChart3, TrendingUp, MousePointerClick, DollarSign, Target } from "lucide-react";

interface DataPoint {
    date: string;
    spend: number;
    clicks: number;
    impressions: number;
    roas: number;
}

interface PerformanceChartProps {
    data: DataPoint[];
}

const METRICS = [
    { id: "spend", label: "Gasto", icon: DollarSign, color: "#6366f1", format: (v: number) => `R$ ${v.toFixed(2)}` },
    { id: "clicks", label: "Cliques", icon: MousePointerClick, color: "#8b5cf6", format: (v: number) => v.toLocaleString() },
    { id: "impressions", label: "Impressões", icon: Target, color: "#0ea5e9", format: (v: number) => v.toLocaleString() },
    { id: "roas", label: "ROAS", icon: TrendingUp, color: "#10b981", format: (v: number) => `${v.toFixed(2)}x` },
];

export function PerformanceChart({ data }: PerformanceChartProps) {
    const [activeMetricId, setActiveMetricId] = useState("spend");
    const activeMetric = useMemo(() =>
        METRICS.find(m => m.id === activeMetricId) || METRICS[0]
        , [activeMetricId]);

    // Simple SVG Line Chart Logic
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const values = data.map(d => (d as any)[activeMetricId] || 0);
        const max = Math.max(...values, 1);
        const min = Math.min(...values);
        const range = max - min || 1;

        return data.map((d, i) => ({
            x: (i / (data.length - 1)) * 100,
            y: 100 - ((((d as any)[activeMetricId] || 0) - min) / range) * 80 - 10, // 10% padding
            value: (d as any)[activeMetricId],
            date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
        }));
    }, [data, activeMetricId]);

    const pathData = useMemo(() => {
        if (chartData.length < 2) return "";
        return `M ${chartData.map(p => `${p.x},${p.y}`).join(" L ")}`;
    }, [chartData]);

    const areaData = useMemo(() => {
        if (chartData.length < 2) return "";
        return `${pathData} L 100,100 L 0,100 Z`;
    }, [chartData, pathData]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
                {METRICS.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => setActiveMetricId(m.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${activeMetricId === m.id
                                ? 'bg-slate-900 text-white shadow-lg scale-105'
                                : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        <m.icon className={`h-3.5 w-3.5 ${activeMetricId === m.id ? 'text-white' : 'text-slate-400'}`} />
                        {m.label}
                    </button>
                ))}
            </div>

            <div className="relative h-[300px] w-full group">
                <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="h-full w-full overflow-visible"
                >
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={activeMetric.color} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={activeMetric.color} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    {[0, 25, 50, 75, 100].map((line) => (
                        <line
                            key={line}
                            x1="0"
                            y1={line}
                            x2="100"
                            y2={line}
                            stroke="#f1f5f9"
                            strokeWidth="0.1"
                        />
                    ))}

                    {/* Area Fill */}
                    <path
                        d={areaData}
                        fill="url(#chartGradient)"
                        className="transition-all duration-1000 ease-in-out"
                    />

                    {/* Main Line */}
                    <path
                        d={pathData}
                        fill="none"
                        stroke={activeMetric.color}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-1000 ease-in-out drop-shadow-lg"
                        style={{ filter: `drop-shadow(0 4px 6px ${activeMetric.color}44)` }}
                    />

                    {/* Data Points */}
                    {chartData.map((p, i) => (
                        <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r="0.8"
                            fill="white"
                            stroke={activeMetric.color}
                            strokeWidth="0.4"
                            className="opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100"
                        />
                    ))}
                </svg>

                {/* X Axis Labels */}
                <div className="absolute inset-x-0 -bottom-6 flex justify-between px-1">
                    {chartData.filter((_, i) => i % Math.ceil(chartData.length / 6) === 0).map((p, i) => (
                        <span key={i} className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {p.date}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
