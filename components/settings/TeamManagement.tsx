"use client";

import { useState } from "react";
import { addTeamMember, removeTeamMember } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserPlus, Shield, User, Trash2, ShieldAlert, Copy, Check, Link2 } from "lucide-react";

export function TeamManagement({ members }: { members: any[] }) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("reader");
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return toast.error("Digite o e-mail do usuário.");

        setLoading(true);
        setInviteLink(null);
        try {
            const result = await addTeamMember(email, role);
            if (result.success) {
                if (result.inviteLink) {
                    // Existing confirmed user — show link for admin to share
                    setInviteLink(result.inviteLink);
                    toast.success("Usuário adicionado! Como ele já tem conta, copie o link abaixo e envie para ele.");
                } else {
                    toast.success("Convite enviado por e-mail com sucesso!");
                }
                setEmail("");
                setRole("reader");
            } else {
                toast.error(result.error);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!inviteLink) return;
        await navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRemove = async (id: string, memberEmail: string) => {
        if (!confirm(`Remover o acesso de ${memberEmail}?`)) return;

        setLoading(true);
        try {
            const { success, error } = await removeTeamMember(id);
            if (success) {
                toast.success("Acesso removido com sucesso.");
            } else {
                toast.error(error || "Erro ao remover acesso.");
            }
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadge = (r: string) => {
        switch (r) {
            case 'admin':
                return <span className="bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1"><Shield className="h-3 w-3" /> Admin</span>;
            case 'editor':
                return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1"><User className="h-3 w-3" /> Editor</span>;
            case 'reader':
            default:
                return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Leitor</span>;
        }
    };

    const getRoleDesc = (r: string) => {
        switch (r) {
            case 'admin': return 'Acesso total na plataforma (exceto faturamento).';
            case 'editor': return 'Pode criar campanhas, responder DMs e adicionar conhecimento.';
            case 'reader': return 'Pode apenas visualizar relatórios e tabelas.';
            default: return '';
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col gap-6">
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">Equipe e Convidados</h3>
                    <p className="text-sm text-slate-400">
                        Adicione membros da sua equipe ou clientes para visualizarem/operarem este Workspace.
                        Se o usuário ainda não tiver conta, <strong>um convite será enviado por e-mail automaticamente.</strong>
                    </p>
                </div>

                {/* Form to add user */}
                <form onSubmit={handleAdd} className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">E-mail do Convidado</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ex: joao@email.com"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                            required
                        />
                    </div>
                    <div className="w-full md:w-64 space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Permissão</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors appearance-none"
                        >
                            <option value="reader">Leitor (Apenas Visualização)</option>
                            <option value="editor">Editor (Operador / Cria Campanha)</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl h-[46px] w-full md:w-auto px-6 font-semibold"
                    >
                        <UserPlus className="h-5 w-5 mr-2" />
                        {loading ? "Adicionando..." : "Convidar"}
                    </Button>
                </form>

                {/* Invite link for existing confirmed users */}
                {inviteLink && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center gap-2 text-amber-400">
                            <Link2 className="h-4 w-4 flex-shrink-0" />
                            <p className="text-sm font-semibold">Este usuário já tem conta — compartilhe o link de acesso:</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                readOnly
                                value={inviteLink}
                                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono truncate focus:outline-none"
                            />
                            <Button
                                type="button"
                                onClick={handleCopy}
                                className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl px-4 h-9 font-semibold flex-shrink-0"
                            >
                                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                        <p className="text-xs text-slate-500">O link expira em 1 hora. Envie via WhatsApp ou e-mail.</p>
                    </div>
                )}

                {/* Members List */}
                <div className="mt-4">
                    <h4 className="text-sm font-semibold text-slate-300 mb-4 px-1">Membros Atuais ({members.length})</h4>

                    {members.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
                            Você é o único membro operando esse ambiente. Tudo certo!
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {members.map((member) => (
                                <li key={member.id} className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-400 font-bold uppercase text-lg">
                                            {member.email.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white text-sm">{member.email}</p>
                                            <p className="text-xs text-slate-500">{getRoleDesc(member.role)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                        {getRoleBadge(member.role)}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-slate-500 hover:text-red-500 hover:bg-red-500/10 h-8 w-8 transition-colors flex-shrink-0"
                                            onClick={() => handleRemove(member.id, member.email)}
                                            disabled={loading}
                                            title="Remover Acesso"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
