
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
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

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

        if (data.length === 1) {
            return [{
                x: 50, // Center the single point
                y: 50, // Center vertically roughly
                value: (data[0] as any)[activeMetricId],
                date: new Date(data[0].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
            }];
        }

        return data.map((d, i) => ({
            x: (i / (data.length - 1)) * 100,
            y: 100 - ((((d as any)[activeMetricId] || 0) - min) / range) * 80 - 10, // 10% padding
            value: (d as any)[activeMetricId],
            date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
        }));
    }, [data, activeMetricId]);

    const pathData = useMemo(() => {
        if (chartData.length === 0) return "";
        if (chartData.length === 1) {
            // Horizontal line for single point
            return `M 0,${chartData[0].y} L 100,${chartData[0].y}`;
        }
        return `M ${chartData.map(p => `${p.x},${p.y}`).join(" L ")}`;
    }, [chartData]);

    const areaData = useMemo(() => {
        if (chartData.length === 0) return "";
        if (chartData.length === 1) {
            return `M 0,${chartData[0].y} L 100,${chartData[0].y} L 100,100 L 0,100 Z`;
        }
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

            <div className="relative h-[300px] w-full group select-none">
                {/* SVG Layer for Lines and Area */}
                <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="h-full w-full overflow-visible absolute inset-0 z-0"
                >
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={activeMetric.color} stopOpacity="0.1" />
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
                            strokeWidth="1"
                            vectorEffect="non-scaling-stroke"
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
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                        className="transition-all duration-1000 ease-in-out"
                    />
                </svg>

                {/* HTML Overlay Layer for Interactive Points */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                    {chartData.map((p, i) => (
                        <div
                            key={i}
                            className="absolute flex items-center justify-center pointer-events-auto"
                            style={{
                                left: `${p.x}%`,
                                top: `${p.y}%`,
                                transform: 'translate(-50%, -50%)' // Center the div on the coordinate
                            }}
                            onMouseEnter={() => setHoveredPoint(i)}
                            onMouseLeave={() => setHoveredPoint(null)}
                        >
                            {/* Hit Area (Invisible but clickable) */}
                            <div className="w-6 h-6 rounded-full bg-transparent flex items-center justify-center cursor-pointer">
                                {/* Visible Point (Only on hover or active) */}
                                <div
                                    className={`w-3 h-3 bg-white border-[2px] rounded-full transition-transform duration-300 ${hoveredPoint === i ? 'scale-125 opacity-100 ring-2 ring-white/50' : 'scale-0 opacity-0'
                                        }`}
                                    style={{ borderColor: activeMetric.color }}
                                />
                            </div>

                            {/* Tooltip */}
                            <div
                                className={`absolute bottom-full mb-2 bg-slate-900 text-white text-xs font-medium px-2 py-1 rounded transition-all duration-200 whitespace-nowrap ${hoveredPoint === i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                                    }`}
                            >
                                {activeMetric.format(p.value)}
                                {/* Arrow/Triangle */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                            </div>
                        </div>
                    ))}
                </div>

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
