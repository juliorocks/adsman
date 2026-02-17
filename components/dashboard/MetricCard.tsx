
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, DollarSign, MousePointerClick, TrendingUp } from "lucide-react";

interface MetricCardProps {
    title: string;
    value: string | number;
    subValue?: string;
    description: string;
    trend: "up" | "down" | "neutral";
    icon: React.ElementType;
}

export function MetricCard({ title, value, subValue, description, trend, icon: Icon }: MetricCardProps) {
    return (
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                    <Icon className="h-6 w-6" />
                </div>
                {trend !== "neutral" && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend === "up" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                        }`}>
                        {trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {description}
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</h3>
                <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</div>
                    {subValue && (
                        <div className="text-sm font-semibold text-slate-400 dark:text-slate-500">{subValue}</div>
                    )}
                </div>
            </div>
        </div>
    );
}
