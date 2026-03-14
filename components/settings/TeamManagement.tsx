"use client";

import { useState } from "react";
import { addTeamMember, removeTeamMember, updateMemberIntegrations } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserPlus, Shield, User, Trash2, ShieldAlert, Copy, Check, Link2, Settings2, X, Building2 } from "lucide-react";

type Integration = {
    id: string;
    client_name: string | null;
    ad_account_id: string | null;
};

type Member = {
    id: string;
    user_id: string;
    email: string;
    role: string;
    allowed_integration_ids: string[] | null;
    created_at: string;
};

export function TeamManagement({ members, integrations }: { members: Member[]; integrations: Integration[] }) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("reader");
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
    const [editingAllowed, setEditingAllowed] = useState<string[]>([]);
    const [savingAccess, setSavingAccess] = useState(false);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return toast.error("Digite o e-mail do usuário.");

        setLoading(true);
        setInviteLink(null);
        try {
            const result = await addTeamMember(email, role);
            if (result.success) {
                if (result.inviteLink) {
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

    const openAccessEditor = (member: Member) => {
        setEditingMemberId(member.id);
        // null = all access; we represent "all" as all integration IDs selected
        setEditingAllowed(member.allowed_integration_ids ?? integrations.map(i => i.id));
    };

    const toggleIntegration = (id: string) => {
        setEditingAllowed(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSaveAccess = async (memberId: string) => {
        setSavingAccess(true);
        try {
            // If all integrations are selected, save as null (unrestricted)
            const allSelected = integrations.every(i => editingAllowed.includes(i.id));
            const payload = allSelected ? null : editingAllowed;
            const result = await updateMemberIntegrations(memberId, payload);
            if (result.success) {
                toast.success("Acesso atualizado com sucesso.");
                setEditingMemberId(null);
            } else {
                toast.error(result.error || "Erro ao salvar acesso.");
            }
        } finally {
            setSavingAccess(false);
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

    const getAccessLabel = (member: Member) => {
        if (!member.allowed_integration_ids || member.allowed_integration_ids.length === 0) {
            return "Todas as contas";
        }
        if (member.allowed_integration_ids.length === integrations.length) {
            return "Todas as contas";
        }
        const names = member.allowed_integration_ids.map(id => {
            const integ = integrations.find(i => i.id === id);
            return integ?.client_name || integ?.ad_account_id || id.slice(0, 8);
        });
        return names.join(", ");
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
                                <li key={member.id} className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden">
                                    <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-400 font-bold uppercase text-lg">
                                                {member.email.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white text-sm">{member.email}</p>
                                                <p className="text-xs text-slate-500">{getRoleDesc(member.role)}</p>
                                                {integrations.length > 0 && (
                                                    <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                                                        <Building2 className="h-3 w-3" />
                                                        {getAccessLabel(member)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                            {getRoleBadge(member.role)}
                                            {integrations.length > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 h-8 w-8 transition-colors flex-shrink-0"
                                                    onClick={() => editingMemberId === member.id ? setEditingMemberId(null) : openAccessEditor(member)}
                                                    title="Gerenciar Contas"
                                                >
                                                    {editingMemberId === member.id ? <X className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
                                                </Button>
                                            )}
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
                                    </div>

                                    {/* Integration access editor */}
                                    {editingMemberId === member.id && integrations.length > 0 && (
                                        <div className="border-t border-slate-800 bg-slate-950/60 px-4 py-4 space-y-3">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contas que este membro pode acessar:</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {integrations.map((integ) => (
                                                    <label key={integ.id} className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-slate-800/60 transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={editingAllowed.includes(integ.id)}
                                                            onChange={() => toggleIntegration(integ.id)}
                                                            className="rounded border-slate-600 text-primary-600 focus:ring-primary-500 h-4 w-4 flex-shrink-0"
                                                        />
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <Building2 className="h-4 w-4 text-slate-500 flex-shrink-0" />
                                                            <span className="text-sm text-slate-300 truncate">
                                                                {integ.client_name || integ.ad_account_id || integ.id.slice(0, 8)}
                                                            </span>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                            <div className="flex justify-end gap-2 pt-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setEditingMemberId(null)}
                                                    className="text-slate-400 hover:text-white"
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSaveAccess(member.id)}
                                                    disabled={savingAccess || editingAllowed.length === 0}
                                                    className="bg-primary-600 hover:bg-primary-700 text-white"
                                                >
                                                    {savingAccess ? "Salvando..." : "Salvar Acesso"}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
