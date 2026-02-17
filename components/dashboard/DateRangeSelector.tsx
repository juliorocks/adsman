
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
];

export function DateRangeSelector() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentPreset = searchParams.get("date_preset") || "last_30d";

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set(name, value);
            return params.toString();
        },
        [searchParams]
    );

    const handleSelect = (value: string) => {
        router.push(`/dashboard?${createQueryString("date_preset", value)}`);
    };

    return (
        <div className="flex items-center gap-2">
            <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                    value={currentPreset}
                    onChange={(e) => handleSelect(e.target.value)}
                    className="pl-10 pr-4 h-10 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none min-w-[180px]"
                >
                    {DATE_PRESETS.map((preset) => (
                        <option key={preset.value} value={preset.value}>
                            {preset.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
