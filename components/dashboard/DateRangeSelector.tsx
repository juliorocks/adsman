
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Calendar } from "lucide-react";

const DATE_PRESETS = [
    { label: "Hoje", value: "today" },
    { label: "Ontem", value: "yesterday" },
    { label: "Últimos 7 dias", value: "last_7d" },
    { label: "Últimos 30 dias", value: "last_30d" },
    { label: "Este mês", value: "this_month" },
    { label: "Mês passado", value: "last_month" },
    { label: "Máximo", value: "maximum" },
    { label: "Personalizado", value: "custom" },
];

export function DateRangeSelector() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentPreset = searchParams.get("date_preset") || "last_30d";
    const since = searchParams.get("since") || "";
    const until = searchParams.get("until") || "";

    const handleSelect = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("date_preset", value);
        if (value !== "custom") {
            params.delete("since");
            params.delete("until");
        }
        router.push(`/dashboard?${params.toString()}`);
    };

    const handleCustomDateChange = (name: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(name, value);
        router.push(`/dashboard?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2">
            <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                    value={currentPreset}
                    onChange={(e) => handleSelect(e.target.value)}
                    className="pl-10 pr-8 h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none min-w-[160px] dark:text-slate-200"
                >
                    {DATE_PRESETS.map((preset) => (
                        <option key={preset.value} value={preset.value}>
                            {preset.label}
                        </option>
                    ))}
                </select>
            </div>

            {currentPreset === "custom" && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                    <input
                        type="date"
                        value={since}
                        onChange={(e) => handleCustomDateChange("since", e.target.value)}
                        className="h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-slate-200"
                    />
                    <span className="text-slate-400 dark:text-slate-500">até</span>
                    <input
                        type="date"
                        value={until}
                        onChange={(e) => handleCustomDateChange("until", e.target.value)}
                        className="h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-slate-200"
                    />
                </div>
            )}
        </div>
    );
}
