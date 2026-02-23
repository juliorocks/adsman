

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, Settings, BarChart3, Layers, Bot, PanelLeftClose, PanelLeftOpen, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navigation = [
    { name: "Visão Geral", href: "/dashboard", icon: LayoutDashboard },
    { name: "Agentes de IA", href: "/dashboard/agents", icon: Bot },
    { name: "Criar Campanha", href: "/dashboard/create", icon: PlusCircle },
    { name: "Campanhas", href: "/dashboard/campaigns", icon: Layers },
    { name: "Bases de Conhecimento", href: "/dashboard/knowledge", icon: Database },
    { name: "Relatórios", href: "/dashboard/reports", icon: BarChart3 },
    { name: "Configurações", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className={cn(
            "flex h-full flex-col border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 transition-all duration-300",
            isCollapsed ? "w-20" : "w-72"
        )}>
            <div className={cn("flex h-20 items-center px-4", isCollapsed ? "justify-center" : "justify-between")}>
                {!isCollapsed && (
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-200 dark:shadow-none">
                            <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Ads<span className="text-primary-600">.AI</span></span>
                    </div>
                )}
                {isCollapsed && (
                    <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-200 dark:shadow-none">
                        <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                    {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                </Button>
            </div>

            <nav className="flex-1 space-y-1.5 px-3 py-6">
                {!isCollapsed && <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Menu Principal</p>}

                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={isCollapsed ? item.name : undefined}
                            className={cn(
                                "group flex items-center rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200",
                                isActive
                                    ? "bg-primary-600 text-white shadow-lg shadow-primary-100 dark:shadow-none"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100",
                                isCollapsed && "justify-center"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "h-5 w-5 flex-shrink-0 transition-colors",
                                    isActive ? "text-white" : "text-slate-400 group-hover:text-primary-500 dark:group-hover:text-primary-400",
                                    !isCollapsed && "mr-3"
                                )}
                            />
                            {!isCollapsed && <span>{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className={cn("m-4 rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50", isCollapsed ? "p-2" : "p-6")}>
                <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
                    <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-primary-600 font-bold border border-slate-100 dark:border-slate-700 flex-shrink-0">
                        JD
                    </div>
                    {!isCollapsed && (
                        <div className="text-xs overflow-hidden">
                            <p className="font-bold text-slate-900 dark:text-white truncate">Júlio Oliveira</p>
                            <p className="text-slate-500 dark:text-slate-400 truncate">Plan: Enterprise</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
