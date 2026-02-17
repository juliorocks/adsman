
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, Settings, BarChart3, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Visão Geral", href: "/dashboard", icon: LayoutDashboard },
    { name: "Criar Campanha", href: "/dashboard/create", icon: PlusCircle },
    { name: "Campanhas", href: "/dashboard/campaigns", icon: Layers },
    { name: "Relatórios", href: "/dashboard/reports", icon: BarChart3 },
    { name: "Configurações", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
            <div className="flex h-16 items-center px-6 border-b border-slate-100">
                <span className="text-xl font-bold text-primary-600">MetaAds<span className="text-secondary-500">AI</span></span>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary-50 text-primary-700"
                                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                                    isActive ? "text-primary-600" : "text-slate-400 group-hover:text-slate-500"
                                )}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                        U
                    </div>
                    <div className="text-sm">
                        <p className="font-medium text-slate-700">Usuário</p>
                        <p className="text-xs text-slate-500">Premium Plan</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
