
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, DollarSign, MousePointerClick, TrendingUp } from "lucide-react";

interface MetricCardProps {
    title: string;
    value: string | number;
    description: string;
    trend: "up" | "down" | "neutral";
    icon: React.ElementType;
}

export function MetricCard({ title, value, description, trend, icon: Icon }: MetricCardProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-slate-500">{title}</h3>
                <Icon className="h-4 w-4 text-slate-400" />
            </div>
            <div>
                <div className="text-2xl font-bold text-slate-900">{value}</div>
                <p className="text-xs text-slate-500 flex items-center mt-1">
                    {trend === "up" ? (
                        <ArrowUpRight className="mr-1 h-4 w-4 text-emerald-500" />
                    ) : (
                        <ArrowDownRight className="mr-1 h-4 w-4 text-rose-500" />
                    )}
                    <span className={trend === "up" ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
                        {description}
                    </span>
                </p>
            </div>
        </div>
    );
}
