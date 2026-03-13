"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, Settings, BarChart3, Layers, Bot, PanelLeftClose, PanelLeftOpen, Database, Inbox, LogOut, Shield, User, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { logout } from "@/actions/auth";

const navigation = [
    { name: "Visão Geral", href: "/dashboard", icon: LayoutDashboard },
    { name: "Agentes de IA", href: "/dashboard/agents", icon: Bot },
    { name: "Criar Campanha", href: "/dashboard/create", icon: PlusCircle },
    { name: "Campanhas", href: "/dashboard/campaigns", icon: Layers },
    { name: "Bases de Conhecimento", href: "/dashboard/knowledge", icon: Database },
    { name: "Caixa de Entrada", href: "/dashboard/inbox", icon: Inbox },
    { name: "Relatórios", href: "/dashboard/reports", icon: BarChart3 },
    { name: "Configurações", href: "/dashboard/settings", icon: Settings },
];

interface UserInfo {
    name: string;
    email: string;
    initials: string;
    isMember: boolean;
    role: string;
}

function RoleBadge({ role, isMember }: { role: string; isMember: boolean }) {
    if (!isMember) return null;
    const styles: Record<string, string> = {
        admin: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
        editor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        reader: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };
    const icons: Record<string, React.ReactNode> = {
        admin: <Shield className="h-2.5 w-2.5" />,
        editor: <User className="h-2.5 w-2.5" />,
        reader: <ShieldAlert className="h-2.5 w-2.5" />,
    };
    const labels: Record<string, string> = { admin: "Admin", editor: "Editor", reader: "Leitor" };
    return (
        <span className={cn("inline-flex items-center gap-1 border px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase", styles[role] || styles.reader)}>
            {icons[role] || icons.reader} {labels[role] || role}
        </span>
    );
}

export function Sidebar({ clientSelector, userInfo }: { clientSelector?: React.ReactNode; userInfo?: UserInfo }) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const user = userInfo ?? { name: "Usuário", email: "", initials: "U", isMember: false, role: "" };

    const handleLogout = async () => {
        setLoggingOut(true);
        await logout();
    };

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
                {!isCollapsed && clientSelector}
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

            {/* User card */}
            <div className={cn("m-4 rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50", isCollapsed ? "p-2" : "p-4")}>
                <Link href="/dashboard/settings" title={isCollapsed ? user.name : undefined}>
                    <div className={cn("flex items-center gap-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors p-2 cursor-pointer", isCollapsed && "justify-center")}>
                        <div className="h-10 w-10 rounded-xl bg-primary-600/10 dark:bg-primary-600/20 shadow-sm flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold border border-primary-100 dark:border-primary-900 flex-shrink-0 text-sm">
                            {user.initials}
                        </div>
                        {!isCollapsed && (
                            <div className="text-xs overflow-hidden flex-1 min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                                <p className="text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                <RoleBadge role={user.role} isMember={user.isMember} />
                            </div>
                        )}
                    </div>
                </Link>

                {!isCollapsed && (
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-500 hover:bg-red-500/5 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        {loggingOut ? "Saindo..." : "Sair"}
                    </button>
                )}
                {isCollapsed && (
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        title="Sair"
                        className="mt-2 w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/5 transition-colors disabled:opacity-50"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
