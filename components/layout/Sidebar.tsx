
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, Settings, BarChart3, Layers, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Visão Geral", href: "/dashboard", icon: LayoutDashboard },
    { name: "Agentes de IA", href: "/dashboard/agents", icon: Bot },
    { name: "Criar Campanha", href: "/dashboard/create", icon: PlusCircle },
    { name: "Campanhas", href: "/dashboard/campaigns", icon: Layers },
    { name: "Relatórios", href: "/dashboard/reports", icon: BarChart3 },
    { name: "Configurações", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-72 flex-col border-r border-slate-100 bg-white">
            <div className="flex h-20 items-center px-8">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-200">
                        <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-extrabold tracking-tight text-slate-900">Track<span className="text-primary-600">Ads</span></span>
                </div>
            </div>

            <nav className="flex-1 space-y-1.5 px-4 py-6">
                <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Menu Principal</p>
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "group flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                                isActive
                                    ? "bg-primary-600 text-white shadow-lg shadow-primary-100"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                                    isActive ? "text-white" : "text-slate-400 group-hover:text-primary-500"
                                )}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 bg-slate-50/50 m-4 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary-600 font-bold border border-slate-100">
                        JD
                    </div>
                    <div className="text-xs overflow-hidden">
                        <p className="font-bold text-slate-900 truncate">Júlio Oliveira</p>
                        <p className="text-slate-500 truncate">Plan: Enterprise</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
